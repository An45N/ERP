import { prisma } from "../prisma";
import { logger } from "../logger";

export interface CreateCustomerInput {
  tenantId: string;
  companyId: string;
  name: string;
  code?: string | undefined;
  legalName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  mobile?: string | undefined;
  website?: string | undefined;
  taxId?: string | undefined;
  address?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  postalCode?: string | undefined;
  country?: string | undefined;
  paymentTerms?: number | undefined;
  creditLimit?: number | undefined;
  currency?: string | undefined;
  notes?: string | undefined;
}

export interface UpdateCustomerInput {
  name?: string | undefined;
  code?: string | undefined;
  legalName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  mobile?: string | undefined;
  website?: string | undefined;
  taxId?: string | undefined;
  address?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  postalCode?: string | undefined;
  country?: string | undefined;
  paymentTerms?: number | undefined;
  creditLimit?: number | undefined;
  currency?: string | undefined;
  notes?: string | undefined;
  isActive?: boolean | undefined;
}

export class CustomerService {
  static async generateCustomerCode(tenantId: string, companyId: string): Promise<string> {
    const lastCustomer = await prisma.customer.findFirst({
      where: {
        tenantId,
        companyId,
        code: {
          startsWith: "CUST-",
        },
      },
      orderBy: {
        code: "desc",
      },
    });

    let nextNumber = 1;
    if (lastCustomer && lastCustomer.code) {
      const lastNumber = parseInt(lastCustomer.code.split("-").pop() || "0");
      nextNumber = lastNumber + 1;
    }

    return `CUST-${nextNumber.toString().padStart(5, "0")}`;
  }

  static async createCustomer(input: CreateCustomerInput) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        OR: [
          { name: input.name },
          ...(input.code ? [{ code: input.code }] : []),
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
    });

    if (existingCustomer) {
      if (existingCustomer.name === input.name) {
        throw new Error("Customer with this name already exists");
      }
      if (input.code && existingCustomer.code === input.code) {
        throw new Error("Customer with this code already exists");
      }
      if (input.email && existingCustomer.email === input.email) {
        throw new Error("Customer with this email already exists");
      }
    }

    const code = input.code || await this.generateCustomerCode(input.tenantId, input.companyId);

    const customer = await prisma.customer.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        code,
        name: input.name,
        legalName: input.legalName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        mobile: input.mobile ?? null,
        website: input.website ?? null,
        taxId: input.taxId ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        postalCode: input.postalCode ?? null,
        country: input.country || "MU",
        paymentTerms: input.paymentTerms ?? 30,
        creditLimit: input.creditLimit ?? null,
        currency: input.currency || "MUR",
        notes: input.notes ?? null,
        isActive: true,
      },
    });

    logger.info(`Customer created: ${customer.code} - ${customer.name}`);
    return customer;
  }

  static async getCustomers(tenantId: string, companyId: string, filters?: {
    isActive?: boolean | undefined;
    search?: string | undefined;
  }) {
    const where: any = {
      tenantId,
      companyId,
    };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { code: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: [
        { code: "asc" },
      ],
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    return customers;
  }

  static async getCustomerById(id: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        invoices: {
          orderBy: {
            invoiceDate: "desc",
          },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            dueDate: true,
            totalAmount: true,
            status: true,
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  }

  static async updateCustomer(id: string, tenantId: string, input: UpdateCustomerInput) {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (input.code && input.code !== customer.code) {
      const existingCode = await prisma.customer.findFirst({
        where: {
          tenantId,
          companyId: customer.companyId,
          code: input.code,
          id: { not: id },
        },
      });

      if (existingCode) {
        throw new Error("Customer code already exists");
      }
    }

    if (input.email && input.email !== customer.email) {
      const existingEmail = await prisma.customer.findFirst({
        where: {
          tenantId,
          companyId: customer.companyId,
          email: input.email,
          id: { not: id },
        },
      });

      if (existingEmail) {
        throw new Error("Customer email already exists");
      }
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.code !== undefined) updateData.code = input.code;
    if (input.legalName !== undefined) updateData.legalName = input.legalName ?? null;
    if (input.email !== undefined) updateData.email = input.email ?? null;
    if (input.phone !== undefined) updateData.phone = input.phone ?? null;
    if (input.mobile !== undefined) updateData.mobile = input.mobile ?? null;
    if (input.website !== undefined) updateData.website = input.website ?? null;
    if (input.taxId !== undefined) updateData.taxId = input.taxId ?? null;
    if (input.address !== undefined) updateData.address = input.address ?? null;
    if (input.city !== undefined) updateData.city = input.city ?? null;
    if (input.state !== undefined) updateData.state = input.state ?? null;
    if (input.postalCode !== undefined) updateData.postalCode = input.postalCode ?? null;
    if (input.country !== undefined) updateData.country = input.country;
    if (input.paymentTerms !== undefined) updateData.paymentTerms = input.paymentTerms;
    if (input.creditLimit !== undefined) updateData.creditLimit = input.creditLimit ?? null;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.notes !== undefined) updateData.notes = input.notes ?? null;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Customer updated: ${updated.code} - ${updated.name}`);
    return updated;
  }

  static async deleteCustomer(id: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (customer._count.invoices > 0) {
      throw new Error("Cannot delete customer with existing invoices. Deactivate instead.");
    }

    await prisma.customer.delete({
      where: { id },
    });

    logger.info(`Customer deleted: ${customer.code} - ${customer.name}`);
  }

  static async getCustomerBalance(customerId: string, tenantId: string): Promise<number> {
    const invoices = await prisma.invoice.findMany({
      where: {
        customerId,
        tenantId,
        status: {
          in: ["SENT", "OVERDUE", "PARTIAL"],
        },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    let balance = 0;
    for (const invoice of invoices) {
      balance += parseFloat(invoice.totalAmount.toString()) - parseFloat(invoice.paidAmount.toString());
    }

    return balance;
  }
}
