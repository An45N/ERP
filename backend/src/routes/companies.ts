import { Router } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

export const companiesRouter = Router();

companiesRouter.get("/", async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const companies = await prisma.company.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        currency: true,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(companies);
  } catch (error) {
    logger.error("Failed to fetch companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

companiesRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user?.tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const company = await prisma.company.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        legalName: true,
        taxId: true,
        currency: true,
        address: true,
        city: true,
        country: true,
        phone: true,
        email: true,
        fiscalYearStart: true,
        isActive: true,
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Convert fiscalYearStart from month number to MM-DD format
    const fiscalYearStartFormatted = company.fiscalYearStart.toString().padStart(2, '0') + '-01';

    res.json({
      ...company,
      fiscalYearStart: fiscalYearStartFormatted,
    });
  } catch (error) {
    logger.error("Failed to fetch company:", error);
    res.status(500).json({ error: "Failed to fetch company" });
  }
});

companiesRouter.post("/", async (req, res) => {
  try {
    const user = (req as any).user;
    const { code, name, legalName, taxId, currency, address, city, country, phone, email, fiscalYearStart } = req.body;

    if (!user?.tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!code || !name) {
      return res.status(400).json({ error: "Code and name are required" });
    }

    const company = await prisma.company.create({
      data: {
        tenantId: user.tenantId,
        code,
        name,
        legalName,
        taxId,
        currency: currency || "MUR",
        address,
        city,
        country: country || "MU",
        phone,
        email,
        fiscalYearStart: fiscalYearStart || 1,
      },
    });

    res.status(201).json(company);
  } catch (error) {
    logger.error("Failed to create company:", error);
    res.status(500).json({ error: "Failed to create company" });
  }
});

companiesRouter.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { name, legalName, taxId, currency, address, city, country, phone, email, fiscalYearStart } = req.body;

    if (!user?.tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existingCompany = await prisma.company.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!existingCompany) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Convert fiscalYearStart from MM-DD format to month number
    let fiscalYearStartMonth = existingCompany.fiscalYearStart;
    if (fiscalYearStart && typeof fiscalYearStart === 'string') {
      const parts = fiscalYearStart.split('-');
      if (parts.length > 0 && parts[0]) {
        fiscalYearStartMonth = parseInt(parts[0], 10);
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        legalName,
        taxId,
        currency,
        address,
        city,
        country,
        phone,
        email,
        fiscalYearStart: fiscalYearStartMonth,
      },
    });

    // Convert back to MM-DD format for response
    const fiscalYearStartFormatted = company.fiscalYearStart.toString().padStart(2, '0') + '-01';

    res.json({
      ...company,
      fiscalYearStart: fiscalYearStartFormatted,
    });
  } catch (error) {
    logger.error("Failed to update company:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
});
