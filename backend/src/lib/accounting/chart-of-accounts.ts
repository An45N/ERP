import { prisma } from "../prisma";
import { logger } from "../logger";

export interface CreateAccountInput {
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  category: string;
  subCategory?: string;
  currency?: string;
  description?: string;
  parentId?: string;
  isSystem?: boolean;
}

export interface UpdateAccountInput {
  name?: string;
  category?: string;
  subCategory?: string;
  description?: string;
  isActive?: boolean;
}

export class ChartOfAccountsService {
  static async createAccount(input: CreateAccountInput) {
    const existingAccount = await prisma.account.findUnique({
      where: {
        tenantId_companyId_code: {
          tenantId: input.tenantId,
          companyId: input.companyId,
          code: input.code,
        },
      },
    });

    if (existingAccount) {
      throw new Error(`Account with code ${input.code} already exists`);
    }

    if (input.parentId) {
      const parent = await prisma.account.findUnique({
        where: { id: input.parentId },
      });

      if (!parent || parent.tenantId !== input.tenantId || parent.companyId !== input.companyId) {
        throw new Error("Invalid parent account");
      }
    }

    const account = await prisma.account.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        code: input.code,
        name: input.name,
        type: input.type,
        category: input.category,
        subCategory: input.subCategory ?? null,
        currency: input.currency || "MUR",
        description: input.description ?? null,
        parentId: input.parentId ?? null,
        isSystem: input.isSystem || false,
      },
    });

    logger.info(`Account created: ${account.code} - ${account.name}`);
    return account;
  }

  static async getAccounts(tenantId: string, companyId: string, filters?: {
    type?: string;
    category?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const where: any = {
      tenantId,
      companyId,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { name: { contains: filters.search } },
      ];
    }

    const accounts = await prisma.account.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: [
        { type: "asc" },
        { code: "asc" },
      ],
    });

    return accounts;
  }

  static async getAccountById(id: string, tenantId: string) {
    const account = await prisma.account.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    return account;
  }

  static async updateAccount(id: string, tenantId: string, input: UpdateAccountInput) {
    const account = await prisma.account.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    if (account.isSystem) {
      throw new Error("Cannot modify system accounts");
    }

    const updateData: Record<string, any> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.subCategory !== undefined) updateData.subCategory = input.subCategory;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updated = await prisma.account.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Account updated: ${updated.code} - ${updated.name}`);
    return updated;
  }

  static async deleteAccount(id: string, tenantId: string) {
    const account = await prisma.account.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        journalLines: true,
        children: true,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    if (account.isSystem) {
      throw new Error("Cannot delete system accounts");
    }

    if (account.journalLines.length > 0) {
      throw new Error("Cannot delete account with existing transactions");
    }

    if (account.children.length > 0) {
      throw new Error("Cannot delete account with child accounts");
    }

    await prisma.account.delete({
      where: { id },
    });

    logger.info(`Account deleted: ${account.code} - ${account.name}`);
  }

  static async createDefaultChartOfAccounts(tenantId: string, companyId: string) {
    logger.info(`Creating default chart of accounts for company ${companyId}`);

    const defaultAccounts = [
      { code: "1000", name: "Assets", type: "ASSET", category: "Header" },
      { code: "1100", name: "Current Assets", type: "ASSET", category: "Header", parentCode: "1000" },
      { code: "1110", name: "Cash", type: "ASSET", category: "Cash", parentCode: "1100", isSystem: true },
      { code: "1120", name: "Bank Account", type: "ASSET", category: "Bank", parentCode: "1100", isSystem: true },
      { code: "1130", name: "Accounts Receivable", type: "ASSET", category: "AR", parentCode: "1100", isSystem: true },
      { code: "1140", name: "Inventory", type: "ASSET", category: "Inventory", parentCode: "1100" },
      { code: "1200", name: "Fixed Assets", type: "ASSET", category: "Header", parentCode: "1000" },
      { code: "1210", name: "Equipment", type: "ASSET", category: "FixedAsset", parentCode: "1200" },
      { code: "1220", name: "Accumulated Depreciation", type: "ASSET", category: "Depreciation", parentCode: "1200" },

      { code: "2000", name: "Liabilities", type: "LIABILITY", category: "Header" },
      { code: "2100", name: "Current Liabilities", type: "LIABILITY", category: "Header", parentCode: "2000" },
      { code: "2110", name: "Accounts Payable", type: "LIABILITY", category: "AP", parentCode: "2100", isSystem: true },
      { code: "2120", name: "VAT Payable", type: "LIABILITY", category: "Tax", parentCode: "2100", isSystem: true },
      { code: "2130", name: "Salaries Payable", type: "LIABILITY", category: "Payroll", parentCode: "2100" },
      { code: "2200", name: "Long-term Liabilities", type: "LIABILITY", category: "Header", parentCode: "2000" },
      { code: "2210", name: "Loans Payable", type: "LIABILITY", category: "Loan", parentCode: "2200" },

      { code: "3000", name: "Equity", type: "EQUITY", category: "Header" },
      { code: "3100", name: "Share Capital", type: "EQUITY", category: "Capital", parentCode: "3000" },
      { code: "3200", name: "Retained Earnings", type: "EQUITY", category: "RetainedEarnings", parentCode: "3000", isSystem: true },
      { code: "3300", name: "Current Year Earnings", type: "EQUITY", category: "CurrentEarnings", parentCode: "3000", isSystem: true },

      { code: "4000", name: "Revenue", type: "REVENUE", category: "Header" },
      { code: "4100", name: "Sales Revenue", type: "REVENUE", category: "Sales", parentCode: "4000", isSystem: true },
      { code: "4200", name: "Service Revenue", type: "REVENUE", category: "Service", parentCode: "4000" },
      { code: "4300", name: "Other Income", type: "REVENUE", category: "Other", parentCode: "4000" },

      { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE", category: "Header" },
      { code: "5100", name: "Purchases", type: "EXPENSE", category: "COGS", parentCode: "5000" },
      { code: "5200", name: "Direct Labor", type: "EXPENSE", category: "COGS", parentCode: "5000" },

      { code: "6000", name: "Operating Expenses", type: "EXPENSE", category: "Header" },
      { code: "6100", name: "Salaries & Wages", type: "EXPENSE", category: "Payroll", parentCode: "6000" },
      { code: "6200", name: "Rent Expense", type: "EXPENSE", category: "Rent", parentCode: "6000" },
      { code: "6300", name: "Utilities", type: "EXPENSE", category: "Utilities", parentCode: "6000" },
      { code: "6400", name: "Office Supplies", type: "EXPENSE", category: "Supplies", parentCode: "6000" },
      { code: "6500", name: "Depreciation Expense", type: "EXPENSE", category: "Depreciation", parentCode: "6000" },
      { code: "6600", name: "Marketing & Advertising", type: "EXPENSE", category: "Marketing", parentCode: "6000" },
      { code: "6700", name: "Professional Fees", type: "EXPENSE", category: "Professional", parentCode: "6000" },
      { code: "6800", name: "Insurance", type: "EXPENSE", category: "Insurance", parentCode: "6000" },
      { code: "6900", name: "Miscellaneous Expenses", type: "EXPENSE", category: "Miscellaneous", parentCode: "6000" },
    ];

    const accountMap = new Map<string, string>();

    for (const acc of defaultAccounts) {
      const parentId = acc.parentCode ? accountMap.get(acc.parentCode) : undefined;

      const accountData: CreateAccountInput = {
        tenantId,
        companyId,
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        category: acc.category,
        isSystem: acc.isSystem || false,
      };

      if (parentId) {
        accountData.parentId = parentId;
      }

      const account = await this.createAccount(accountData);

      accountMap.set(acc.code, account.id);
    }

    logger.info(`Created ${defaultAccounts.length} default accounts`);
    return defaultAccounts.length;
  }
}
