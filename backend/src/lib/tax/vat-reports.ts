import { prisma } from "../prisma";

export interface VATReturnSummary {
  period: {
    startDate: Date;
    endDate: Date;
  };
  sales: {
    standardRated: number;
    zeroRated: number;
    exempt: number;
    total: number;
    outputVAT: number;
  };
  purchases: {
    standardRated: number;
    zeroRated: number;
    exempt: number;
    total: number;
    inputVAT: number;
  };
  vatSummary: {
    outputVAT: number;
    inputVAT: number;
    netVAT: number;
    vatPayable: number;
    vatRefundable: number;
  };
}

export interface VATTransactionDetail {
  date: Date;
  type: string;
  reference: string;
  description: string;
  baseAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
}

export class VATReportService {
  static async getVATReturn(
    tenantId: string,
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VATReturnSummary> {
    const transactions = await prisma.taxTransaction.findMany({
      where: {
        tenantId,
        companyId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        isReversed: false,
        taxRateConfig: {
          taxType: "VAT",
        },
      },
      include: {
        taxRateConfig: true,
      },
    });

    const sales = {
      standardRated: 0,
      zeroRated: 0,
      exempt: 0,
      total: 0,
      outputVAT: 0,
    };

    const purchases = {
      standardRated: 0,
      zeroRated: 0,
      exempt: 0,
      total: 0,
      inputVAT: 0,
    };

    for (const txn of transactions) {
      const baseAmount = parseFloat(txn.baseAmount.toString());
      const taxAmount = parseFloat(txn.taxAmount.toString());
      const rate = parseFloat(txn.taxRate.toString());

      if (txn.transactionType === "INVOICE") {
        if (rate > 0) {
          sales.standardRated += baseAmount;
          sales.outputVAT += taxAmount;
        } else {
          sales.zeroRated += baseAmount;
        }
        sales.total += baseAmount;
      } else if (txn.transactionType === "BILL") {
        if (rate > 0) {
          purchases.standardRated += baseAmount;
          purchases.inputVAT += taxAmount;
        } else {
          purchases.zeroRated += baseAmount;
        }
        purchases.total += baseAmount;
      }
    }

    const netVAT = sales.outputVAT - purchases.inputVAT;

    return {
      period: {
        startDate,
        endDate,
      },
      sales,
      purchases,
      vatSummary: {
        outputVAT: sales.outputVAT,
        inputVAT: purchases.inputVAT,
        netVAT,
        vatPayable: netVAT > 0 ? netVAT : 0,
        vatRefundable: netVAT < 0 ? Math.abs(netVAT) : 0,
      },
    };
  }

  static async getVATTransactionDetails(
    tenantId: string,
    companyId: string,
    startDate: Date,
    endDate: Date,
    transactionType?: string | undefined
  ): Promise<VATTransactionDetail[]> {
    const where: any = {
      tenantId,
      companyId,
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
      isReversed: false,
      taxRateConfig: {
        taxType: "VAT",
      },
    };

    if (transactionType) {
      where.transactionType = transactionType;
    }

    const transactions = await prisma.taxTransaction.findMany({
      where,
      include: {
        taxRateConfig: true,
      },
      orderBy: {
        transactionDate: "asc",
      },
    });

    return transactions.map((txn) => ({
      date: txn.transactionDate,
      type: txn.transactionType,
      reference: txn.referenceNumber || "",
      description: txn.notes || "",
      baseAmount: parseFloat(txn.baseAmount.toString()),
      vatRate: parseFloat(txn.taxRate.toString()),
      vatAmount: parseFloat(txn.taxAmount.toString()),
      totalAmount: parseFloat(txn.totalAmount.toString()),
    }));
  }

  static async getVATByRate(
    tenantId: string,
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const transactions = await prisma.taxTransaction.findMany({
      where: {
        tenantId,
        companyId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        isReversed: false,
        taxRateConfig: {
          taxType: "VAT",
        },
      },
      include: {
        taxRateConfig: true,
      },
    });

    const rateMap = new Map<string, {
      rate: number;
      rateName: string;
      salesBase: number;
      salesVAT: number;
      purchasesBase: number;
      purchasesVAT: number;
    }>();

    for (const txn of transactions) {
      const rate = parseFloat(txn.taxRate.toString());
      const rateKey = rate.toString();

      if (!rateMap.has(rateKey)) {
        rateMap.set(rateKey, {
          rate,
          rateName: txn.taxRateConfig.name,
          salesBase: 0,
          salesVAT: 0,
          purchasesBase: 0,
          purchasesVAT: 0,
        });
      }

      const bucket = rateMap.get(rateKey)!;
      const baseAmount = parseFloat(txn.baseAmount.toString());
      const taxAmount = parseFloat(txn.taxAmount.toString());

      if (txn.transactionType === "INVOICE") {
        bucket.salesBase += baseAmount;
        bucket.salesVAT += taxAmount;
      } else if (txn.transactionType === "BILL") {
        bucket.purchasesBase += baseAmount;
        bucket.purchasesVAT += taxAmount;
      }
    }

    return Array.from(rateMap.values()).sort((a, b) => b.rate - a.rate);
  }

  static async getVATLiability(
    tenantId: string,
    companyId: string,
    asOfDate: Date
  ) {
    const transactions = await prisma.taxTransaction.findMany({
      where: {
        tenantId,
        companyId,
        transactionDate: {
          lte: asOfDate,
        },
        isReversed: false,
        taxRateConfig: {
          taxType: "VAT",
        },
      },
    });

    let outputVAT = 0;
    let inputVAT = 0;

    for (const txn of transactions) {
      const taxAmount = parseFloat(txn.taxAmount.toString());

      if (txn.transactionType === "INVOICE") {
        outputVAT += taxAmount;
      } else if (txn.transactionType === "BILL") {
        inputVAT += taxAmount;
      }
    }

    const netLiability = outputVAT - inputVAT;

    return {
      asOfDate,
      outputVAT,
      inputVAT,
      netLiability,
      status: netLiability > 0 ? "PAYABLE" : netLiability < 0 ? "REFUNDABLE" : "BALANCED",
    };
  }

  static async generateMRAVATReturn(
    tenantId: string,
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const vatReturn = await this.getVATReturn(tenantId, companyId, startDate, endDate);
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        tenantId,
      },
    });

    if (!company) {
      throw new Error("Company not found");
    }

    const mraReturn = {
      companyInfo: {
        name: company.name,
        legalName: company.legalName || company.name,
        taxId: company.taxId || "",
        address: company.address || "",
        city: company.city || "",
        country: company.country,
      },
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      box1_OutputVAT: vatReturn.vatSummary.outputVAT.toFixed(2),
      box2_InputVAT: vatReturn.vatSummary.inputVAT.toFixed(2),
      box3_NetVAT: vatReturn.vatSummary.netVAT.toFixed(2),
      box4_VATPayable: vatReturn.vatSummary.vatPayable.toFixed(2),
      box5_VATRefundable: vatReturn.vatSummary.vatRefundable.toFixed(2),
      box6_StandardRatedSales: vatReturn.sales.standardRated.toFixed(2),
      box7_ZeroRatedSales: vatReturn.sales.zeroRated.toFixed(2),
      box8_ExemptSales: vatReturn.sales.exempt.toFixed(2),
      box9_TotalSales: vatReturn.sales.total.toFixed(2),
      box10_StandardRatedPurchases: vatReturn.purchases.standardRated.toFixed(2),
      box11_ZeroRatedPurchases: vatReturn.purchases.zeroRated.toFixed(2),
      box12_ExemptPurchases: vatReturn.purchases.exempt.toFixed(2),
      box13_TotalPurchases: vatReturn.purchases.total.toFixed(2),
    };

    return mraReturn;
  }

  static async getVATAuditTrail(
    tenantId: string,
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const transactions = await prisma.taxTransaction.findMany({
      where: {
        tenantId,
        companyId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        taxRateConfig: {
          taxType: "VAT",
        },
      },
      include: {
        taxRateConfig: true,
      },
      orderBy: {
        transactionDate: "asc",
      },
    });

    return transactions.map((txn) => ({
      id: txn.id,
      date: txn.transactionDate,
      type: txn.transactionType,
      reference: txn.referenceNumber,
      referenceType: txn.referenceType,
      referenceId: txn.referenceId,
      taxRate: txn.taxRateConfig.name,
      rate: parseFloat(txn.taxRate.toString()),
      baseAmount: parseFloat(txn.baseAmount.toString()),
      vatAmount: parseFloat(txn.taxAmount.toString()),
      totalAmount: parseFloat(txn.totalAmount.toString()),
      isReversed: txn.isReversed,
      reversedAt: txn.reversedAt,
      notes: txn.notes,
      createdAt: txn.createdAt,
    }));
  }
}
