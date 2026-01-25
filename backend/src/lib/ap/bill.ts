import { prisma } from "../prisma";
import { logger } from "../logger";
import { JournalEntryService } from "../accounting/journal-entry";

export interface BillLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number | undefined;
  accountId?: string | undefined;
}

export interface CreateBillInput {
  tenantId: string;
  companyId: string;
  supplierId: string;
  billDate: Date;
  dueDate?: Date | undefined;
  reference?: string | undefined;
  description?: string | undefined;
  lines: BillLineInput[];
  notes?: string | undefined;
  createdBy: string;
}

export interface UpdateBillInput {
  billDate?: Date | undefined;
  dueDate?: Date | undefined;
  reference?: string | undefined;
  description?: string | undefined;
  lines?: BillLineInput[] | undefined;
  notes?: string | undefined;
}

export class BillService {
  static async generateBillNumber(tenantId: string, companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `BILL-${year}-`;

    const lastBill = await prisma.bill.findFirst({
      where: {
        tenantId,
        companyId,
        billNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        billNumber: "desc",
      },
    });

    let nextNumber = 1;
    if (lastBill) {
      const lastNumber = parseInt(lastBill.billNumber.split("-").pop() || "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, "0")}`;
  }

  static calculateLineTotals(line: BillLineInput): {
    taxAmount: number;
    lineTotal: number;
  } {
    const subtotal = line.quantity * line.unitPrice;
    const taxRate = line.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const lineTotal = subtotal + taxAmount;

    return { taxAmount, lineTotal };
  }

  static async createBill(input: CreateBillInput) {
    if (!input.lines || input.lines.length === 0) {
      throw new Error("Bill must have at least one line item");
    }

    const supplier = await prisma.supplier.findFirst({
      where: {
        id: input.supplierId,
        tenantId: input.tenantId,
        companyId: input.companyId,
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    if (!supplier.isActive) {
      throw new Error("Cannot create bill for inactive supplier");
    }

    const billNumber = await this.generateBillNumber(input.tenantId, input.companyId);

    const dueDate = input.dueDate || new Date(
      input.billDate.getTime() + supplier.paymentTerms * 24 * 60 * 60 * 1000
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

    const bill = await prisma.bill.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        supplierId: input.supplierId,
        billNumber,
        billDate: input.billDate,
        dueDate,
        reference: input.reference ?? null,
        description: input.description ?? null,
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        currency: supplier.currency,
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
        supplier: {
          select: {
            code: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Bill created: ${bill.billNumber} for supplier ${supplier.code}`);
    return bill;
  }

  static async getBills(tenantId: string, companyId: string, filters?: {
    supplierId?: string | undefined;
    status?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
  }) {
    const where: any = {
      tenantId,
      companyId,
    };

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.billDate = {};
      if (filters.startDate) {
        where.billDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.billDate.lte = filters.endDate;
      }
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        supplier: {
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
        { billDate: "desc" },
        { billNumber: "desc" },
      ],
    });

    return bills;
  }

  static async getBillById(id: string, tenantId: string) {
    const bill = await prisma.bill.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        supplier: true,
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

    if (!bill) {
      throw new Error("Bill not found");
    }

    return bill;
  }

  static async updateBill(id: string, tenantId: string, input: UpdateBillInput) {
    const bill = await prisma.bill.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    if (bill.status !== "DRAFT") {
      throw new Error("Can only update draft bills");
    }

    if (input.lines) {
      if (input.lines.length === 0) {
        throw new Error("Bill must have at least one line item");
      }

      await prisma.billLine.deleteMany({
        where: {
          billId: id,
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
      if (input.billDate !== undefined) updateData.billDate = input.billDate;
      if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
      if (input.reference !== undefined) updateData.reference = input.reference ?? null;
      if (input.description !== undefined) updateData.description = input.description ?? null;
      if (input.notes !== undefined) updateData.notes = input.notes ?? null;

      const updated = await prisma.bill.update({
        where: { id },
        data: updateData,
        include: {
          lines: {
            orderBy: {
              lineNumber: "asc",
            },
          },
          supplier: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });

      logger.info(`Bill updated: ${updated.billNumber}`);
      return updated;
    }

    const updateData: any = {};
    if (input.billDate !== undefined) updateData.billDate = input.billDate;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
    if (input.reference !== undefined) updateData.reference = input.reference ?? null;
    if (input.description !== undefined) updateData.description = input.description ?? null;
    if (input.notes !== undefined) updateData.notes = input.notes ?? null;

    const updated = await prisma.bill.update({
      where: { id },
      data: updateData,
      include: {
        lines: {
          orderBy: {
            lineNumber: "asc",
          },
        },
        supplier: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    logger.info(`Bill updated: ${updated.billNumber}`);
    return updated;
  }

  static async deleteBill(id: string, tenantId: string) {
    const bill = await prisma.bill.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    if (bill.status !== "DRAFT") {
      throw new Error("Can only delete draft bills");
    }

    await prisma.bill.delete({
      where: { id },
    });

    logger.info(`Bill deleted: ${bill.billNumber}`);
  }

  static async approveBill(id: string, tenantId: string) {
    const bill = await prisma.bill.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    if (bill.status !== "DRAFT") {
      throw new Error("Can only approve draft bills");
    }

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        status: "APPROVED",
      },
      include: {
        lines: true,
        supplier: true,
      },
    });

    logger.info(`Bill approved: ${updated.billNumber}`);
    return updated;
  }

  static async postBillToGL(id: string, tenantId: string, userId: string) {
    const bill = await prisma.bill.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lines: true,
        supplier: true,
      },
    });

    if (!bill) {
      throw new Error("Bill not found");
    }

    if (bill.status === "DRAFT") {
      throw new Error("Cannot post draft bill to GL. Approve it first.");
    }

    if (bill.journalEntryId) {
      throw new Error("Bill already posted to GL");
    }

    const apAccount = await prisma.account.findFirst({
      where: {
        tenantId,
        companyId: bill.companyId,
        category: "AccountsPayable",
        isActive: true,
      },
    });

    if (!apAccount) {
      throw new Error("Accounts Payable account not found");
    }

    const journalLines: any[] = [
      {
        accountId: apAccount.id,
        debit: 0,
        credit: parseFloat(bill.totalAmount.toString()),
        description: `Bill ${bill.billNumber} - ${bill.supplier.name}`,
        reference: bill.billNumber,
      },
    ];

    for (const line of bill.lines) {
      let expenseAccountId = line.accountId;

      if (!expenseAccountId) {
        const defaultExpenseAccount = await prisma.account.findFirst({
          where: {
            tenantId,
            companyId: bill.companyId,
            type: "EXPENSE",
            category: "OperatingExpenses",
            isActive: true,
          },
        });

        if (!defaultExpenseAccount) {
          throw new Error("Default expense account not found");
        }

        expenseAccountId = defaultExpenseAccount.id;
      }

      const lineSubtotal = parseFloat(line.quantity.toString()) * parseFloat(line.unitPrice.toString());

      journalLines.push({
        accountId: expenseAccountId,
        debit: lineSubtotal,
        credit: 0,
        description: line.description,
        reference: bill.billNumber,
      });
    }

    if (parseFloat(bill.taxAmount.toString()) > 0) {
      const taxReceivableAccount = await prisma.account.findFirst({
        where: {
          tenantId,
          companyId: bill.companyId,
          category: "TaxReceivable",
          isActive: true,
        },
      });

      if (!taxReceivableAccount) {
        throw new Error("Tax Receivable account not found");
      }

      journalLines.push({
        accountId: taxReceivableAccount.id,
        debit: parseFloat(bill.taxAmount.toString()),
        credit: 0,
        description: `Tax on Bill ${bill.billNumber}`,
        reference: bill.billNumber,
      });
    }

    const journalEntry = await JournalEntryService.createJournalEntry({
      tenantId,
      companyId: bill.companyId,
      entryDate: bill.billDate,
      entryType: "SYSTEM",
      reference: bill.billNumber,
      description: `Bill ${bill.billNumber} - ${bill.supplier.name}`,
      lines: journalLines,
      createdBy: userId,
    });

    await JournalEntryService.postJournalEntry(journalEntry.id, tenantId, userId);

    await prisma.bill.update({
      where: { id },
      data: {
        journalEntryId: journalEntry.id,
      },
    });

    logger.info(`Bill ${bill.billNumber} posted to GL with entry ${journalEntry.entryNumber}`);
    return journalEntry;
  }

  static async updateBillStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueBills = await prisma.bill.updateMany({
      where: {
        status: "APPROVED",
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    if (overdueBills.count > 0) {
      logger.info(`Updated ${overdueBills.count} bills to OVERDUE status`);
    }

    return overdueBills.count;
  }
}
