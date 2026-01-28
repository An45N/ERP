import { Router } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", async (req, res) => {
  try {
    const user = (req as any).user;
    const { companyId, startDate, endDate } = req.query;

    if (!user?.tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get total customers
    const totalCustomers = await prisma.customer.count({
      where: {
        tenantId: user.tenantId,
        companyId: companyId as string,
        isActive: true,
      },
    });

    // Get total suppliers
    const totalSuppliers = await prisma.supplier.count({
      where: {
        tenantId: user.tenantId,
        companyId: companyId as string,
        isActive: true,
      },
    });

    // Get invoice stats
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: user.tenantId,
        companyId: companyId as string,
        invoiceDate: {
          gte: start,
          lte: end,
        },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
        status: true,
        dueDate: true,
      },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const invoiceCount = invoices.length;
    const outstandingInvoices = invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED').length;
    const overdueInvoices = invoices.filter(inv => 
      inv.status !== 'PAID' && 
      inv.status !== 'CANCELLED' && 
      new Date(inv.dueDate) < new Date()
    ).length;

    // Get bill stats
    const bills = await prisma.bill.findMany({
      where: {
        tenantId: user.tenantId,
        companyId: companyId as string,
        billDate: {
          gte: start,
          lte: end,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    const totalExpenses = bills.reduce((sum, bill) => sum + Number(bill.totalAmount), 0);
    const netIncome = totalRevenue - totalExpenses;

    res.json({
      totalRevenue,
      totalExpenses,
      netIncome,
      invoiceCount,
      outstandingInvoices,
      overdueInvoices,
      totalCustomers,
      totalSuppliers,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch dashboard stats");
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

dashboardRouter.get("/recent-transactions", async (req, res) => {
  try {
    const user = (req as any).user;
    const { companyId, limit = 10 } = req.query;

    if (!user?.tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const [invoices, bills] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          tenantId: user.tenantId,
          companyId: companyId as string,
        },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          totalAmount: true,
          status: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          invoiceDate: 'desc',
        },
        take: Number(limit),
      }),
      prisma.bill.findMany({
        where: {
          tenantId: user.tenantId,
          companyId: companyId as string,
        },
        select: {
          id: true,
          billNumber: true,
          billDate: true,
          totalAmount: true,
          status: true,
          supplier: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          billDate: 'desc',
        },
        take: Number(limit),
      }),
    ]);

    const transactions = [
      ...invoices.map(inv => ({
        id: inv.id,
        type: 'invoice' as const,
        reference: inv.invoiceNumber,
        description: `Invoice to ${inv.customer.name}`,
        amount: Number(inv.totalAmount),
        date: inv.invoiceDate.toISOString(),
        status: inv.status,
      })),
      ...bills.map(bill => ({
        id: bill.id,
        type: 'bill' as const,
        reference: bill.billNumber,
        description: `Bill from ${bill.supplier.name}`,
        amount: Number(bill.totalAmount),
        date: bill.billDate.toISOString(),
        status: bill.status,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, Number(limit));

    res.json({ transactions });
  } catch (error) {
    logger.error("Failed to fetch recent transactions:", error);
    res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
});

dashboardRouter.get("/chart-data", async (req, res) => {
  try {
    const user = (req as any).user;
    const { companyId } = req.query;

    if (!user?.tenantId || !companyId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    res.json({ chartData: [] });
  } catch (error) {
    logger.error("Failed to fetch chart data:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

dashboardRouter.get("/top-customers", async (req, res) => {
  try {
    const user = (req as any).user;
    const { companyId } = req.query;

    if (!user?.tenantId || !companyId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    res.json({ customers: [] });
  } catch (error) {
    logger.error("Failed to fetch top customers:", error);
    res.status(500).json({ error: "Failed to fetch top customers" });
  }
});

dashboardRouter.get("/top-suppliers", async (req, res) => {
  try {
    const user = (req as any).user;
    const { companyId } = req.query;

    if (!user?.tenantId || !companyId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    res.json({ suppliers: [] });
  } catch (error) {
    logger.error("Failed to fetch top suppliers:", error);
    res.status(500).json({ error: "Failed to fetch top suppliers" });
  }
});

dashboardRouter.get("/cash-flow", async (req, res) => {
  try {
    const user = (req as any).user;
    const { companyId } = req.query;

    if (!user?.tenantId || !companyId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    res.json({ inflow: 0, outflow: 0, net: 0 });
  } catch (error) {
    logger.error("Failed to fetch cash flow:", error);
    res.status(500).json({ error: "Failed to fetch cash flow" });
  }
});
