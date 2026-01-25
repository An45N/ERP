import { Router, Request, Response } from "express";
import { z } from "zod";
import { ReportService } from "../lib/accounting/reports";
import { GeneralLedgerService } from "../lib/accounting/general-ledger";
import { logger } from "../lib/logger";

export const reportsRouter = Router();

const generalLedgerQuerySchema = z.object({
  companyId: z.string().uuid(),
  accountId: z.string().uuid().optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  fiscalPeriodId: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "POSTED", "REVERSED"]).optional(),
});

const trialBalanceQuerySchema = z.object({
  companyId: z.string().uuid(),
  asOfDate: z.string().transform(str => new Date(str)).optional(),
});

const balanceSheetQuerySchema = z.object({
  companyId: z.string().uuid(),
  asOfDate: z.string().transform(str => new Date(str)).optional(),
});

const incomeStatementQuerySchema = z.object({
  companyId: z.string().uuid(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
});

const accountActivityQuerySchema = z.object({
  companyId: z.string().uuid(),
  accountId: z.string().uuid(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
});

reportsRouter.get("/general-ledger", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const query = generalLedgerQuerySchema.parse(req.query);

    const entries = await GeneralLedgerService.getGeneralLedger(
      user.tenantId,
      query.companyId,
      {
        accountId: query.accountId,
        startDate: query.startDate,
        endDate: query.endDate,
        fiscalPeriodId: query.fiscalPeriodId,
        status: query.status,
      }
    );

    res.json({ entries });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "General ledger query error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

reportsRouter.get("/trial-balance", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const query = trialBalanceQuerySchema.parse(req.query);

    const report = await ReportService.getTrialBalance(
      user.tenantId,
      query.companyId,
      query.asOfDate
    );

    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Trial balance error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

reportsRouter.get("/balance-sheet", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const query = balanceSheetQuerySchema.parse(req.query);

    const report = await ReportService.getBalanceSheet(
      user.tenantId,
      query.companyId,
      query.asOfDate
    );

    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Balance sheet error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

reportsRouter.get("/income-statement", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const query = incomeStatementQuerySchema.parse(req.query);

    const report = await ReportService.getIncomeStatement(
      user.tenantId,
      query.companyId,
      query.startDate,
      query.endDate
    );

    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Income statement error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

reportsRouter.get("/account-activity", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const query = accountActivityQuerySchema.parse(req.query);

    const report = await GeneralLedgerService.getAccountActivity(
      user.tenantId,
      query.companyId,
      query.accountId,
      query.startDate,
      query.endDate
    );

    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Account activity error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});
