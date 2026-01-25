import { prisma } from "../prisma";
import { logger } from "../logger";
import { FiscalPeriodService } from "./fiscal-period";

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
  description?: string | undefined;
  reference?: string | undefined;
}

export interface CreateJournalEntryInput {
  tenantId: string;
  companyId: string;
  entryDate: Date;
  entryType?: "MANUAL" | "SYSTEM" | "ADJUSTMENT" | "CLOSING" | undefined;
  reference?: string | undefined;
  description: string;
  lines: JournalLineInput[];
  createdBy: string;
}

export interface UpdateJournalEntryInput {
  entryDate?: Date | undefined;
  reference?: string | undefined;
  description?: string | undefined;
  lines?: JournalLineInput[] | undefined;
}

export class JournalEntryService {
  static validateLines(lines: JournalLineInput[]): void {
    if (!lines || lines.length < 2) {
      throw new Error("Journal entry must have at least 2 lines");
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of lines) {
      if (line.debit < 0 || line.credit < 0) {
        throw new Error("Debit and credit amounts must be non-negative");
      }

      if (line.debit > 0 && line.credit > 0) {
        throw new Error("A line cannot have both debit and credit amounts");
      }

      if (line.debit === 0 && line.credit === 0) {
        throw new Error("A line must have either debit or credit amount");
      }

      totalDebits += line.debit;
      totalCredits += line.credit;
    }

    const difference = Math.abs(totalDebits - totalCredits);
    if (difference > 0.01) {
      throw new Error(`Journal entry is not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`);
    }
  }

