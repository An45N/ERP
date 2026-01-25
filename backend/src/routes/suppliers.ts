import { Router, Request, Response } from "express";
import { z } from "zod";
import { SupplierService } from "../lib/ap/supplier";
import { logger } from "../lib/logger";

export const suppliersRouter = Router();

const createSupplierSchema = z.object({
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
  currency: z.string().length(3).optional(),
  notes: z.string().max(1000).optional(),
});

const updateSupplierSchema = z.object({
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
  currency: z.string().length(3).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

suppliersRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = createSupplierSchema.parse(req.body);

    const supplier = await SupplierService.createSupplier({
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
      currency: body.currency,
      notes: body.notes,
    });

    res.status(201).json({ supplier });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Create supplier error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

suppliersRouter.get("/", async (req: Request, res: Response): Promise<void> => {
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

    const suppliers = await SupplierService.getSuppliers(
      user.tenantId,
      companyId as string,
      filters
    );

    res.json({ suppliers });
  } catch (error) {
    logger.error({ err: error }, "Get suppliers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

suppliersRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const supplier = await SupplierService.getSupplierById(
      req.params.id as string,
      user.tenantId
    );

    res.json({ supplier });
  } catch (error) {
    logger.error({ err: error }, "Get supplier error");
    res.status(404).json({ 
      error: error instanceof Error ? error.message : "Supplier not found" 
    });
  }
});

suppliersRouter.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = updateSupplierSchema.parse(req.body);

    const supplier = await SupplierService.updateSupplier(
      req.params.id as string,
      user.tenantId,
      body
    );

    res.json({ supplier });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Update supplier error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

suppliersRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await SupplierService.deleteSupplier(req.params.id as string, user.tenantId);

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, "Delete supplier error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});

suppliersRouter.get("/:id/balance", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const balance = await SupplierService.getSupplierBalance(
      req.params.id as string,
      user.tenantId
    );

    res.json({ balance });
  } catch (error) {
    logger.error({ err: error }, "Get supplier balance error");
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    });
  }
});
