import express from "express";
import cors from "cors";

import { env } from "./config/env";
import { logger } from "./lib/logger";
import "./lib/prisma";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { accountsRouter } from "./routes/accounts";
import { journalEntriesRouter } from "./routes/journal-entries";
import { fiscalPeriodsRouter } from "./routes/fiscal-periods";
import { reportsRouter } from "./routes/reports";
import { customersRouter } from "./routes/customers";
import { invoicesRouter } from "./routes/invoices";
import { suppliersRouter } from "./routes/suppliers";
import { billsRouter } from "./routes/bills";
import { bankRouter } from "./routes/bank";
import { taxRouter } from "./routes/tax";
import { authenticate } from "./middleware/auth";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    name: "ERP Backend API - Multi-Client Accounting SaaS",
    version: "0.1.0",
    status: "running",
    endpoints: {
      health: "GET /api/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me"
      },
      accounting: {
        accounts: {
          list: "GET /api/accounts?companyId={id}",
          create: "POST /api/accounts",
          get: "GET /api/accounts/:id",
          update: "PATCH /api/accounts/:id",
          delete: "DELETE /api/accounts/:id",
          initialize: "POST /api/accounts/initialize"
        },
        journalEntries: {
          list: "GET /api/journal-entries?companyId={id}",
          create: "POST /api/journal-entries",
          get: "GET /api/journal-entries/:id",
          update: "PATCH /api/journal-entries/:id",
          delete: "DELETE /api/journal-entries/:id",
          post: "POST /api/journal-entries/:id/post",
          reverse: "POST /api/journal-entries/:id/reverse"
        },
        fiscalPeriods: {
          list: "GET /api/fiscal-periods?companyId={id}",
          create: "POST /api/fiscal-periods",
          get: "GET /api/fiscal-periods/:id",
          close: "POST /api/fiscal-periods/:id/close",
          reopen: "POST /api/fiscal-periods/:id/reopen",
          initialize: "POST /api/fiscal-periods/initialize"
        },
        reports: {
          generalLedger: "GET /api/reports/general-ledger?companyId={id}",
          trialBalance: "GET /api/reports/trial-balance?companyId={id}",
          balanceSheet: "GET /api/reports/balance-sheet?companyId={id}",
          incomeStatement: "GET /api/reports/income-statement?companyId={id}",
          accountActivity: "GET /api/reports/account-activity?companyId={id}&accountId={id}"
        }
      },
      ar: {
        customers: {
          list: "GET /api/customers?companyId={id}",
          create: "POST /api/customers",
          get: "GET /api/customers/:id",
          update: "PATCH /api/customers/:id",
          delete: "DELETE /api/customers/:id",
          balance: "GET /api/customers/:id/balance"
        },
        invoices: {
          list: "GET /api/invoices?companyId={id}",
          create: "POST /api/invoices",
          get: "GET /api/invoices/:id",
          update: "PATCH /api/invoices/:id",
          delete: "DELETE /api/invoices/:id",
          send: "POST /api/invoices/:id/send",
          postToGL: "POST /api/invoices/:id/post-to-gl",
          recordPayment: "POST /api/invoices/:id/payments",
          arAging: "GET /api/invoices/reports/ar-aging?companyId={id}",
          customerStatement: "GET /api/invoices/reports/customer-statement?companyId={id}&customerId={id}"
        }
      },
      ap: {
        suppliers: {
          list: "GET /api/suppliers?companyId={id}",
          create: "POST /api/suppliers",
          get: "GET /api/suppliers/:id",
          update: "PATCH /api/suppliers/:id",
          delete: "DELETE /api/suppliers/:id",
          balance: "GET /api/suppliers/:id/balance"
        },
        bills: {
          list: "GET /api/bills?companyId={id}",
          create: "POST /api/bills",
          get: "GET /api/bills/:id",
          update: "PATCH /api/bills/:id",
          delete: "DELETE /api/bills/:id",
          approve: "POST /api/bills/:id/approve",
          postToGL: "POST /api/bills/:id/post-to-gl",
          recordPayment: "POST /api/bills/:id/payments",
          apAging: "GET /api/bills/reports/ap-aging?companyId={id}",
          supplierStatement: "GET /api/bills/reports/supplier-statement?companyId={id}&supplierId={id}"
        }
      },
      bank: {
        accounts: {
          list: "GET /api/bank/accounts?companyId={id}",
          create: "POST /api/bank/accounts",
          get: "GET /api/bank/accounts/:id",
          update: "PATCH /api/bank/accounts/:id",
          delete: "DELETE /api/bank/accounts/:id"
        },
        transactions: {
          list: "GET /api/bank/transactions?companyId={id}&bankAccountId={id}",
          import: "POST /api/bank/statements/import",
          suggestMatches: "GET /api/bank/transactions/:id/suggest-matches?companyId={id}&bankAccountId={id}",
          unmatch: "POST /api/bank/transactions/:id/unmatch"
        },
        reconciliations: {
          list: "GET /api/bank/reconciliations?companyId={id}",
          create: "POST /api/bank/reconciliations",
          get: "GET /api/bank/reconciliations/:id",
          match: "POST /api/bank/reconciliations/:id/match",
          complete: "POST /api/bank/reconciliations/:id/complete"
        }
      },
      tax: {
        rates: {
          list: "GET /api/tax/rates?companyId={id}",
          create: "POST /api/tax/rates",
          get: "GET /api/tax/rates/:id",
          update: "PATCH /api/tax/rates/:id",
          delete: "DELETE /api/tax/rates/:id"
        },
        transactions: {
          list: "GET /api/tax/transactions?companyId={id}",
          reverse: "POST /api/tax/transactions/:id/reverse"
        },
        vat: {
          return: "GET /api/tax/vat/return?companyId={id}&startDate={date}&endDate={date}",
          transactions: "GET /api/tax/vat/transactions?companyId={id}&startDate={date}&endDate={date}",
          byRate: "GET /api/tax/vat/by-rate?companyId={id}&startDate={date}&endDate={date}",
          liability: "GET /api/tax/vat/liability?companyId={id}",
          mraReturn: "GET /api/tax/vat/mra-return?companyId={id}&startDate={date}&endDate={date}",
          auditTrail: "GET /api/tax/vat/audit-trail?companyId={id}&startDate={date}&endDate={date}"
        }
      }
    },
    documentation: "See test-*.http files for API examples"
  });
});

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/accounts", authenticate, accountsRouter);
app.use("/api/journal-entries", authenticate, journalEntriesRouter);
app.use("/api/fiscal-periods", authenticate, fiscalPeriodsRouter);
app.use("/api/reports", authenticate, reportsRouter);
app.use("/api/customers", authenticate, customersRouter);
app.use("/api/invoices", authenticate, invoicesRouter);
app.use("/api/suppliers", authenticate, suppliersRouter);
app.use("/api/bills", authenticate, billsRouter);
app.use("/api/bank", authenticate, bankRouter);
app.use("/api/tax", authenticate, taxRouter);

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 ERP backend listening on port ${env.PORT}`);
});

const gracefulShutdown = () => {
  logger.info("Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
