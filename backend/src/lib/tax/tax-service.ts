import { prisma } from "../prisma";
import { logger } from "../logger";

export interface CreateTaxRateInput {
  tenantId: string;
  companyId: string;
  code: string;
  name: string;
  rate: number;
  taxType: string;
  effectiveFrom: Date;
  effectiveTo?: Date | undefined;
  description?: string | undefined;
  taxAccountId?: string | undefined;
  isDefault?: boolean | undefined;
}

export interface UpdateTaxRateInput {
  name?: string | undefined;
  rate?: number | undefined;
  effectiveTo?: Date | undefined;
  description?: string | undefined;
  taxAccountId?: string | undefined;
  isDefault?: boolean | undefined;
  isActive?: boolean | undefined;
}

export interface RecordTaxTransactionInput {
  tenantId: string;
  companyId: string;
  taxRateId: string;
  transactionDate: Date;
  transactionType: string;
  referenceType?: string | undefined;
  referenceId?: string | undefined;
  referenceNumber?: string | undefined;
  baseAmount: number;
  taxRate: number;
  notes?: string | undefined;
}

export class TaxService {
  static async createTaxRate(input: CreateTaxRateInput) {
    const existingTaxRate = await prisma.taxRate.findFirst({
      where: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        code: input.code,
      },
    });

    if (existingTaxRate) {
      throw new Error("Tax rate with this code already exists");
    }

    if (input.taxAccountId) {
      const taxAccount = await prisma.account.findFirst({
        where: {
          id: input.taxAccountId,
          tenantId: input.tenantId,
          companyId: input.companyId,
          isActive: true,
        },
      });

      if (!taxAccount) {
        throw new Error("Tax account not found or invalid");
      }
    }

