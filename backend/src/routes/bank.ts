import { Router, Request, Response } from "express";
import { z } from "zod";
import { BankAccountService } from "../lib/bank/bank-account";
import { BankReconciliationService } from "../lib/bank/bank-reconciliation";
import { logger } from "../lib/logger";

export const bankRouter = Router();

const createBankAccountSchema = z.object({
  companyId: z.string().uuid(),
  accountNumber: z.string().min(1).max(50),
  accountName: z.string().min(1).max(255),
  bankName: z.string().min(1).max(255),
  bankBranch: z.string().max(255).optional(),
  currency: z.string().length(3).optional(),
  accountType: z.enum(["CHECKING", "SAVINGS", "CREDIT_CARD"]),
  glAccountId: z.string().uuid(),
  openingBalance: z.number().optional(),
  notes: z.string().max(1000).optional(),
});

const updateBankAccountSchema = z.object({
  accountName: z.string().min(1).max(255).optional(),
  bankName: z.string().min(1).max(255).optional(),
  bankBranch: z.string().max(255).optional(),
  accountType: z.enum(["CHECKING", "SAVINGS", "CREDIT_CARD"]).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

const bankTransactionSchema = z.object({
  transactionDate: z.string().transform(str => new Date(str)),
  description: z.string().min(1).max(500),
  reference: z.string().max(100).optional(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  balance: z.number().optional(),
  valueDate: z.string().transform(str => new Date(str)).optional(),
});

const importStatementSchema = z.object({
  companyId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  importBatch: z.string().min(1).max(100),
  transactions: z.array(bankTransactionSchema).min(1),
});

const startReconciliationSchema = z.object({
  companyId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  statementDate: z.string().transform(str => new Date(str)),
  statementBalance: z.number(),
});

const matchTransactionSchema = z.object({
  bankTransactionId: z.string().uuid(),
  journalEntryId: z.string().uuid().optional(),
});

bankRouter.post("/accounts", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = createBankAccountSchema.parse(req.body);

    const bankAccount = await BankAccountService.createBankAccount({
      tenantId: user.tenantId,
      companyId: body.companyId,
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      bankName: body.bankName,
      bankBranch: body.bankBranch,
      currency: body.currency,
      accountType: body.accountType,
      glAccountId: body.glAccountId,
      openingBalance: body.openingBalance,
      notes: body.notes,
    });

    res.status(201).json({ bankAccount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Create bank account error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

bankRouter.get("/accounts", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, isActive } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";

    const bankAccounts = await BankAccountService.getBankAccounts(
      user.tenantId,
      companyId as string,
      filters
    );

    res.json({ bankAccounts });
  } catch (error) {
    logger.error({ err: error }, "Get bank accounts error");
    res.status(500).json({ error: "Internal server error" });
  }
});

bankRouter.get("/accounts/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const bankAccount = await BankAccountService.getBankAccountById(
      req.params.id as string,
      user.tenantId
    );

    res.json({ bankAccount });
  } catch (error) {
    logger.error({ err: error }, "Get bank account error");
    res.status(404).json({ 
      error: error instanceof Error ? error.message : "Bank account not found" 
    });
  }
});

bankRouter.patch("/accounts/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = updateBankAccountSchema.parse(req.body);

    const bankAccount = await BankAccountService.updateBankAccount(
      req.params.id as string,
      user.tenantId,
      body
    );

    res.json({ bankAccount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Update bank account error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

bankRouter.delete("/accounts/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await BankAccountService.deleteBankAccount(req.params.id as string, user.tenantId);

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, "Delete bank account error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

bankRouter.post("/statements/import", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = importStatementSchema.parse(req.body);

    const result = await BankReconciliationService.importBankStatement({
      tenantId: user.tenantId,
      companyId: body.companyId,
      bankAccountId: body.bankAccountId,
      importBatch: body.importBatch,
      transactions: body.transactions,
    });

    res.status(201).json({ imported: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Import bank statement error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

bankRouter.get("/transactions", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, bankAccountId, isReconciled, startDate, endDate } = req.query;

    if (!companyId || !bankAccountId) {
      res.status(400).json({ error: "companyId and bankAccountId are required" });
      return;
    }

    const filters: any = {};
    if (isReconciled !== undefined) filters.isReconciled = isReconciled === "true";
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const transactions = await BankReconciliationService.getBankTransactions(
      user.tenantId,
      companyId as string,
      bankAccountId as string,
      filters
    );

    res.json({ transactions });
  } catch (error) {
    logger.error({ err: error }, "Get bank transactions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

bankRouter.post("/reconciliations", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = startReconciliationSchema.parse(req.body);

    const reconciliation = await BankReconciliationService.startReconciliation({
      tenantId: user.tenantId,
      companyId: body.companyId,
      bankAccountId: body.bankAccountId,
      statementDate: body.statementDate,
      statementBalance: body.statementBalance,
      reconciledBy: user.userId,
    });

    res.status(201).json({ reconciliation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Start reconciliation error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

bankRouter.get("/reconciliations", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, bankAccountId } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const reconciliations = await BankReconciliationService.getReconciliations(
      user.tenantId,
      companyId as string,
      bankAccountId as string | undefined
    );

    res.json({ reconciliations });
  } catch (error) {
    logger.error({ err: error }, "Get reconciliations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

bankRouter.get("/reconciliations/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const reconciliation = await BankReconciliationService.getReconciliationById(
      req.params.id as string,
      user.tenantId
    );

    res.json({ reconciliation });
  } catch (error) {
    logger.error({ err: error }, "Get reconciliation error");
    res.status(404).json({ 
      error: error instanceof Error ? error.message : "Reconciliation not found" 
    });
  }
});

bankRouter.post("/reconciliations/:id/match", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = matchTransactionSchema.parse(req.body);

    await BankReconciliationService.matchTransaction(
      req.params.id as string,
      user.tenantId,
      body.bankTransactionId,
      body.journalEntryId
    );

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Match transaction error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

bankRouter.post("/transactions/:id/unmatch", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await BankReconciliationService.unmatchTransaction(
      user.tenantId,
      req.params.id as string
    );

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Unmatch transaction error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

bankRouter.post("/reconciliations/:id/complete", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await BankReconciliationService.completeReconciliation(
      req.params.id as string,
      user.tenantId
    );

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Complete reconciliation error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

bankRouter.get("/transactions/:id/suggest-matches", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, bankAccountId } = req.query;

    if (!companyId || !bankAccountId) {
      res.status(400).json({ error: "companyId and bankAccountId are required" });
      return;
    }

    const suggestions = await BankReconciliationService.suggestMatches(
      user.tenantId,
      companyId as string,
      bankAccountId as string,
      req.params.id as string
    );

    res.json({ suggestions });
  } catch (error) {
    logger.error({ err: error }, "Suggest matches error");
    res.status(500).json({ error: "Internal server error" });
  }
});
