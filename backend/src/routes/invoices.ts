import { Router, Request, Response } from "express";
import { z } from "zod";
import { InvoiceService } from "../lib/ar/invoice";
import { PaymentService } from "../lib/ar/payment";
import { ARReportService } from "../lib/ar/ar-reports";
import { logger } from "../lib/logger";

export const invoicesRouter = Router();

const invoiceLineSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).optional(),
  accountId: z.string().uuid().optional(),
});

const createInvoiceSchema = z.object({
  companyId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceDate: z.string().transform(str => new Date(str)),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  lines: z.array(invoiceLineSchema).min(1),
  notes: z.string().max(1000).optional(),
});

const updateInvoiceSchema = z.object({
  invoiceDate: z.string().transform(str => new Date(str)).optional(),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  lines: z.array(invoiceLineSchema).min(1).optional(),
  notes: z.string().max(1000).optional(),
});

const recordPaymentSchema = z.object({
  paymentDate: z.string().transform(str => new Date(str)),
  amount: z.number().min(0.01),
  paymentMethod: z.string().min(1).max(50),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

invoicesRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = createInvoiceSchema.parse(req.body);

    const invoice = await InvoiceService.createInvoice({
      tenantId: user.tenantId,
      companyId: body.companyId,
      customerId: body.customerId,
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate,
      reference: body.reference,
      description: body.description,
      lines: body.lines,
      notes: body.notes,
      createdBy: user.userId,
    });

    res.status(201).json({ invoice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Create invoice error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

invoicesRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, customerId, status, startDate, endDate } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const filters: any = {};
    if (customerId) filters.customerId = customerId as string;
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const invoices = await InvoiceService.getInvoices(
      user.tenantId,
      companyId as string,
      filters
    );

    res.json({ invoices });
  } catch (error) {
    logger.error({ err: error }, "Get invoices error");
    res.status(500).json({ error: "Internal server error" });
  }
});

invoicesRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const invoice = await InvoiceService.getInvoiceById(
      req.params.id as string,
      user.tenantId
    );

    res.json({ invoice });
  } catch (error) {
    logger.error({ err: error }, "Get invoice error");
    res.status(404).json({ 
      error: error instanceof Error ? error.message : "Invoice not found" 
    });
  }
});

invoicesRouter.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = updateInvoiceSchema.parse(req.body);

    const invoice = await InvoiceService.updateInvoice(
      req.params.id as string,
      user.tenantId,
      body
    );

    res.json({ invoice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Update invoice error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

invoicesRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await InvoiceService.deleteInvoice(req.params.id as string, user.tenantId);

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, "Delete invoice error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

invoicesRouter.post("/:id/send", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const invoice = await InvoiceService.sendInvoice(
      req.params.id as string,
      user.tenantId
    );

    res.json({ invoice });
  } catch (error) {
    logger.error({ err: error }, "Send invoice error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

invoicesRouter.post("/:id/post-to-gl", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const journalEntry = await InvoiceService.postInvoiceToGL(
      req.params.id as string,
      user.tenantId,
      user.userId
    );

    res.json({ journalEntry });
  } catch (error) {
    logger.error({ err: error }, "Post invoice to GL error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

invoicesRouter.post("/:id/payments", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = recordPaymentSchema.parse(req.body);

    const invoice = await InvoiceService.getInvoiceById(req.params.id as string, user.tenantId);

    const payment = await PaymentService.recordPayment({
      tenantId: user.tenantId,
      companyId: invoice.companyId,
      customerId: invoice.customerId,
      invoiceId: req.params.id as string,
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

invoicesRouter.get("/reports/ar-aging", async (req: Request, res: Response): Promise<void> => {
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

    const report = await ARReportService.getARAgingReport(
      user.tenantId,
      companyId as string,
      asOfDate ? new Date(asOfDate as string) : undefined
    );

    res.json(report);
  } catch (error) {
    logger.error({ err: error }, "AR aging report error");
    res.status(500).json({ error: "Internal server error" });
  }
});

invoicesRouter.get("/reports/customer-statement", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, customerId, startDate, endDate } = req.query;

    if (!companyId || !customerId) {
      res.status(400).json({ error: "companyId and customerId are required" });
      return;
    }

    const statement = await ARReportService.getCustomerStatement(
      user.tenantId,
      companyId as string,
      customerId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(statement);
  } catch (error) {
    logger.error({ err: error }, "Customer statement error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});
