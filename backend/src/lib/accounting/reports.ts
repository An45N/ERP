import { prisma } from "../prisma";
import { GeneralLedgerService, AccountBalance } from "./general-ledger";

export interface TrialBalanceEntry {
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
}

export interface BalanceSheetData {
  asOfDate: Date;
  assets: {
    current: AccountBalance[];
    nonCurrent: AccountBalance[];
    total: number;
  };
  liabilities: {
    current: AccountBalance[];
    nonCurrent: AccountBalance[];
    total: number;
  };
  equity: {
    accounts: AccountBalance[];
    retainedEarnings: number;
    total: number;
  };
  totalLiabilitiesAndEquity: number;
}

export interface IncomeStatementData {
  startDate: Date;
  endDate: Date;
  revenue: {
    accounts: AccountBalance[];
    total: number;
  };
  expenses: {
    accounts: AccountBalance[];
    total: number;
  };
  netIncome: number;
}

export class ReportService {
  static async getTrialBalance(
    tenantId: string,
    companyId: string,
    asOfDate?: Date | undefined
  ): Promise<{
    asOfDate: Date;
    entries: TrialBalanceEntry[];
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  }> {
    const balances = await GeneralLedgerService.getAccountBalances(
      tenantId,
      companyId,
      asOfDate
    );

    const entries: TrialBalanceEntry[] = balances.map((balance) => ({
      accountCode: balance.accountCode,
      accountName: balance.accountName,
      accountType: balance.accountType,
      debit: balance.balance >= 0 ? balance.balance : 0,
      credit: balance.balance < 0 ? Math.abs(balance.balance) : 0,
    }));

    const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return {
      asOfDate: asOfDate || new Date(),
      entries,
      totalDebits,
      totalCredits,
      isBalanced,
    };
  }

  static async getBalanceSheet(
    tenantId: string,
    companyId: string,
    asOfDate?: Date | undefined
  ): Promise<BalanceSheetData> {
    const balances = await GeneralLedgerService.getAccountBalances(
      tenantId,
      companyId,
      asOfDate
    );

    const currentAssets = balances.filter(
      (b) =>
        b.accountType === "ASSET" &&
        (b.accountCode.startsWith("1000") ||
          b.accountCode.startsWith("1100") ||
          b.accountCode.startsWith("1200") ||
          b.accountCode.startsWith("1300"))
    );

    const nonCurrentAssets = balances.filter(
      (b) =>
        b.accountType === "ASSET" &&
        !currentAssets.find((ca) => ca.accountId === b.accountId)
    );

    const currentLiabilities = balances.filter(
      (b) =>
        b.accountType === "LIABILITY" &&
        (b.accountCode.startsWith("2000") ||
          b.accountCode.startsWith("2100") ||
          b.accountCode.startsWith("2200"))
    );

    const nonCurrentLiabilities = balances.filter(
      (b) =>
        b.accountType === "LIABILITY" &&
        !currentLiabilities.find((cl) => cl.accountId === b.accountId)
    );

    const equityAccounts = balances.filter((b) => b.accountType === "EQUITY");

    const totalAssets =
      currentAssets.reduce((sum, a) => sum + a.balance, 0) +
      nonCurrentAssets.reduce((sum, a) => sum + a.balance, 0);

    const totalLiabilities =
      currentLiabilities.reduce((sum, l) => sum + Math.abs(l.balance), 0) +
      nonCurrentLiabilities.reduce((sum, l) => sum + Math.abs(l.balance), 0);

    const incomeStatement = await this.getIncomeStatement(
      tenantId,
      companyId,
      undefined,
      asOfDate
    );
    const retainedEarnings = incomeStatement.netIncome;

    const totalEquity =
      equityAccounts.reduce((sum, e) => sum + Math.abs(e.balance), 0) +
      retainedEarnings;

    return {
      asOfDate: asOfDate || new Date(),
      assets: {
        current: currentAssets,
        nonCurrent: nonCurrentAssets,
        total: totalAssets,
      },
      liabilities: {
        current: currentLiabilities.map((l) => ({
          ...l,
          balance: Math.abs(l.balance),
        })),
        nonCurrent: nonCurrentLiabilities.map((l) => ({
          ...l,
          balance: Math.abs(l.balance),
        })),
        total: totalLiabilities,
      },
      equity: {
        accounts: equityAccounts.map((e) => ({
          ...e,
          balance: Math.abs(e.balance),
        })),
        retainedEarnings,
        total: totalEquity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
  }

  static async getIncomeStatement(
    tenantId: string,
    companyId: string,
    startDate?: Date | undefined,
    endDate?: Date | undefined
  ): Promise<IncomeStatementData> {
    const where: any = {
      journalEntry: {
        tenantId,
        companyId,
        status: "POSTED",
      },
    };

    if (startDate || endDate) {
      where.journalEntry.entryDate = {};
      if (startDate) {
        where.journalEntry.entryDate.gte = startDate;
      }
      if (endDate) {
        where.journalEntry.entryDate.lte = endDate;
      }
    }

    const lines = await prisma.journalLine.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
      },
    });

    const accountBalances = new Map<string, AccountBalance>();

    for (const line of lines) {
      const accountId = line.account.id;
      const accountType = line.account.type;

      if (accountType !== "REVENUE" && accountType !== "EXPENSE") {
        continue;
      }

      if (!accountBalances.has(accountId)) {
        accountBalances.set(accountId, {
          accountId,
          accountCode: line.account.code,
          accountName: line.account.name,
          accountType,
          debit: 0,
          credit: 0,
          balance: 0,
        });
      }

      const balance = accountBalances.get(accountId)!;
      balance.debit += parseFloat(line.debit.toString());
      balance.credit += parseFloat(line.credit.toString());
      balance.balance = balance.debit - balance.credit;
    }

    const revenueAccounts = Array.from(accountBalances.values())
      .filter((b) => b.accountType === "REVENUE")
      .map((b) => ({
        ...b,
        balance: Math.abs(b.balance),
      }));

    const expenseAccounts = Array.from(accountBalances.values())
      .filter((b) => b.accountType === "EXPENSE")
      .map((b) => ({
        ...b,
        balance: Math.abs(b.balance),
      }));

    const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      startDate: startDate || new Date(0),
      endDate: endDate || new Date(),
      revenue: {
        accounts: revenueAccounts,
        total: totalRevenue,
      },
      expenses: {
        accounts: expenseAccounts,
        total: totalExpenses,
      },
      netIncome,
    };
  }
}
