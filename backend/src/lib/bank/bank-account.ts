import { prisma } from "../prisma";
import { logger } from "../logger";

export interface CreateBankAccountInput {
  tenantId: string;
  companyId: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankBranch?: string | undefined;
  currency?: string | undefined;
  accountType: string;
  glAccountId: string;
  openingBalance?: number | undefined;
  notes?: string | undefined;
}

export interface UpdateBankAccountInput {
  accountName?: string | undefined;
  bankName?: string | undefined;
  bankBranch?: string | undefined;
  accountType?: string | undefined;
  notes?: string | undefined;
  isActive?: boolean | undefined;
}

export class BankAccountService {
  static async createBankAccount(input: CreateBankAccountInput) {
    const existingAccount = await prisma.bankAccount.findFirst({
      where: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        accountNumber: input.accountNumber,
      },
    });

    if (existingAccount) {
      throw new Error("Bank account with this account number already exists");
    }

    const glAccount = await prisma.account.findFirst({
      where: {
        id: input.glAccountId,
        tenantId: input.tenantId,
        companyId: input.companyId,
        category: "Cash",
        isActive: true,
      },
    });

    if (!glAccount) {
      throw new Error("GL Cash account not found or invalid");
    }

    const openingBalance = input.openingBalance || 0;

    const bankAccount = await prisma.bankAccount.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        accountNumber: input.accountNumber,
        accountName: input.accountName,
        bankName: input.bankName,
        bankBranch: input.bankBranch ?? null,
        currency: input.currency || "MUR",
        accountType: input.accountType,
        glAccountId: input.glAccountId,
        openingBalance,
        currentBalance: openingBalance,
        notes: input.notes ?? null,
        isActive: true,
      },
      include: {
        glAccount: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Bank account created: ${bankAccount.accountNumber} - ${bankAccount.accountName}`);
    return bankAccount;
  }

  static async getBankAccounts(tenantId: string, companyId: string, filters?: {
    isActive?: boolean | undefined;
  }) {
    const where: any = {
      tenantId,
      companyId,
    };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const bankAccounts = await prisma.bankAccount.findMany({
      where,
      include: {
        glAccount: {
          select: {
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            reconciliations: true,
          },
        },
      },
      orderBy: [
        { accountNumber: "asc" },
      ],
    });

    return bankAccounts;
  }

  static async getBankAccountById(id: string, tenantId: string) {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        glAccount: {
          select: {
            code: true,
            name: true,
          },
        },
        transactions: {
          where: {
            isReconciled: false,
          },
          orderBy: {
            transactionDate: "desc",
          },
          take: 20,
        },
        _count: {
          select: {
            transactions: true,
            reconciliations: true,
          },
        },
      },
    });

    if (!bankAccount) {
      throw new Error("Bank account not found");
    }

    return bankAccount;
  }

  static async updateBankAccount(id: string, tenantId: string, input: UpdateBankAccountInput) {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!bankAccount) {
      throw new Error("Bank account not found");
    }

    const updateData: any = {};
    if (input.accountName !== undefined) updateData.accountName = input.accountName;
    if (input.bankName !== undefined) updateData.bankName = input.bankName;
    if (input.bankBranch !== undefined) updateData.bankBranch = input.bankBranch ?? null;
    if (input.accountType !== undefined) updateData.accountType = input.accountType;
    if (input.notes !== undefined) updateData.notes = input.notes ?? null;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updated = await prisma.bankAccount.update({
      where: { id },
      data: updateData,
      include: {
        glAccount: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Bank account updated: ${updated.accountNumber} - ${updated.accountName}`);
    return updated;
  }

  static async deleteBankAccount(id: string, tenantId: string) {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!bankAccount) {
      throw new Error("Bank account not found");
    }

    if (bankAccount._count.transactions > 0) {
      throw new Error("Cannot delete bank account with existing transactions. Deactivate instead.");
    }

    await prisma.bankAccount.delete({
      where: { id },
    });

    logger.info(`Bank account deleted: ${bankAccount.accountNumber} - ${bankAccount.accountName}`);
  }

  static async updateBalance(bankAccountId: string, amount: number, isDebit: boolean) {
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (!bankAccount) {
      throw new Error("Bank account not found");
    }

    const currentBalance = parseFloat(bankAccount.currentBalance.toString());
    const newBalance = isDebit 
      ? currentBalance + amount 
      : currentBalance - amount;

    await prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: {
        currentBalance: newBalance,
      },
    });

    return newBalance;
  }
}
