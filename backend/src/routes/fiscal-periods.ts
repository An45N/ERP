import { Router, Request, Response } from "express";
import { z } from "zod";
import { FiscalPeriodService } from "../lib/accounting/fiscal-period";
import { logger } from "../lib/logger";

export const fiscalPeriodsRouter = Router();

const createFiscalPeriodSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(100),
  periodType: z.enum(["YEAR", "QUARTER", "MONTH"]),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

fiscalPeriodsRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = createFiscalPeriodSchema.parse(req.body);

    const period = await FiscalPeriodService.createFiscalPeriod({
      tenantId: user.tenantId,
      companyId: body.companyId,
      name: body.name,
      periodType: body.periodType,
      startDate: body.startDate,
      endDate: body.endDate,
    });

    res.status(201).json({ period });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Create fiscal period error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

fiscalPeriodsRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, status, periodType } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const filters: any = {};
    if (status) filters.status = status as string;
    if (periodType) filters.periodType = periodType as string;

    const periods = await FiscalPeriodService.getFiscalPeriods(
      user.tenantId,
      companyId as string,
      filters
    );

    res.json({ periods });
  } catch (error) {
    logger.error({ err: error }, "Get fiscal periods error");
    res.status(500).json({ error: "Internal server error" });
  }
});

fiscalPeriodsRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const period = await FiscalPeriodService.getFiscalPeriodById(
      req.params.id as string,
      user.tenantId
    );

    res.json({ period });
  } catch (error) {
    logger.error({ err: error }, "Get fiscal period error");
    res.status(404).json({ 
      error: error instanceof Error ? error.message : "Fiscal period not found" 
    });
  }
});

fiscalPeriodsRouter.post("/:id/close", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const period = await FiscalPeriodService.closeFiscalPeriod(
      req.params.id as string,
      user.tenantId,
      user.userId
    );

    res.json({ period });
  } catch (error) {
    logger.error({ err: error }, "Close fiscal period error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

fiscalPeriodsRouter.post("/:id/reopen", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const period = await FiscalPeriodService.reopenFiscalPeriod(
      req.params.id as string,
      user.tenantId
    );

    res.json({ period });
  } catch (error) {
    logger.error({ err: error }, "Reopen fiscal period error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

fiscalPeriodsRouter.post("/initialize", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, fiscalYearStart } = req.body;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const periods = await FiscalPeriodService.createDefaultFiscalPeriods(
      user.tenantId,
      companyId,
      fiscalYearStart || 1
    );

    res.status(201).json({ 
      message: "Default fiscal periods created",
      periodsCreated: periods.length,
      periods
    });
  } catch (error) {
    logger.error({ err: error }, "Initialize fiscal periods error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});
