import { prisma } from "../prisma";

export interface APAgingBucket {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

export interface APAgingSummary {
  asOfDate: Date;
  buckets: APAgingBucket[];
  totals: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    total: number;
  };
}

export class APReportService {
  static async getAPAgingReport(
    tenantId: string,
    companyId: string,
    asOfDate?: Date | undefined
  ): Promise<APAgingSummary> {
    const reportDate = asOfDate || new Date();
    reportDate.setHours(23, 59, 59, 999);

    const bills = await prisma.bill.findMany({
      where: {
        tenantId,
        companyId,
        status: {
          in: ["APPROVED", "PARTIAL", "OVERDUE"],
        },
        billDate: {
          lte: reportDate,
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    const supplierMap = new Map<string, APAgingBucket>();

    for (const bill of bills) {
      const balance = parseFloat(bill.totalAmount.toString()) - parseFloat(bill.paidAmount.toString());

      if (balance <= 0) continue;

      if (!supplierMap.has(bill.supplierId)) {
        supplierMap.set(bill.supplierId, {
          supplierId: bill.supplierId,
          supplierCode: bill.supplier.code,
          supplierName: bill.supplier.name,
          current: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          over90: 0,
          total: 0,
        });
      }

      const bucket = supplierMap.get(bill.supplierId)!;

      const dueDate = new Date(bill.dueDate);
      const daysPastDue = Math.floor((reportDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysPastDue < 0) {
        bucket.current += balance;
      } else if (daysPastDue <= 30) {
        bucket.days1to30 += balance;
      } else if (daysPastDue <= 60) {
        bucket.days31to60 += balance;
      } else if (daysPastDue <= 90) {
        bucket.days61to90 += balance;
      } else {
        bucket.over90 += balance;
      }

      bucket.total += balance;
    }

    const buckets = Array.from(supplierMap.values()).sort((a, b) => 
      b.total - a.total
    );

    const totals = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      over90: 0,
      total: 0,
    };

    for (const bucket of buckets) {
      totals.current += bucket.current;
      totals.days1to30 += bucket.days1to30;
      totals.days31to60 += bucket.days31to60;
      totals.days61to90 += bucket.days61to90;
      totals.over90 += bucket.over90;
      totals.total += bucket.total;
    }

    return {
      asOfDate: reportDate,
      buckets,
      totals,
    };
  }

  static async getSupplierStatement(
    tenantId: string,
    companyId: string,
    supplierId: string,
    startDate?: Date | undefined,
    endDate?: Date | undefined
  ) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
        tenantId,
        companyId,
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const where: any = {
      tenantId,
      companyId,
      supplierId,
      status: {
        not: "DRAFT",
      },
    };

    if (startDate || endDate) {
      where.billDate = {};
      if (startDate) {
        where.billDate.gte = startDate;
      }
      if (endDate) {
        where.billDate.lte = endDate;
      }
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        payments: {
          orderBy: {
            paymentDate: "asc",
          },
        },
      },
      orderBy: {
        billDate: "asc",
      },
    });

    let openingBalance = 0;
    if (startDate) {
      const priorBills = await prisma.bill.findMany({
        where: {
          tenantId,
          companyId,
          supplierId,
          billDate: {
            lt: startDate,
          },
          status: {
            not: "DRAFT",
          },
        },
        select: {
          totalAmount: true,
          paidAmount: true,
        },
      });

      for (const b of priorBills) {
        openingBalance += parseFloat(b.totalAmount.toString()) - parseFloat(b.paidAmount.toString());
      }
    }

    let runningBalance = openingBalance;
    const transactions = [];

    for (const bill of bills) {
      const billAmount = parseFloat(bill.totalAmount.toString());
      runningBalance += billAmount;

      transactions.push({
        date: bill.billDate,
        type: "BILL",
        reference: bill.billNumber,
        description: bill.description || `Bill ${bill.billNumber}`,
        debit: billAmount,
        credit: 0,
        balance: runningBalance,
      });

      for (const payment of bill.payments) {
        const paymentAmount = parseFloat(payment.amount.toString());
        runningBalance -= paymentAmount;

        transactions.push({
          date: payment.paymentDate,
          type: "PAYMENT",
          reference: payment.paymentNumber,
          description: `Payment - ${payment.paymentMethod}`,
          debit: 0,
          credit: paymentAmount,
          balance: runningBalance,
        });
      }
    }

    return {
      supplier,
      openingBalance,
      closingBalance: runningBalance,
      transactions,
    };
  }
}
