import { prisma } from "./prisma";

export class CodeGenerator {
  /**
   * Generate next customer code for a company
   * Format: CUST001, CUST002, etc.
   */
  static async generateCustomerCode(tenantId: string, companyId: string): Promise<string> {
    const lastCustomer = await prisma.customer.findFirst({
      where: {
        tenantId,
        companyId,
      },
      orderBy: {
        code: 'desc',
      },
      select: {
        code: true,
      },
    });

    if (!lastCustomer) {
      return 'CUST001';
    }

    // Extract number from code (e.g., CUST001 -> 001)
    const match = lastCustomer.code.match(/(\d+)$/);
    if (!match || !match[1]) {
      return 'CUST001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `CUST${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Generate next supplier code for a company
   * Format: SUPP001, SUPP002, etc.
   */
  static async generateSupplierCode(tenantId: string, companyId: string): Promise<string> {
    const lastSupplier = await prisma.supplier.findFirst({
      where: {
        tenantId,
        companyId,
      },
      orderBy: {
        code: 'desc',
      },
      select: {
        code: true,
      },
    });

    if (!lastSupplier) {
      return 'SUPP001';
    }

    const match = lastSupplier.code.match(/(\d+)$/);
    if (!match) {
      return 'SUPP001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `SUPP${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Generate next invoice number for a company
   * Format: INV-2026-001, INV-2026-002, etc.
   */
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
        invoiceNumber: 'desc',
      },
      select: {
        invoiceNumber: true,
      },
    });

    if (!lastInvoice) {
      return `${prefix}001`;
    }

    const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
    if (!match) {
      return `${prefix}001`;
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Generate next bill number for a company
   * Format: BILL-2026-001, BILL-2026-002, etc.
   */
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
        billNumber: 'desc',
      },
      select: {
        billNumber: true,
      },
    });

    if (!lastBill) {
      return `${prefix}001`;
    }

    const match = lastBill.billNumber.match(/(\d+)$/);
    if (!match) {
      return `${prefix}001`;
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Generate next journal entry number for a company
   * Format: JE-2026-001, JE-2026-002, etc.
   */
  static async generateJournalEntryNumber(tenantId: string, companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}-`;

    const lastEntry = await prisma.journalEntry.findFirst({
      where: {
        tenantId,
        companyId,
        entryNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        entryNumber: 'desc',
      },
      select: {
        entryNumber: true,
      },
    });

    if (!lastEntry) {
      return `${prefix}001`;
    }

    const match = lastEntry.entryNumber.match(/(\d+)$/);
    if (!match) {
      return `${prefix}001`;
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }
}
