import { prisma } from "../prisma";
import { logger } from "../logger";

export interface CreateSupplierInput {
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
  currency?: string | undefined;
  notes?: string | undefined;
}

export interface UpdateSupplierInput {
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
  currency?: string | undefined;
  notes?: string | undefined;
  isActive?: boolean | undefined;
}

export class SupplierService {
  static async generateSupplierCode(tenantId: string, companyId: string): Promise<string> {
    const lastSupplier = await prisma.supplier.findFirst({
      where: {
        tenantId,
        companyId,
        code: {
          startsWith: "SUPP-",
        },
      },
      orderBy: {
        code: "desc",
      },
    });

    let nextNumber = 1;
    if (lastSupplier && lastSupplier.code) {
      const lastNumber = parseInt(lastSupplier.code.split("-").pop() || "0");
      nextNumber = lastNumber + 1;
    }

    return `SUPP-${nextNumber.toString().padStart(5, "0")}`;
  }

  static async createSupplier(input: CreateSupplierInput) {
    const existingSupplier = await prisma.supplier.findFirst({
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

    if (existingSupplier) {
      if (existingSupplier.name === input.name) {
        throw new Error("Supplier with this name already exists");
      }
      if (input.code && existingSupplier.code === input.code) {
        throw new Error("Supplier with this code already exists");
      }
      if (input.email && existingSupplier.email === input.email) {
        throw new Error("Supplier with this email already exists");
      }
    }

    const code = input.code || await this.generateSupplierCode(input.tenantId, input.companyId);

    const supplier = await prisma.supplier.create({
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
        currency: input.currency || "MUR",
        notes: input.notes ?? null,
        isActive: true,
      },
    });

    logger.info(`Supplier created: ${supplier.code} - ${supplier.name}`);
    return supplier;
  }

  static async getSuppliers(tenantId: string, companyId: string, filters?: {
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

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: [
        { code: "asc" },
      ],
      include: {
        _count: {
          select: {
            bills: true,
          },
        },
      },
    });

    return suppliers;
  }

  static async getSupplierById(id: string, tenantId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        bills: {
          orderBy: {
            billDate: "desc",
          },
          take: 10,
          select: {
            id: true,
            billNumber: true,
            billDate: true,
            dueDate: true,
            totalAmount: true,
            status: true,
          },
        },
        _count: {
          select: {
            bills: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  }

  static async updateSupplier(id: string, tenantId: string, input: UpdateSupplierInput) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    if (input.code && input.code !== supplier.code) {
      const existingCode = await prisma.supplier.findFirst({
        where: {
          tenantId,
          companyId: supplier.companyId,
          code: input.code,
          id: { not: id },
        },
      });

      if (existingCode) {
        throw new Error("Supplier code already exists");
      }
    }

    if (input.email && input.email !== supplier.email) {
      const existingEmail = await prisma.supplier.findFirst({
        where: {
          tenantId,
          companyId: supplier.companyId,
          email: input.email,
          id: { not: id },
        },
      });

      if (existingEmail) {
        throw new Error("Supplier email already exists");
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
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.notes !== undefined) updateData.notes = input.notes ?? null;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updated = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Supplier updated: ${updated.code} - ${updated.name}`);
    return updated;
  }

  static async deleteSupplier(id: string, tenantId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            bills: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    if (supplier._count.bills > 0) {
      throw new Error("Cannot delete supplier with existing bills. Deactivate instead.");
    }

    await prisma.supplier.delete({
      where: { id },
    });

    logger.info(`Supplier deleted: ${supplier.code} - ${supplier.name}`);
  }

  static async getSupplierBalance(supplierId: string, tenantId: string): Promise<number> {
    const bills = await prisma.bill.findMany({
      where: {
        supplierId,
        tenantId,
        status: {
          in: ["APPROVED", "OVERDUE", "PARTIAL"],
        },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    let balance = 0;
    for (const bill of bills) {
      balance += parseFloat(bill.totalAmount.toString()) - parseFloat(bill.paidAmount.toString());
    }

    return balance;
  }
}
