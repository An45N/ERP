import { prisma } from "../prisma";
import { logger } from "../logger";

export interface BankTransactionInput {
  transactionDate: Date;
  description: string;
  reference?: string | undefined;
  debit: number;
  credit: number;
  balance?: number | undefined;
  valueDate?: Date | undefined;
}

export interface ImportBankStatementInput {
  tenantId: string;
  companyId: string;
  bankAccountId: string;
  transactions: BankTransactionInput[];
  importBatch: string;
}

export interface StartReconciliationInput {
  tenantId: string;
  companyId: string;
  bankAccountId: string;
  statementDate: Date;
  statementBalance: number;
  reconciledBy: string;
}

export interface MatchTransactionInput {
  bankTransactionId: string;
  journalEntryId?: string | undefined;
}

export class BankReconciliationService {
  static async importBankStatement(input: ImportBankStatementInput) {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: input.bankAccountId,
        tenantId: input.tenantId,
        companyId: input.companyId,
      },
    });

    if (!bankAccount) {
      throw new Error("Bank account not found");
    }

    const existingBatch = await prisma.bankTransaction.findFirst({
      where: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        bankAccountId: input.bankAccountId,
        importBatch: input.importBatch,
      },
    });

    if (existingBatch) {
      throw new Error("Import batch already exists. Use a different batch identifier.");
    }

    const transactionsData = input.transactions.map((txn) => ({
      tenantId: input.tenantId,
      companyId: input.companyId,
      bankAccountId: input.bankAccountId,
      transactionDate: txn.transactionDate,
      valueDate: txn.valueDate ?? null,
      description: txn.description,
      reference: txn.reference ?? null,
      debit: txn.debit,
      credit: txn.credit,
      balance: txn.balance ?? null,
      isReconciled: false,
      importBatch: input.importBatch,
    }));

    const result = await prisma.bankTransaction.createMany({
      data: transactionsData,
    });

    logger.info(`Imported ${result.count} bank transactions for account ${bankAccount.accountNumber}`);
    return result;
  }

  static async getBankTransactions(
    tenantId: string,
    companyId: string,
    bankAccountId: string,
    filters?: {
      isReconciled?: boolean | undefined;
      startDate?: Date | undefined;
      endDate?: Date | undefined;
    }
  ) {
    const where: any = {
      tenantId,
      companyId,
      bankAccountId,
    };

    if (filters?.isReconciled !== undefined) {
      where.isReconciled = filters.isReconciled;
    }

    if (filters?.startDate || filters?.endDate) {
      where.transactionDate = {};
      if (filters.startDate) {
        where.transactionDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.transactionDate.lte = filters.endDate;
      }
    }

    const transactions = await prisma.bankTransaction.findMany({
      where,
      orderBy: [
        { transactionDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return transactions;
  }

  static async startReconciliation(input: StartReconciliationInput) {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: input.bankAccountId,
        tenantId: input.tenantId,
        companyId: input.companyId,
      },
    });

    if (!bankAccount) {
      throw new Error("Bank account not found");
    }

    const glAccount = await prisma.account.findFirst({
      where: {
        id: bankAccount.glAccountId,
        tenantId: input.tenantId,
      },
    });

    if (!glAccount) {
      throw new Error("GL account not found");
    }

    const glBalance = await this.calculateGLBalance(
      input.tenantId,
      input.companyId,
      bankAccount.glAccountId,
      input.statementDate
    );

    const unreconciledTransactions = await prisma.bankTransaction.findMany({
      where: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        bankAccountId: input.bankAccountId,
        isReconciled: false,
        transactionDate: {
          lte: input.statementDate,
        },
      },
    });

    let adjustedGLBalance = glBalance;
    for (const txn of unreconciledTransactions) {
      const debit = parseFloat(txn.debit.toString());
      const credit = parseFloat(txn.credit.toString());
      adjustedGLBalance += debit - credit;
    }

    const difference = input.statementBalance - adjustedGLBalance;

    const reconciliation = await prisma.bankReconciliation.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        bankAccountId: input.bankAccountId,
        reconciliationDate: new Date(),
        statementDate: input.statementDate,
        statementBalance: input.statementBalance,
        glBalance,
        adjustedGLBalance,
        difference,
        status: "IN_PROGRESS",
        reconciledBy: input.reconciledBy,
      },
    });

    logger.info(`Started reconciliation for bank account ${bankAccount.accountNumber}`);
    return reconciliation;
  }

  static async matchTransaction(
    reconciliationId: string,
    tenantId: string,
    bankTransactionId: string,
    journalEntryId?: string | undefined
  ) {
    const reconciliation = await prisma.bankReconciliation.findFirst({
      where: {
        id: reconciliationId,
        tenantId,
      },
    });

    if (!reconciliation) {
      throw new Error("Reconciliation not found");
    }

    if (reconciliation.status === "COMPLETED") {
      throw new Error("Cannot modify completed reconciliation");
    }

    const bankTransaction = await prisma.bankTransaction.findFirst({
      where: {
        id: bankTransactionId,
        tenantId,
        bankAccountId: reconciliation.bankAccountId,
      },
    });

    if (!bankTransaction) {
      throw new Error("Bank transaction not found");
    }

    await prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: {
        isReconciled: true,
        reconciledAt: new Date(),
        reconciliationId,
        journalEntryId: journalEntryId ?? null,
      },
    });

    logger.info(`Matched bank transaction ${bankTransactionId} in reconciliation ${reconciliationId}`);
  }

  static async unmatchTransaction(
    tenantId: string,
    bankTransactionId: string
  ) {
    const bankTransaction = await prisma.bankTransaction.findFirst({
      where: {
        id: bankTransactionId,
        tenantId,
      },
    });

    if (!bankTransaction) {
      throw new Error("Bank transaction not found");
    }

    if (!bankTransaction.isReconciled) {
      throw new Error("Transaction is not reconciled");
    }

    const reconciliation = bankTransaction.reconciliationId
      ? await prisma.bankReconciliation.findUnique({
          where: { id: bankTransaction.reconciliationId },
        })
      : null;

    if (reconciliation && reconciliation.status === "COMPLETED") {
      throw new Error("Cannot unmatch transaction from completed reconciliation");
    }

    await prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: {
        isReconciled: false,
        reconciledAt: null,
        reconciliationId: null,
        journalEntryId: null,
      },
    });

    logger.info(`Unmatched bank transaction ${bankTransactionId}`);
  }

  static async completeReconciliation(reconciliationId: string, tenantId: string) {
    const reconciliation = await prisma.bankReconciliation.findFirst({
      where: {
        id: reconciliationId,
        tenantId,
      },
      include: {
        bankAccount: true,
      },
    });

    if (!reconciliation) {
      throw new Error("Reconciliation not found");
    }

    if (reconciliation.status === "COMPLETED") {
      throw new Error("Reconciliation already completed");
    }

    const unreconciledCount = await prisma.bankTransaction.count({
      where: {
        tenantId,
        bankAccountId: reconciliation.bankAccountId,
        transactionDate: {
          lte: reconciliation.statementDate,
        },
        isReconciled: false,
      },
    });

    if (unreconciledCount > 0) {
      throw new Error(`Cannot complete reconciliation. ${unreconciledCount} unreconciled transactions remaining.`);
    }

    if (Math.abs(parseFloat(reconciliation.difference.toString())) > 0.01) {
      throw new Error(`Cannot complete reconciliation. Difference of ${reconciliation.difference} must be resolved.`);
    }

    await prisma.bankReconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: "COMPLETED",
      },
    });

    await prisma.bankAccount.update({
      where: { id: reconciliation.bankAccountId },
      data: {
        lastReconciledAt: new Date(),
        lastReconciledBalance: reconciliation.statementBalance,
      },
    });

    logger.info(`Completed reconciliation ${reconciliationId} for bank account ${reconciliation.bankAccount.accountNumber}`);
  }

  static async getReconciliations(
    tenantId: string,
    companyId: string,
    bankAccountId?: string | undefined
  ) {
    const where: any = {
      tenantId,
      companyId,
    };

    if (bankAccountId) {
      where.bankAccountId = bankAccountId;
    }

    const reconciliations = await prisma.bankReconciliation.findMany({
      where,
      include: {
        bankAccount: {
          select: {
            accountNumber: true,
            accountName: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: [
        { reconciliationDate: "desc" },
      ],
    });

    return reconciliations;
  }

  static async getReconciliationById(id: string, tenantId: string) {
    const reconciliation = await prisma.bankReconciliation.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        bankAccount: true,
        transactions: {
          orderBy: {
            transactionDate: "asc",
          },
        },
      },
    });

    if (!reconciliation) {
      throw new Error("Reconciliation not found");
    }

    return reconciliation;
  }

  private static async calculateGLBalance(
    tenantId: string,
    companyId: string,
    accountId: string,
    asOfDate: Date
  ): Promise<number> {
    const journalLines = await prisma.journalLine.findMany({
      where: {
        accountId,
        journalEntry: {
          tenantId,
          companyId,
          entryDate: {
            lte: asOfDate,
          },
          status: "POSTED",
        },
      },
      select: {
        debit: true,
        credit: true,
      },
    });

    let balance = 0;
    for (const line of journalLines) {
      balance += parseFloat(line.debit.toString()) - parseFloat(line.credit.toString());
    }

    return balance;
  }

  static async suggestMatches(
    tenantId: string,
    companyId: string,
    bankAccountId: string,
    bankTransactionId: string
  ) {
    const bankTransaction = await prisma.bankTransaction.findFirst({
      where: {
        id: bankTransactionId,
        tenantId,
        companyId,
        bankAccountId,
      },
    });

    if (!bankTransaction) {
      throw new Error("Bank transaction not found");
    }

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (!bankAccount) {
      throw new Error("Bank account not found");
    }

    const amount = parseFloat(bankTransaction.debit.toString()) || parseFloat(bankTransaction.credit.toString());
    const isDebit = parseFloat(bankTransaction.debit.toString()) > 0;

    const dateTolerance = 7;
    const startDate = new Date(bankTransaction.transactionDate);
    startDate.setDate(startDate.getDate() - dateTolerance);
    const endDate = new Date(bankTransaction.transactionDate);
    endDate.setDate(endDate.getDate() + dateTolerance);

    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        companyId,
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
        status: "POSTED",
        lines: {
          some: {
            accountId: bankAccount.glAccountId,
            ...(isDebit
              ? { debit: { gte: amount * 0.99, lte: amount * 1.01 } }
              : { credit: { gte: amount * 0.99, lte: amount * 1.01 } }),
          },
        },
      },
      include: {
        lines: {
          where: {
            accountId: bankAccount.glAccountId,
          },
        },
      },
      take: 10,
    });

    return journalEntries;
  }
}
