import { Router, Request, Response } from "express";
import { z } from "zod";
import { CustomerService } from "../lib/ar/customer";
import { logger } from "../lib/logger";

export const customersRouter = Router();

const createCustomerSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  legalName: z.string().max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  website: z.string().max(255).optional(),
  taxId: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
  paymentTerms: z.number().int().min(0).optional(),
  creditLimit: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(1000).optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().max(50).optional(),
  legalName: z.string().max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  website: z.string().max(255).optional(),
  taxId: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
  paymentTerms: z.number().int().min(0).optional(),
  creditLimit: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

customersRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = createCustomerSchema.parse(req.body);

    const customer = await CustomerService.createCustomer({
      tenantId: user.tenantId,
      companyId: body.companyId,
      name: body.name,
      code: body.code,
      legalName: body.legalName,
      email: body.email,
      phone: body.phone,
      mobile: body.mobile,
      website: body.website,
      taxId: body.taxId,
      address: body.address,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country,
      paymentTerms: body.paymentTerms,
      creditLimit: body.creditLimit,
      currency: body.currency,
      notes: body.notes,
    });

    res.status(201).json({ customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Create customer error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

customersRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { companyId, isActive, search } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "companyId is required" });
      return;
    }

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (search) filters.search = search as string;

    const customers = await CustomerService.getCustomers(
      user.tenantId,
      companyId as string,
      filters
    );

    res.json({ customers });
  } catch (error) {
    logger.error({ err: error }, "Get customers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

customersRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const customer = await CustomerService.getCustomerById(
      req.params.id as string,
      user.tenantId
    );

    res.json({ customer });
  } catch (error) {
    logger.error({ err: error }, "Get customer error");
    res.status(404).json({ 
      error: error instanceof Error ? error.message : "Customer not found" 
    });
  }
});

customersRouter.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = updateCustomerSchema.parse(req.body);

    const customer = await CustomerService.updateCustomer(
      req.params.id as string,
      user.tenantId,
      body
    );

    res.json({ customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Update customer error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

customersRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await CustomerService.deleteCustomer(req.params.id as string, user.tenantId);

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, "Delete customer error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

customersRouter.get("/:id/balance", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const balance = await CustomerService.getCustomerBalance(
      req.params.id as string,
      user.tenantId
    );

    res.json({ balance });
  } catch (error) {
    logger.error({ err: error }, "Get customer balance error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});
