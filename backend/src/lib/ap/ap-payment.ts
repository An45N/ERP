import { prisma } from "../prisma";
import { logger } from "../logger";
import { JournalEntryService } from "../accounting/journal-entry";

export interface CreateAPPaymentInput {
  tenantId: string;
  companyId: string;
  supplierId: string;
  billId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  reference?: string | undefined;
  notes?: string | undefined;
  createdBy: string;
}

export class APPaymentService {
  static async generatePaymentNumber(tenantId: string, companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `APPMT-${year}-`;

    const lastPayment = await prisma.payment.findFirst({
      where: {
        tenantId,
        companyId,
        paymentNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        paymentNumber: "desc",
      },
    });

    let nextNumber = 1;
    if (lastPayment) {
      const lastNumber = parseInt(lastPayment.paymentNumber.split("-").pop() || "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, "0")}`;
  }

  static async recordPayment(input: CreateAPPaymentInput) {
    const bill = await prisma.bill.findFirst({
      where: {
        id: input.billId,
        tenantId: input.tenantId,
        companyId: input.companyId,
        supplierId: input.supplierId,
      },
      include: {
        supplier: true,
      },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    if (bill.status === "DRAFT" || bill.status === "CANCELLED") {
      throw new Error(`Cannot record payment for ${bill.status.toLowerCase()} bill`);
    }

    if (bill.status === "PAID") {
      throw new Error("Bill is already fully paid");
    }

    const remainingBalance = parseFloat(bill.totalAmount.toString()) - parseFloat(bill.paidAmount.toString());

    if (input.amount > remainingBalance) {
      throw new Error(`Payment amount (${input.amount}) exceeds remaining balance (${remainingBalance})`);
    }

    if (input.amount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    const paymentNumber = await this.generatePaymentNumber(input.tenantId, input.companyId);

    const payment = await prisma.payment.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        billId: input.billId,
        paymentNumber,
        paymentDate: input.paymentDate,
        paymentMethod: input.paymentMethod,
        reference: input.reference ?? null,
        amount: input.amount,
        currency: bill.currency,
        notes: input.notes ?? null,
        createdBy: input.createdBy,
      },
    });

    const newPaidAmount = parseFloat(bill.paidAmount.toString()) + input.amount;
    const newStatus = Math.abs(newPaidAmount - parseFloat(bill.totalAmount.toString())) < 0.01
      ? "PAID"
      : "PARTIAL";

    await prisma.bill.update({
      where: { id: input.billId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    logger.info(`Payment recorded: ${paymentNumber} for bill ${bill.billNumber} - Amount: ${input.amount}`);
    return payment;
  }

  static async postPaymentToGL(paymentId: string, tenantId: string, userId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId,
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.journalEntryId) {
      throw new Error("Payment already posted to GL");
    }

    if (!payment.billId) {
      throw new Error("Payment must be linked to a bill");
    }

    const bill = await prisma.bill.findFirst({
      where: {
        id: payment.billId,
        tenantId,
      },
      include: {
        supplier: true,
      },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    const cashAccount = await prisma.account.findFirst({
      where: {
        tenantId,
        companyId: payment.companyId,
        category: "Cash",
        isActive: true,
      },
    });

    if (!cashAccount) {
      throw new Error("Cash account not found");
    }

    const apAccount = await prisma.account.findFirst({
      where: {
        tenantId,
        companyId: payment.companyId,
        category: "AccountsPayable",
        isActive: true,
      },
    });

    if (!apAccount) {
      throw new Error("Accounts Payable account not found");
    }

    const journalEntry = await JournalEntryService.createJournalEntry({
      tenantId,
      companyId: payment.companyId,
      entryDate: payment.paymentDate,
      entryType: "SYSTEM",
      reference: payment.paymentNumber,
      description: `Payment ${payment.paymentNumber} to ${bill.supplier.name}`,
      lines: [
        {
          accountId: apAccount.id,
          debit: parseFloat(payment.amount.toString()),
          credit: 0,
          description: `Payment to ${bill.supplier.name}`,
          reference: payment.paymentNumber,
        },
        {
          accountId: cashAccount.id,
          debit: 0,
          credit: parseFloat(payment.amount.toString()),
          description: `Payment made - ${payment.paymentMethod}`,
          reference: payment.reference || payment.paymentNumber,
        },
      ],
      createdBy: userId,
    });

    await JournalEntryService.postJournalEntry(journalEntry.id, tenantId, userId);

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        journalEntryId: journalEntry.id,
      },
    });

    logger.info(`Payment ${payment.paymentNumber} posted to GL with entry ${journalEntry.entryNumber}`);
    return journalEntry;
  }

  static async getPayments(tenantId: string, companyId: string, filters?: {
    supplierId?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
  }) {
    const where: any = {
      tenantId,
      companyId,
      billId: { not: null },
    };

    if (filters?.supplierId) {
      where.bill = {
        supplierId: filters.supplierId,
      };
    }

    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.paymentDate.lte = filters.endDate;
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        bill: {
          select: {
            billNumber: true,
            supplier: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { paymentDate: "desc" },
        { paymentNumber: "desc" },
      ],
    });

    return payments;
  }

  static async getPaymentById(id: string, tenantId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        bill: {
          include: {
            supplier: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    return payment;
  }
}
