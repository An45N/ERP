import { Router, Request, Response } from "express";
import { z } from "zod";
import { ChartOfAccountsService } from "../lib/accounting/chart-of-accounts";
import { logger } from "../lib/logger";

export const accountsRouter = Router();

const createAccountSchema = z.object({
  companyId: z.string().uuid(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  category: z.string().min(1).max(50),
  subCategory: z.string().max(50).optional(),
  currency: z.string().length(3).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.string().min(1).max(50).optional(),
  subCategory: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

accountsRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = createAccountSchema.parse(req.body);

    const accountData: any = {
      tenantId: user.tenantId,
      companyId: body.companyId,
      code: body.code,
      name: body.name,
      type: body.type,
      category: body.category,
    };

    if (body.subCategory) accountData.subCategory = body.subCategory;
    if (body.currency) accountData.currency = body.currency;
    if (body.description) accountData.description = body.description;
    if (body.parentId) accountData.parentId = body.parentId;

    const account = await ChartOfAccountsService.createAccount(accountData);

    res.status(201).json({ account });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Create account error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

accountsRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, type, category, isActive, search } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const filters: any = {};
    if (type) filters.type = type as string;
    if (category) filters.category = category as string;
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (search) filters.search = search as string;

    const accounts = await ChartOfAccountsService.getAccounts(
      user.tenantId,
      companyId as string,
      filters
    );

    res.json({ accounts });
  } catch (error) {
    logger.error({ err: error }, "Get accounts error");
    res.status(500).json({ error: "Internal server error" });
  }
});

accountsRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const account = await ChartOfAccountsService.getAccountById(
      req.params.id as string,
      user.tenantId
    );

    res.json({ account });
  } catch (error) {
    logger.error({ err: error }, "Get account error");
    res.status(404).json({ 
      error: error instanceof Error ? error.message : "Account not found" 
    });
  }
});

accountsRouter.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = updateAccountSchema.parse(req.body);

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.subCategory !== undefined) updateData.subCategory = body.subCategory;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const account = await ChartOfAccountsService.updateAccount(
      req.params.id as string,
      user.tenantId,
      updateData
    );

    res.json({ account });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Update account error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

accountsRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await ChartOfAccountsService.deleteAccount(req.params.id as string, user.tenantId);

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, "Delete account error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

accountsRouter.post("/initialize", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId } = req.body;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const count = await ChartOfAccountsService.createDefaultChartOfAccounts(
      user.tenantId,
      companyId
    );

    res.status(201).json({ 
      message: "Default chart of accounts created",
      accountsCreated: count
    });
  } catch (error) {
    logger.error({ err: error }, "Initialize chart of accounts error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});
