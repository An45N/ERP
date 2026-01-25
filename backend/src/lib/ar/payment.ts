import { prisma } from "../prisma";
import { logger } from "../logger";
import { JournalEntryService } from "../accounting/journal-entry";

export interface CreatePaymentInput {
  tenantId: string;
  companyId: string;
  customerId: string;
  invoiceId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  reference?: string | undefined;
  notes?: string | undefined;
  createdBy: string;
}

export class PaymentService {
  static async generatePaymentNumber(tenantId: string, companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PMT-${year}-`;

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

  static async recordPayment(input: CreatePaymentInput) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: input.invoiceId,
        tenantId: input.tenantId,
        companyId: input.companyId,
        customerId: input.customerId,
      },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status === "DRAFT" || invoice.status === "CANCELLED") {
      throw new Error(`Cannot record payment for ${invoice.status.toLowerCase()} invoice`);
    }

    if (invoice.status === "PAID") {
      throw new Error("Invoice is already fully paid");
    }

    const remainingBalance = parseFloat(invoice.totalAmount.toString()) - parseFloat(invoice.paidAmount.toString());

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
        customerId: input.customerId,
        paymentNumber,
        paymentDate: input.paymentDate,
        paymentMethod: input.paymentMethod,
        reference: input.reference ?? null,
        amount: input.amount,
        currency: invoice.currency,
        notes: input.notes ?? null,
        createdBy: input.createdBy,
      },
    });

    const newPaidAmount = parseFloat(invoice.paidAmount.toString()) + input.amount;
    const newStatus = Math.abs(newPaidAmount - parseFloat(invoice.totalAmount.toString())) < 0.01
      ? "PAID"
      : "PARTIAL";

    await prisma.invoice.update({
      where: { id: input.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    logger.info(`Payment recorded: ${paymentNumber} for invoice ${invoice.invoiceNumber} - Amount: ${input.amount}`);
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

    if (!payment.customerId) {
      throw new Error("Payment must be linked to a customer");
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: payment.customerId,
        tenantId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
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

    const arAccount = await prisma.account.findFirst({
      where: {
        tenantId,
        companyId: payment.companyId,
        category: "AccountsReceivable",
        isActive: true,
      },
    });

    if (!arAccount) {
      throw new Error("Accounts Receivable account not found");
    }

    const journalEntry = await JournalEntryService.createJournalEntry({
      tenantId,
      companyId: payment.companyId,
      entryDate: payment.paymentDate,
      entryType: "SYSTEM",
      reference: payment.paymentNumber,
      description: `Payment ${payment.paymentNumber} from ${customer.name}`,
      lines: [
        {
          accountId: cashAccount.id,
          debit: parseFloat(payment.amount.toString()),
          credit: 0,
          description: `Payment received - ${payment.paymentMethod}`,
          reference: payment.reference || payment.paymentNumber,
        },
        {
          accountId: arAccount.id,
          debit: 0,
          credit: parseFloat(payment.amount.toString()),
          description: `Payment from ${customer.name}`,
          reference: payment.paymentNumber,
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
    customerId?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
  }) {
    const where: any = {
      tenantId,
      companyId,
      customerId: { not: null },
    };

    if (filters?.customerId) {
      where.customerId = filters.customerId;
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
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    return payment;
  }
}
