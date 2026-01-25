import { Router, Request, Response } from "express";
import { z } from "zod";
import { TaxService } from "../lib/tax/tax-service";
import { VATReportService } from "../lib/tax/vat-reports";
import { logger } from "../lib/logger";

export const taxRouter = Router();

const createTaxRateSchema = z.object({
  companyId: z.string().uuid(),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  rate: z.number().min(0).max(100),
  taxType: z.enum(["VAT", "SALES_TAX", "WITHHOLDING", "EXCISE", "OTHER"]),
  effectiveFrom: z.string().transform(str => new Date(str)),
  effectiveTo: z.string().transform(str => new Date(str)).optional(),
  description: z.string().max(500).optional(),
  taxAccountId: z.string().uuid().optional(),
  isDefault: z.boolean().optional(),
});

const updateTaxRateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  rate: z.number().min(0).max(100).optional(),
  effectiveTo: z.string().transform(str => new Date(str)).optional(),
  description: z.string().max(500).optional(),
  taxAccountId: z.string().uuid().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

taxRouter.post("/rates", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = createTaxRateSchema.parse(req.body);

    const taxRate = await TaxService.createTaxRate({
      tenantId: user.tenantId,
      companyId: body.companyId,
      code: body.code,
      name: body.name,
      rate: body.rate,
      taxType: body.taxType,
      effectiveFrom: body.effectiveFrom,
      effectiveTo: body.effectiveTo,
      description: body.description,
      taxAccountId: body.taxAccountId,
      isDefault: body.isDefault,
    });

    res.status(201).json({ taxRate });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Create tax rate error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

taxRouter.get("/rates", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, taxType, isActive, asOfDate } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const filters: any = {};
    if (taxType) filters.taxType = taxType as string;
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (asOfDate) filters.asOfDate = new Date(asOfDate as string);

    const taxRates = await TaxService.getTaxRates(
      user.tenantId,
      companyId as string,
      filters
    );

    res.json({ taxRates });
  } catch (error) {
    logger.error({ err: error }, "Get tax rates error");
    res.status(500).json({ error: "Internal server error" });
  }
});

taxRouter.get("/rates/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const taxRate = await TaxService.getTaxRateById(
      req.params.id as string,
      user.tenantId
    );

    res.json({ taxRate });
  } catch (error) {
    logger.error({ err: error }, "Get tax rate error");
    res.status(404).json({ 
      error: error instanceof Error ? error.message : "Tax rate not found" 
    });
  }
});

taxRouter.patch("/rates/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = updateTaxRateSchema.parse(req.body);

    const taxRate = await TaxService.updateTaxRate(
      req.params.id as string,
      user.tenantId,
      body
    );

    res.json({ taxRate });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Update tax rate error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

taxRouter.delete("/rates/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await TaxService.deleteTaxRate(req.params.id as string, user.tenantId);

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, "Delete tax rate error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

taxRouter.get("/transactions", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, taxRateId, transactionType, startDate, endDate } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const filters: any = {};
    if (taxRateId) filters.taxRateId = taxRateId as string;
    if (transactionType) filters.transactionType = transactionType as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const transactions = await TaxService.getTaxTransactions(
      user.tenantId,
      companyId as string,
      filters
    );

    res.json({ transactions });
  } catch (error) {
    logger.error({ err: error }, "Get tax transactions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

taxRouter.post("/transactions/:id/reverse", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await TaxService.reverseTaxTransaction(req.params.id as string, user.tenantId);

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Reverse tax transaction error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

taxRouter.get("/vat/return", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
      res.status(400).json({ error: "companyId, startDate, and endDate are required" });
      return;
    }

    const vatReturn = await VATReportService.getVATReturn(
      user.tenantId,
      companyId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(vatReturn);
  } catch (error) {
    logger.error({ err: error }, "Get VAT return error");
    res.status(500).json({ error: "Internal server error" });
  }
});

taxRouter.get("/vat/transactions", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, startDate, endDate, transactionType } = req.query;

    if (!companyId || !startDate || !endDate) {
      res.status(400).json({ error: "companyId, startDate, and endDate are required" });
      return;
    }

    const transactions = await VATReportService.getVATTransactionDetails(
      user.tenantId,
      companyId as string,
      new Date(startDate as string),
      new Date(endDate as string),
      transactionType as string | undefined
    );

    res.json({ transactions });
  } catch (error) {
    logger.error({ err: error }, "Get VAT transactions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

taxRouter.get("/vat/by-rate", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
      res.status(400).json({ error: "companyId, startDate, and endDate are required" });
      return;
    }

    const breakdown = await VATReportService.getVATByRate(
      user.tenantId,
      companyId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ breakdown });
  } catch (error) {
    logger.error({ err: error }, "Get VAT by rate error");
    res.status(500).json({ error: "Internal server error" });
  }
});

taxRouter.get("/vat/liability", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, asOfDate } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const liability = await VATReportService.getVATLiability(
      user.tenantId,
      companyId as string,
      asOfDate ? new Date(asOfDate as string) : new Date()
    );

    res.json(liability);
  } catch (error) {
    logger.error({ err: error }, "Get VAT liability error");
    res.status(500).json({ error: "Internal server error" });
  }
});

taxRouter.get("/vat/mra-return", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
      res.status(400).json({ error: "companyId, startDate, and endDate are required" });
      return;
    }

    const mraReturn = await VATReportService.generateMRAVATReturn(
      user.tenantId,
      companyId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(mraReturn);
  } catch (error) {
    logger.error({ err: error }, "Generate MRA VAT return error");
    res.status(500).json({ error: "Internal server error" });
  }
});

taxRouter.get("/vat/audit-trail", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
      res.status(400).json({ error: "companyId, startDate, and endDate are required" });
      return;
    }

    const auditTrail = await VATReportService.getVATAuditTrail(
      user.tenantId,
      companyId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ auditTrail });
  } catch (error) {
    logger.error({ err: error }, "Get VAT audit trail error");
    res.status(500).json({ error: "Internal server error" });
  }
});