    if (input.isDefault) {
      await prisma.taxRate.updateMany({
        where: {
          tenantId: input.tenantId,
          companyId: input.companyId,
          taxType: input.taxType,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const taxRate = await prisma.taxRate.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        code: input.code,
        name: input.name,
        rate: input.rate,
        taxType: input.taxType,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo ?? null,
        description: input.description ?? null,
        taxAccountId: input.taxAccountId ?? null,
        isDefault: input.isDefault || false,
        isActive: true,
      },
      include: {
        taxAccount: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Tax rate created: ${taxRate.code} - ${taxRate.name} (${taxRate.rate}%)`);
    return taxRate;
  }

  static async getTaxRates(tenantId: string, companyId: string, filters?: {
    taxType?: string | undefined;
    isActive?: boolean | undefined;
    asOfDate?: Date | undefined;
  }) {
    const where: any = {
      tenantId,
      companyId,
    };

    if (filters?.taxType) {
      where.taxType = filters.taxType;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.asOfDate) {
      where.effectiveFrom = { lte: filters.asOfDate };
      where.OR = [
        { effectiveTo: null },
        { effectiveTo: { gte: filters.asOfDate } },
      ];
    }

    const taxRates = await prisma.taxRate.findMany({
      where,
      include: {
        taxAccount: {
          select: {
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            taxTransactions: true,
          },
        },
      },
      orderBy: [
        { taxType: "asc" },
        { code: "asc" },
      ],
    });

    return taxRates;
  }

  static async getTaxRateById(id: string, tenantId: string) {
    const taxRate = await prisma.taxRate.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        taxAccount: {
          select: {
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            taxTransactions: true,
          },
        },
      },
    });

    if (!taxRate) {
      throw new Error("Tax rate not found");
    }

    return taxRate;
  }

  static async updateTaxRate(id: string, tenantId: string, input: UpdateTaxRateInput) {
    const taxRate = await prisma.taxRate.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!taxRate) {
      throw new Error("Tax rate not found");
    }

    if (input.taxAccountId) {
      const taxAccount = await prisma.account.findFirst({
        where: {
          id: input.taxAccountId,
          tenantId,
          companyId: taxRate.companyId,
          isActive: true,
        },
      });

      if (!taxAccount) {
        throw new Error("Tax account not found or invalid");
      }
    }

    if (input.isDefault) {
      await prisma.taxRate.updateMany({
        where: {
          tenantId,
          companyId: taxRate.companyId,
          taxType: taxRate.taxType,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.rate !== undefined) updateData.rate = input.rate;
    if (input.effectiveTo !== undefined) updateData.effectiveTo = input.effectiveTo ?? null;
    if (input.description !== undefined) updateData.description = input.description ?? null;
    if (input.taxAccountId !== undefined) updateData.taxAccountId = input.taxAccountId ?? null;
    if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updated = await prisma.taxRate.update({
      where: { id },
      data: updateData,
      include: {
        taxAccount: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Tax rate updated: ${updated.code} - ${updated.name}`);
    return updated;
  }

  static async deleteTaxRate(id: string, tenantId: string) {
    const taxRate = await prisma.taxRate.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            taxTransactions: true,
          },
        },
      },
    });

    if (!taxRate) {
      throw new Error("Tax rate not found");
    }

    if (taxRate._count.taxTransactions > 0) {
      throw new Error("Cannot delete tax rate with existing transactions. Deactivate instead.");
    }

    await prisma.taxRate.delete({
      where: { id },
    });

    logger.info(`Tax rate deleted: ${taxRate.code} - ${taxRate.name}`);
  }

  static async getDefaultTaxRate(tenantId: string, companyId: string, taxType: string) {
    const today = new Date();

    const taxRate = await prisma.taxRate.findFirst({
      where: {
        tenantId,
        companyId,
        taxType,
        isDefault: true,
        isActive: true,
        effectiveFrom: { lte: today },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: today } },
        ],
      },
    });

    return taxRate;
  }

  static calculateTax(baseAmount: number, taxRate: number): {
    taxAmount: number;
    totalAmount: number;
  } {
    const taxAmount = baseAmount * (taxRate / 100);
    const totalAmount = baseAmount + taxAmount;

    return {
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  static async recordTaxTransaction(input: RecordTaxTransactionInput) {
    const taxRate = await prisma.taxRate.findFirst({
      where: {
        id: input.taxRateId,
        tenantId: input.tenantId,
        companyId: input.companyId,
      },
    });

    if (!taxRate) {
      throw new Error("Tax rate not found");
    }

    const { taxAmount, totalAmount } = this.calculateTax(input.baseAmount, input.taxRate);

    const taxTransaction = await prisma.taxTransaction.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        taxRateId: input.taxRateId,
        transactionDate: input.transactionDate,
        transactionType: input.transactionType,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        referenceNumber: input.referenceNumber ?? null,
        baseAmount: input.baseAmount,
        taxAmount,
        totalAmount,
        taxRate: input.taxRate,
        notes: input.notes ?? null,
      },
    });

    logger.info(`Tax transaction recorded: ${input.transactionType} - ${taxAmount} (${input.taxRate}%)`);
    return taxTransaction;
  }

  static async getTaxTransactions(
    tenantId: string,
    companyId: string,
    filters?: {
      taxRateId?: string | undefined;
      transactionType?: string | undefined;
      startDate?: Date | undefined;
      endDate?: Date | undefined;
    }
  ) {
    const where: any = {
      tenantId,
      companyId,
      isReversed: false,
    };

    if (filters?.taxRateId) {
      where.taxRateId = filters.taxRateId;
    }

    if (filters?.transactionType) {
      where.transactionType = filters.transactionType;
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

    const transactions = await prisma.taxTransaction.findMany({
      where,
      include: {
        taxRateConfig: {
          select: {
            code: true,
            name: true,
            taxType: true,
          },
        },
      },
      orderBy: [
        { transactionDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return transactions;
  }

  static async reverseTaxTransaction(id: string, tenantId: string) {
    const transaction = await prisma.taxTransaction.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!transaction) {
      throw new Error("Tax transaction not found");
    }

    if (transaction.isReversed) {
      throw new Error("Tax transaction already reversed");
    }

    await prisma.taxTransaction.update({
      where: { id },
      data: {
        isReversed: true,
        reversedAt: new Date(),
      },
    });

    logger.info(`Tax transaction reversed: ${id}`);
  }
}
