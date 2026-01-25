import { prisma } from "../prisma";
import { logger } from "../logger";

export interface CreateFiscalPeriodInput {
  tenantId: string;
  companyId: string;
  name: string;
  periodType: "YEAR" | "QUARTER" | "MONTH";
  startDate: Date;
  endDate: Date;
}

export class FiscalPeriodService {
  static async createFiscalPeriod(input: CreateFiscalPeriodInput) {
    const overlapping = await prisma.fiscalPeriod.findFirst({
      where: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        OR: [
          {
            AND: [
              { startDate: { lte: input.startDate } },
              { endDate: { gte: input.startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: input.endDate } },
              { endDate: { gte: input.endDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new Error("Fiscal period overlaps with existing period");
    }

    const period = await prisma.fiscalPeriod.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        name: input.name,
        periodType: input.periodType,
        startDate: input.startDate,
        endDate: input.endDate,
        status: "OPEN",
      },
    });

    logger.info(`Fiscal period created: ${period.name}`);
    return period;
  }

  static async getFiscalPeriods(tenantId: string, companyId: string, filters?: {
    status?: string;
    periodType?: string;
  }) {
    const where: any = {
      tenantId,
      companyId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.periodType) {
      where.periodType = filters.periodType;
    }

    const periods = await prisma.fiscalPeriod.findMany({
      where,
      orderBy: [
        { startDate: "desc" },
      ],
    });

    return periods;
  }

  static async getFiscalPeriodById(id: string, tenantId: string) {
    const period = await prisma.fiscalPeriod.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            journalEntries: true,
          },
        },
      },
    });

    if (!period) {
      throw new Error("Fiscal period not found");
    }

    return period;
  }

  static async findPeriodForDate(tenantId: string, companyId: string, date: Date) {
    const period = await prisma.fiscalPeriod.findFirst({
      where: {
        tenantId,
        companyId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    return period;
  }

  static async closeFiscalPeriod(id: string, tenantId: string, userId: string) {
    const period = await prisma.fiscalPeriod.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      throw new Error("Fiscal period not found");
    }

    if (period.status === "CLOSED" || period.status === "LOCKED") {
      throw new Error("Fiscal period is already closed");
    }

    const draftEntries = await prisma.journalEntry.count({
      where: {
        tenantId,
        fiscalPeriodId: id,
        status: "DRAFT",
      },
    });

    if (draftEntries > 0) {
      throw new Error(`Cannot close period with ${draftEntries} draft entries`);
    }

    const updated = await prisma.fiscalPeriod.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedBy: userId,
        closedAt: new Date(),
      },
    });

    logger.info(`Fiscal period closed: ${updated.name} by user ${userId}`);
    return updated;
  }

  static async reopenFiscalPeriod(id: string, tenantId: string) {
    const period = await prisma.fiscalPeriod.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!period) {
      throw new Error("Fiscal period not found");
    }

    if (period.status === "LOCKED") {
      throw new Error("Cannot reopen locked period");
    }

    const updated = await prisma.fiscalPeriod.update({
      where: { id },
      data: {
        status: "OPEN",
        closedBy: null,
        closedAt: null,
      },
    });

    logger.info(`Fiscal period reopened: ${updated.name}`);
    return updated;
  }

  static async createDefaultFiscalPeriods(tenantId: string, companyId: string, fiscalYearStart: number = 1) {
    logger.info(`Creating default fiscal periods for company ${companyId}`);

    const currentYear = new Date().getFullYear();
    const periods = [];

    const yearStartMonth = fiscalYearStart - 1;
    const yearStart = new Date(currentYear, yearStartMonth, 1);
    const yearEnd = new Date(currentYear + 1, yearStartMonth, 0);

    const fiscalYear = await this.createFiscalPeriod({
      tenantId,
      companyId,
      name: `FY ${currentYear}`,
      periodType: "YEAR",
      startDate: yearStart,
      endDate: yearEnd,
    });
    periods.push(fiscalYear);

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, yearStartMonth + month, 1);
      const monthEnd = new Date(currentYear, yearStartMonth + month + 1, 0);

      const monthName = monthStart.toLocaleString("en-US", { month: "short", year: "numeric" });

      const monthPeriod = await this.createFiscalPeriod({
        tenantId,
        companyId,
        name: monthName,
        periodType: "MONTH",
        startDate: monthStart,
        endDate: monthEnd,
      });
      periods.push(monthPeriod);
    }

    logger.info(`Created ${periods.length} fiscal periods`);
    return periods;
  }
}
