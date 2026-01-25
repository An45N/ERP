import { prisma } from "../prisma";
import { logger } from "../logger";

export interface GeneralLedgerFilters {
  accountId?: string | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  fiscalPeriodId?: string | undefined;
  status?: string | undefined;
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GeneralLedgerEntry {
  entryDate: Date;
  entryNumber: string;
  entryType: string;
  reference: string | null;
  description: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
}

export class GeneralLedgerService {
  static async getAccountBalance(
    tenantId: string,
    companyId: string,
    accountId: string,
    asOfDate?: Date | undefined
  ): Promise<number> {
    const where: any = {
      journalEntry: {
        tenantId,
        companyId,
        status: "POSTED",
      },
      accountId,
    };

    if (asOfDate) {
      where.journalEntry.entryDate = {
        lte: asOfDate,
      };
    }

    const lines = await prisma.journalLine.findMany({
      where,
      select: {
        debit: true,
        credit: true,
      },
    });

    let balance = 0;
    for (const line of lines) {
      balance += parseFloat(line.debit.toString()) - parseFloat(line.credit.toString());
    }

    return balance;
  }

  static async getAccountBalances(
    tenantId: string,
    companyId: string,
    asOfDate?: Date | undefined
  ): Promise<AccountBalance[]> {
    const accounts = await prisma.account.findMany({
      where: {
        tenantId,
        companyId,
        isActive: true,
      },
      orderBy: [
        { code: "asc" },
      ],
    });

    const balances: AccountBalance[] = [];

    for (const account of accounts) {
      const where: any = {
        journalEntry: {
          tenantId,
          companyId,
          status: "POSTED",
        },
        accountId: account.id,
      };

      if (asOfDate) {
        where.journalEntry.entryDate = {
          lte: asOfDate,
        };
      }

      const lines = await prisma.journalLine.findMany({
        where,
        select: {
          debit: true,
          credit: true,
        },
      });

      let totalDebit = 0;
      let totalCredit = 0;

      for (const line of lines) {
        totalDebit += parseFloat(line.debit.toString());
        totalCredit += parseFloat(line.credit.toString());
      }

      const balance = totalDebit - totalCredit;

      if (totalDebit !== 0 || totalCredit !== 0 || balance !== 0) {
        balances.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          debit: totalDebit,
          credit: totalCredit,
          balance,
        });
      }
    }

    return balances;
  }

  static async getGeneralLedger(
    tenantId: string,
    companyId: string,
    filters?: GeneralLedgerFilters | undefined
  ): Promise<GeneralLedgerEntry[]> {
    const where: any = {
      journalEntry: {
        tenantId,
        companyId,
        status: filters?.status || "POSTED",
      },
    };

    if (filters?.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.journalEntry.entryDate = {};
      if (filters.startDate) {
        where.journalEntry.entryDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.journalEntry.entryDate.lte = filters.endDate;
      }
    }

    if (filters?.fiscalPeriodId) {
      where.journalEntry.fiscalPeriodId = filters.fiscalPeriodId;
    }

    const lines = await prisma.journalLine.findMany({
      where,
      include: {
        journalEntry: {
          select: {
            entryDate: true,
            entryNumber: true,
            entryType: true,
            reference: true,
            description: true,
          },
        },
        account: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: [
        { journalEntry: { entryDate: "asc" } },
        { journalEntry: { entryNumber: "asc" } },
        { lineNumber: "asc" },
      ],
    });

    let runningBalance = 0;
    if (filters?.accountId && filters?.startDate) {
      runningBalance = await this.getAccountBalance(
        tenantId,
        companyId,
        filters.accountId,
        new Date(filters.startDate.getTime() - 1)
      );
    }

    const entries: GeneralLedgerEntry[] = lines.map((line) => {
      const debit = parseFloat(line.debit.toString());
      const credit = parseFloat(line.credit.toString());
      runningBalance += debit - credit;

      return {
        entryDate: line.journalEntry.entryDate,
        entryNumber: line.journalEntry.entryNumber,
        entryType: line.journalEntry.entryType,
        reference: line.journalEntry.reference,
        description: line.description || line.journalEntry.description,
        accountCode: line.account.code,
        accountName: line.account.name,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    return entries;
  }

  static async getAccountActivity(
    tenantId: string,
    companyId: string,
    accountId: string,
    startDate?: Date | undefined,
    endDate?: Date | undefined
  ): Promise<{
    account: any;
    openingBalance: number;
    closingBalance: number;
    transactions: GeneralLedgerEntry[];
  }> {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        tenantId,
        companyId,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    const openingBalance = startDate
      ? await this.getAccountBalance(
          tenantId,
          companyId,
          accountId,
          new Date(startDate.getTime() - 1)
        )
      : 0;

    const transactions = await this.getGeneralLedger(tenantId, companyId, {
      accountId,
      startDate,
      endDate,
      status: "POSTED",
    });

    const closingBalance = await this.getAccountBalance(
      tenantId,
      companyId,
      accountId,
      endDate
    );

    return {
      account,
      openingBalance,
      closingBalance,
      transactions,
    };
  }
}
