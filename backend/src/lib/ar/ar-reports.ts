import { prisma } from "../prisma";

export interface ARAgingBucket {
  customerId: string;
  customerCode: string;
  customerName: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

export interface ARAgingSummary {
  asOfDate: Date;
  buckets: ARAgingBucket[];
  totals: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    total: number;
  };
}

export class ARReportService {
  static async getARAgingReport(
    tenantId: string,
    companyId: string,
    asOfDate?: Date | undefined
  ): Promise<ARAgingSummary> {
    const reportDate = asOfDate || new Date();
    reportDate.setHours(23, 59, 59, 999);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        companyId,
        status: {
          in: ["SENT", "PARTIAL", "OVERDUE"],
        },
        invoiceDate: {
          lte: reportDate,
        },
      },
      include: {
        customer: {
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

    const customerMap = new Map<string, ARAgingBucket>();

    for (const invoice of invoices) {
      const balance = parseFloat(invoice.totalAmount.toString()) - parseFloat(invoice.paidAmount.toString());

      if (balance <= 0) continue;

      if (!customerMap.has(invoice.customerId)) {
        customerMap.set(invoice.customerId, {
          customerId: invoice.customerId,
          customerCode: invoice.customer.code,
          customerName: invoice.customer.name,
          current: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          over90: 0,
          total: 0,
        });
      }

      const bucket = customerMap.get(invoice.customerId)!;

      const dueDate = new Date(invoice.dueDate);
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

    const buckets = Array.from(customerMap.values()).sort((a, b) => 
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

  static async getCustomerStatement(
    tenantId: string,
    companyId: string,
    customerId: string,
    startDate?: Date | undefined,
    endDate?: Date | undefined
  ) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
        companyId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const where: any = {
      tenantId,
      companyId,
      customerId,
      status: {
        not: "DRAFT",
      },
    };

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) {
        where.invoiceDate.gte = startDate;
      }
      if (endDate) {
        where.invoiceDate.lte = endDate;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        payments: {
          orderBy: {
            paymentDate: "asc",
          },
        },
      },
      orderBy: {
        invoiceDate: "asc",
      },
    });

    let openingBalance = 0;
    if (startDate) {
      const priorInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          companyId,
          customerId,
          invoiceDate: {
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

      for (const inv of priorInvoices) {
        openingBalance += parseFloat(inv.totalAmount.toString()) - parseFloat(inv.paidAmount.toString());
      }
    }

    let runningBalance = openingBalance;
    const transactions = [];

    for (const invoice of invoices) {
      const invoiceAmount = parseFloat(invoice.totalAmount.toString());
      runningBalance += invoiceAmount;

      transactions.push({
        date: invoice.invoiceDate,
        type: "INVOICE",
        reference: invoice.invoiceNumber,
        description: invoice.description || `Invoice ${invoice.invoiceNumber}`,
        debit: invoiceAmount,
        credit: 0,
        balance: runningBalance,
      });

      for (const payment of invoice.payments) {
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
      customer,
      openingBalance,
      closingBalance: runningBalance,
      transactions,
    };
  }
}