  static async generateEntryNumber(tenantId: string, companyId: string): Promise<string> {
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
        entryNumber: "desc",
      },
    });

    let nextNumber = 1;
    if (lastEntry) {
      const lastNumber = parseInt(lastEntry.entryNumber.split("-").pop() || "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, "0")}`;
  }

  static async createJournalEntry(input: CreateJournalEntryInput) {
    this.validateLines(input.lines);

    const fiscalPeriod = await FiscalPeriodService.findPeriodForDate(
      input.tenantId,
      input.companyId,
      input.entryDate
    );

    if (!fiscalPeriod) {
      throw new Error("No fiscal period found for entry date");
    }

    if (fiscalPeriod.status === "CLOSED" || fiscalPeriod.status === "LOCKED") {
      throw new Error("Cannot post to closed or locked fiscal period");
    }

    for (const line of input.lines) {
      const account = await prisma.account.findFirst({
        where: {
          id: line.accountId,
          tenantId: input.tenantId,
          companyId: input.companyId,
        },
      });

      if (!account) {
        throw new Error(`Account ${line.accountId} not found`);
      }

      if (!account.isActive) {
        throw new Error(`Account ${account.code} - ${account.name} is inactive`);
      }
    }

    const entryNumber = await this.generateEntryNumber(input.tenantId, input.companyId);

    const entry = await prisma.journalEntry.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        fiscalPeriodId: fiscalPeriod.id,
        entryNumber,
        entryDate: input.entryDate,
        entryType: input.entryType || "MANUAL",
        reference: input.reference ?? null,
        description: input.description,
        status: "DRAFT",
        createdBy: input.createdBy,
        lines: {
          create: input.lines.map((line, index) => ({
            accountId: line.accountId,
            lineNumber: index + 1,
            debit: line.debit,
            credit: line.credit,
            description: line.description ?? null,
            reference: line.reference ?? null,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            lineNumber: "asc",
          },
        },
        fiscalPeriod: {
          select: {
            name: true,
            status: true,
          },
        },
      },
    });

    logger.info(`Journal entry created: ${entry.entryNumber} (DRAFT)`);
    return entry;
  }

  static async getJournalEntries(tenantId: string, companyId: string, filters?: {
    status?: string;
    entryType?: string;
    startDate?: Date;
    endDate?: Date;
    fiscalPeriodId?: string;
  }) {
    const where: any = {
      tenantId,
      companyId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.entryType) {
      where.entryType = filters.entryType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.entryDate = {};
      if (filters.startDate) {
        where.entryDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.entryDate.lte = filters.endDate;
      }
    }

    if (filters?.fiscalPeriodId) {
      where.fiscalPeriodId = filters.fiscalPeriodId;
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            lineNumber: "asc",
          },
        },
        fiscalPeriod: {
          select: {
            name: true,
            status: true,
          },
        },
      },
      orderBy: [
        { entryDate: "desc" },
        { entryNumber: "desc" },
      ],
    });

    return entries;
  }

  static async getJournalEntryById(id: string, tenantId: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
                category: true,
              },
            },
          },
          orderBy: {
            lineNumber: "asc",
          },
        },
        fiscalPeriod: {
          select: {
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!entry) {
      throw new Error("Journal entry not found");
    }

    return entry;
  }

  static async updateJournalEntry(id: string, tenantId: string, input: UpdateJournalEntryInput) {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!entry) {
      throw new Error("Journal entry not found");
    }

    if (entry.status !== "DRAFT") {
      throw new Error("Can only update draft journal entries");
    }

    if (input.lines) {
      this.validateLines(input.lines);

      await prisma.journalLine.deleteMany({
        where: {
          journalEntryId: id,
        },
      });
    }

    const updateData: any = {};
    if (input.entryDate) updateData.entryDate = input.entryDate;
    if (input.reference !== undefined) updateData.reference = input.reference ?? null;
    if (input.description) updateData.description = input.description;

    if (input.lines) {
      updateData.lines = {
        create: input.lines.map((line, index) => ({
          accountId: line.accountId,
          lineNumber: index + 1,
          debit: line.debit,
          credit: line.credit,
          description: line.description ?? null,
          reference: line.reference ?? null,
        })),
      };
    }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: updateData,
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            lineNumber: "asc",
          },
        },
      },
    });

    logger.info(`Journal entry updated: ${updated.entryNumber}`);
    return updated;
  }

  static async postJournalEntry(id: string, tenantId: string, userId: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        fiscalPeriod: true,
        lines: true,
      },
    });

    if (!entry) {
      throw new Error("Journal entry not found");
    }

    if (entry.status !== "DRAFT") {
      throw new Error("Can only post draft journal entries");
    }

    if (entry.fiscalPeriod.status === "CLOSED" || entry.fiscalPeriod.status === "LOCKED") {
      throw new Error("Cannot post to closed or locked fiscal period");
    }

    const posted = await prisma.journalEntry.update({
      where: { id },
      data: {
        status: "POSTED",
        postedBy: userId,
        postedAt: new Date(),
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            lineNumber: "asc",
          },
        },
      },
    });

    logger.info(`Journal entry posted: ${posted.entryNumber} by user ${userId}`);
    return posted;
  }

  static async reverseJournalEntry(id: string, tenantId: string, userId: string, reversalDate: Date, description?: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!entry) {
      throw new Error("Journal entry not found");
    }

    if (entry.status !== "POSTED") {
      throw new Error("Can only reverse posted journal entries");
    }

    if (entry.reversedAt) {
      throw new Error("Journal entry has already been reversed");
    }

    const fiscalPeriod = await FiscalPeriodService.findPeriodForDate(
      tenantId,
      entry.companyId,
      reversalDate
    );

    if (!fiscalPeriod) {
      throw new Error("No fiscal period found for reversal date");
    }

    if (fiscalPeriod.status === "CLOSED" || fiscalPeriod.status === "LOCKED") {
      throw new Error("Cannot post reversal to closed or locked fiscal period");
    }

    const reversingLines: JournalLineInput[] = entry.lines.map(line => ({
      accountId: line.accountId,
      debit: parseFloat(line.credit.toString()),
      credit: parseFloat(line.debit.toString()),
      description: `Reversal of ${entry.entryNumber}`,
    }));

    const reversingEntry = await this.createJournalEntry({
      tenantId,
      companyId: entry.companyId,
      entryDate: reversalDate,
      entryType: "ADJUSTMENT",
      reference: entry.entryNumber,
      description: description || `Reversal of ${entry.entryNumber} - ${entry.description}`,
      lines: reversingLines,
      createdBy: userId,
    });

    await this.postJournalEntry(reversingEntry.id, tenantId, userId);

    await prisma.journalEntry.update({
      where: { id },
      data: {
        status: "REVERSED",
        reversedBy: userId,
        reversedAt: new Date(),
        reversingEntryId: reversingEntry.id,
      },
    });

    logger.info(`Journal entry reversed: ${entry.entryNumber} by ${reversingEntry.entryNumber}`);
    return reversingEntry;
  }

  static async deleteJournalEntry(id: string, tenantId: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!entry) {
      throw new Error("Journal entry not found");
    }

    if (entry.status !== "DRAFT") {
      throw new Error("Can only delete draft journal entries");
    }

    await prisma.journalEntry.delete({
      where: { id },
    });

    logger.info(`Journal entry deleted: ${entry.entryNumber}`);
  }
}
