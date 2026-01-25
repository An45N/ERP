import { Router, Request, Response } from "express";
import { z } from "zod";
import { JournalEntryService } from "../lib/accounting/journal-entry";
import { logger } from "../lib/logger";

export const journalEntriesRouter = Router();

const journalLineSchema = z.object({
  accountId: z.string().uuid(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
});

const createJournalEntrySchema = z.object({
  companyId: z.string().uuid(),
  entryDate: z.string().transform(str => new Date(str)),
  entryType: z.enum(["MANUAL", "SYSTEM", "ADJUSTMENT", "CLOSING"]).optional(),
  reference: z.string().max(100).optional(),
  description: z.string().min(1).max(500),
  lines: z.array(journalLineSchema).min(2),
});

const updateJournalEntrySchema = z.object({
  entryDate: z.string().transform(str => new Date(str)).optional(),
  reference: z.string().max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  lines: z.array(journalLineSchema).min(2).optional(),
});

const reverseJournalEntrySchema = z.object({
  reversalDate: z.string().transform(str => new Date(str)),
  description: z.string().max(500).optional(),
});

journalEntriesRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = createJournalEntrySchema.parse(req.body);

    const entry = await JournalEntryService.createJournalEntry({
      tenantId: user.tenantId,
      companyId: body.companyId,
      entryDate: body.entryDate,
      entryType: body.entryType,
      reference: body.reference,
      description: body.description,
      lines: body.lines,
      createdBy: user.userId,
    });

    res.status(201).json({ entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Create journal entry error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

journalEntriesRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, status, entryType, startDate, endDate, fiscalPeriodId } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const filters: any = {};
    if (status) filters.status = status as string;
    if (entryType) filters.entryType = entryType as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (fiscalPeriodId) filters.fiscalPeriodId = fiscalPeriodId as string;

    const entries = await JournalEntryService.getJournalEntries(
      user.tenantId,
      companyId as string,
      filters
    );

    res.json({ entries });
  } catch (error) {
    logger.error({ err: error }, "Get journal entries error");
    res.status(500).json({ error: "Internal server error" });
  }
});

journalEntriesRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const entry = await JournalEntryService.getJournalEntryById(
      req.params.id as string,
      user.tenantId
    );

    res.json({ entry });
  } catch (error) {
    logger.error({ err: error }, "Get journal entry error");
    res.status(404).json({ 
      error: error instanceof Error ? error.message : "Journal entry not found" 
    });
  }
});

journalEntriesRouter.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = updateJournalEntrySchema.parse(req.body);

    const entry = await JournalEntryService.updateJournalEntry(
      req.params.id as string,
      user.tenantId,
      body
    );

    res.json({ entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Update journal entry error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

journalEntriesRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await JournalEntryService.deleteJournalEntry(req.params.id as string, user.tenantId);

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, "Delete journal entry error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

journalEntriesRouter.post("/:id/post", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const entry = await JournalEntryService.postJournalEntry(
      req.params.id as string,
      user.tenantId,
      user.userId
    );

    res.json({ entry });
  } catch (error) {
    logger.error({ err: error }, "Post journal entry error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

journalEntriesRouter.post("/:id/reverse", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = reverseJournalEntrySchema.parse(req.body);

    const reversingEntry = await JournalEntryService.reverseJournalEntry(
      req.params.id as string,
      user.tenantId,
      user.userId,
      body.reversalDate,
      body.description
    );

    res.json({ entry: reversingEntry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Reverse journal entry error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});
