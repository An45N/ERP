import { prisma } from "../prisma";
import { logger } from "../logger";
import { JournalEntryService } from "../accounting/journal-entry";

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number | undefined;
  accountId?: string | undefined;
}

export interface CreateInvoiceInput {
  tenantId: string;
  companyId: string;
  customerId: string;
  invoiceDate: Date;
  dueDate?: Date | undefined;
  reference?: string | undefined;
  description?: string | undefined;
  lines: InvoiceLineInput[];
  notes?: string | undefined;
  createdBy: string;
}

export interface UpdateInvoiceInput {
  invoiceDate?: Date | undefined;
  dueDate?: Date | undefined;
  reference?: string | undefined;
  description?: string | undefined;
  lines?: InvoiceLineInput[] | undefined;
  notes?: string | undefined;
}

export class InvoiceService {
  static async generateInvoiceNumber(tenantId: string, companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId,
        companyId,
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: "desc",
      },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-").pop() || "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, "0")}`;
  }

  static calculateLineTotals(line: InvoiceLineInput): {
    taxAmount: number;
    lineTotal: number;
  } {
    const subtotal = line.quantity * line.unitPrice;
    const taxRate = line.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const lineTotal = subtotal + taxAmount;

    return { taxAmount, lineTotal };
  }

  static async createInvoice(input: CreateInvoiceInput) {
    if (!input.lines || input.lines.length === 0) {
      throw new Error("Invoice must have at least one line item");
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: input.customerId,
        tenantId: input.tenantId,
        companyId: input.companyId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (!customer.isActive) {
      throw new Error("Cannot create invoice for inactive customer");
    }

    const invoiceNumber = await this.generateInvoiceNumber(input.tenantId, input.companyId);

    const dueDate = input.dueDate || new Date(
      input.invoiceDate.getTime() + customer.paymentTerms * 24 * 60 * 60 * 1000
    );

    let subtotal = 0;
    let taxAmount = 0;

    const linesData = input.lines.map((line, index) => {
      const { taxAmount: lineTax, lineTotal } = this.calculateLineTotals(line);
      subtotal += line.quantity * line.unitPrice;
      taxAmount += lineTax;

      return {
        lineNumber: index + 1,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate || 0,
        taxAmount: lineTax,
        lineTotal,
        accountId: line.accountId ?? null,
      };
    });

    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        customerId: input.customerId,
        invoiceNumber,
        invoiceDate: input.invoiceDate,
        dueDate,
        reference: input.reference ?? null,
        description: input.description ?? null,
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        currency: customer.currency,
        status: "DRAFT",
        notes: input.notes ?? null,
        createdBy: input.createdBy,
        lines: {
          create: linesData,
        },
      },
      include: {
        lines: {
          orderBy: {
            lineNumber: "asc",
          },
        },
        customer: {
          select: {
            code: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Invoice created: ${invoice.invoiceNumber} for customer ${customer.code}`);
    return invoice;
  }

  static async getInvoices(tenantId: string, companyId: string, filters?: {
    customerId?: string | undefined;
    status?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
  }) {
    const where: any = {
      tenantId,
      companyId,
    };

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.invoiceDate = {};
      if (filters.startDate) {
        where.invoiceDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.invoiceDate.lte = filters.endDate;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            code: true,
            name: true,
          },
        },
        lines: {
          orderBy: {
            lineNumber: "asc",
          },
        },
      },
      orderBy: [
        { invoiceDate: "desc" },
        { invoiceNumber: "desc" },
      ],
    });

    return invoices;
  }

  static async getInvoiceById(id: string, tenantId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        customer: true,
        lines: {
          orderBy: {
            lineNumber: "asc",
          },
        },
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return invoice;
  }

  static async updateInvoice(id: string, tenantId: string, input: UpdateInvoiceInput) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status !== "DRAFT") {
      throw new Error("Can only update draft invoices");
    }

    if (input.lines) {
      if (input.lines.length === 0) {
        throw new Error("Invoice must have at least one line item");
      }

      await prisma.invoiceLine.deleteMany({
        where: {
          invoiceId: id,
        },
      });

      let subtotal = 0;
      let taxAmount = 0;

      const linesData = input.lines.map((line, index) => {
        const { taxAmount: lineTax, lineTotal } = this.calculateLineTotals(line);
        subtotal += line.quantity * line.unitPrice;
        taxAmount += lineTax;

        return {
          lineNumber: index + 1,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate || 0,
          taxAmount: lineTax,
          lineTotal,
          accountId: line.accountId ?? null,
        };
      });

      const totalAmount = subtotal + taxAmount;

      const updateData: any = {
        subtotal,
        taxAmount,
        totalAmount,
        lines: {
          create: linesData,
        },
      };
      if (input.invoiceDate !== undefined) updateData.invoiceDate = input.invoiceDate;
      if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
      if (input.reference !== undefined) updateData.reference = input.reference ?? null;
      if (input.description !== undefined) updateData.description = input.description ?? null;
      if (input.notes !== undefined) updateData.notes = input.notes ?? null;

      const updated = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: {
          lines: {
            orderBy: {
              lineNumber: "asc",
            },
          },
          customer: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });

      logger.info(`Invoice updated: ${updated.invoiceNumber}`);
      return updated;
    }

    const updateData: any = {};
    if (input.invoiceDate !== undefined) updateData.invoiceDate = input.invoiceDate;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
    if (input.reference !== undefined) updateData.reference = input.reference ?? null;
    if (input.description !== undefined) updateData.description = input.description ?? null;
    if (input.notes !== undefined) updateData.notes = input.notes ?? null;

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        lines: {
          orderBy: {
            lineNumber: "asc",
          },
        },
        customer: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Invoice updated: ${updated.invoiceNumber}`);
    return updated;
  }

  static async deleteInvoice(id: string, tenantId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status !== "DRAFT") {
      throw new Error("Can only delete draft invoices");
    }

    await prisma.invoice.delete({
      where: { id },
    });

    logger.info(`Invoice deleted: ${invoice.invoiceNumber}`);
  }

  static async sendInvoice(id: string, tenantId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status !== "DRAFT") {
      throw new Error("Can only send draft invoices");
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: "SENT",
      },
      include: {
        lines: true,
        customer: true,
      },
    });

    logger.info(`Invoice sent: ${updated.invoiceNumber}`);
    return updated;
  }

  static async postInvoiceToGL(id: string, tenantId: string, userId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lines: true,
        customer: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status === "DRAFT") {
      throw new Error("Cannot post draft invoice to GL. Send it first.");
    }

    if (invoice.journalEntryId) {
      throw new Error("Invoice already posted to GL");
    }

    const arAccount = await prisma.account.findFirst({
      where: {
        tenantId,
        companyId: invoice.companyId,
        category: "AccountsReceivable",
        isActive: true,
      },
    });

    if (!arAccount) {
      throw new Error("Accounts Receivable account not found");
    }

    const journalLines: any[] = [
      {
        accountId: arAccount.id,
        debit: parseFloat(invoice.totalAmount.toString()),
        credit: 0,
        description: `Invoice ${invoice.invoiceNumber} - ${invoice.customer.name}`,
        reference: invoice.invoiceNumber,
      },
    ];

    for (const line of invoice.lines) {
      let revenueAccountId = line.accountId;

      if (!revenueAccountId) {
        const defaultRevenueAccount = await prisma.account.findFirst({
          where: {
            tenantId,
            companyId: invoice.companyId,
            type: "REVENUE",
            category: "Sales",
            isActive: true,
          },
        });

        if (!defaultRevenueAccount) {
          throw new Error("Default revenue account not found");
        }

        revenueAccountId = defaultRevenueAccount.id;
      }

      const lineSubtotal = parseFloat(line.quantity.toString()) * parseFloat(line.unitPrice.toString());

      journalLines.push({
        accountId: revenueAccountId,
        debit: 0,
        credit: lineSubtotal,
        description: line.description,
        reference: invoice.invoiceNumber,
      });
    }

    if (parseFloat(invoice.taxAmount.toString()) > 0) {
      const taxPayableAccount = await prisma.account.findFirst({
        where: {
          tenantId,
          companyId: invoice.companyId,
          category: "TaxPayable",
          isActive: true,
        },
      });

      if (!taxPayableAccount) {
        throw new Error("Tax Payable account not found");
      }

      journalLines.push({
        accountId: taxPayableAccount.id,
        debit: 0,
        credit: parseFloat(invoice.taxAmount.toString()),
        description: `Tax on Invoice ${invoice.invoiceNumber}`,
        reference: invoice.invoiceNumber,
      });
    }

    const journalEntry = await JournalEntryService.createJournalEntry({
      tenantId,
      companyId: invoice.companyId,
      entryDate: invoice.invoiceDate,
      entryType: "SYSTEM",
      reference: invoice.invoiceNumber,
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.customer.name}`,
      lines: journalLines,
      createdBy: userId,
    });

    await JournalEntryService.postJournalEntry(journalEntry.id, tenantId, userId);

    await prisma.invoice.update({
      where: { id },
      data: {
        journalEntryId: journalEntry.id,
      },
    });

    logger.info(`Invoice ${invoice.invoiceNumber} posted to GL with entry ${journalEntry.entryNumber}`);
    return journalEntry;
  }

  static async updateInvoiceStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueInvoices = await prisma.invoice.updateMany({
      where: {
        status: "SENT",
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    if (overdueInvoices.count > 0) {
      logger.info(`Updated ${overdueInvoices.count} invoices to OVERDUE status`);
    }

    return overdueInvoices.count;
  }
}
