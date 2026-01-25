import { Router, Request, Response } from "express";
import { z } from "zod";
import { BillService } from "../lib/ap/bill";
import { APPaymentService } from "../lib/ap/ap-payment";
import { APReportService } from "../lib/ap/ap-reports";
import { logger } from "../lib/logger";

export const billsRouter = Router();

const billLineSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).optional(),
  accountId: z.string().uuid().optional(),
});

const createBillSchema = z.object({
  companyId: z.string().uuid(),
  supplierId: z.string().uuid(),
  billDate: z.string().transform(str => new Date(str)),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  lines: z.array(billLineSchema).min(1),
  notes: z.string().max(1000).optional(),
});

const updateBillSchema = z.object({
  billDate: z.string().transform(str => new Date(str)).optional(),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  lines: z.array(billLineSchema).min(1).optional(),
  notes: z.string().max(1000).optional(),
});

const recordPaymentSchema = z.object({
  paymentDate: z.string().transform(str => new Date(str)),
  amount: z.number().min(0.01),
  paymentMethod: z.string().min(1).max(50),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

billsRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = createBillSchema.parse(req.body);

    const bill = await BillService.createBill({
      tenantId: user.tenantId,
      companyId: body.companyId,
      supplierId: body.supplierId,
      billDate: body.billDate,
      dueDate: body.dueDate,
      reference: body.reference,
      description: body.description,
      lines: body.lines,
      notes: body.notes,
      createdBy: user.userId,
    });

    res.status(201).json({ bill });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Create bill error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

billsRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, supplierId, status, startDate, endDate } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const filters: any = {};
    if (supplierId) filters.supplierId = supplierId as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const bills = await BillService.getBills(
      user.tenantId,
      companyId as string,
      filters
    );

    res.json({ bills });
  } catch (error) {
    logger.error({ err: error }, "Get bills error");
    res.status(500).json({ error: "Internal server error" });
  }
});

billsRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const bill = await BillService.getBillById(
      req.params.id as string,
      user.tenantId
    );

    res.json({ bill });
  } catch (error) {
    logger.error({ err: error }, "Get bill error");
    res.status(404).json({ 
      error: error instanceof Error ? error.message : "Bill not found" 
    });
  }
});

billsRouter.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = updateBillSchema.parse(req.body);

    const bill = await BillService.updateBill(
      req.params.id as string,
      user.tenantId,
      body
    );

    res.json({ bill });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Update bill error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

billsRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await BillService.deleteBill(req.params.id as string, user.tenantId);

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, "Delete bill error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

billsRouter.post("/:id/approve", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const bill = await BillService.approveBill(
      req.params.id as string,
      user.tenantId
    );

    res.json({ bill });
  } catch (error) {
    logger.error({ err: error }, "Approve bill error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

billsRouter.post("/:id/post-to-gl", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const journalEntry = await BillService.postBillToGL(
      req.params.id as string,
      user.tenantId,
      user.userId
    );

    res.json({ journalEntry });
  } catch (error) {
    logger.error({ err: error }, "Post bill to GL error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

billsRouter.post("/:id/payments", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = recordPaymentSchema.parse(req.body);

    const bill = await BillService.getBillById(req.params.id as string, user.tenantId);

    const payment = await APPaymentService.recordPayment({
      tenantId: user.tenantId,
      companyId: bill.companyId,
      supplierId: bill.supplierId,
      billId: req.params.id as string,
      paymentDate: body.paymentDate,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      reference: body.reference,
      notes: body.notes,
      createdBy: user.userId,
    });

    res.status(201).json({ payment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Record payment error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

billsRouter.get("/reports/ap-aging", async (req: Request, res: Response): Promise<void> => {
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

    const report = await APReportService.getAPAgingReport(
      user.tenantId,
      companyId as string,
      asOfDate ? new Date(asOfDate as string) : undefined
    );

    res.json(report);
  } catch (error) {
    logger.error({ err: error }, "AP aging report error");
    res.status(500).json({ error: "Internal server error" });
  }
});

billsRouter.get("/reports/supplier-statement", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, supplierId, startDate, endDate } = req.query;

    if (!companyId || !supplierId) {
      res.status(400).json({ error: "companyId and supplierId are required" });
      return;
    }

    const statement = await APReportService.getSupplierStatement(
      user.tenantId,
      companyId as string,
      supplierId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(statement);
  } catch (error) {
    logger.error({ err: error }, "Supplier statement error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});
