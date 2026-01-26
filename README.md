# ERP Platform (Type SAP) – Implementation

Enterprise Resource Planning system for small Mauritian company, built with modern stack targeting business-standard capabilities at lower cost than SAP.

## Architecture Overview

| Layer | Stack | Notes |
| --- | --- | --- |
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS | Responsive UI, React Router, Zustand state management |
| Backend | Node.js + Express + TypeScript | REST APIs, modular architecture |
| Data Access | Prisma ORM | SQL Server provider, type-safe queries |
| Database | SQL Server 2019+ | Cloud VPS hosted |
| AuthN/AuthZ | JWT + bcrypt | Multi-tenant authentication, protected routes |
| Logging | Pino | Structured logs, pretty-print in dev |

## Repository Structure

```
├─ backend/
│  ├─ src/
│  │  ├─ config/         # Environment config, validation
│  │  ├─ lib/            # Logger, utilities
│  │  ├─ routes/         # API route handlers
│  │  ├─ generated/      # Prisma client (gitignored)
│  │  └─ server.ts       # Express app entry
│  ├─ prisma/
│  │  └─ schema.prisma   # Database schema
│  ├─ package.json
│  └─ tsconfig.json
├─ frontend/
│  ├─ src/
│  │  ├─ components/     # Reusable UI components
│  │  │  ├─ ui/         # Base components (Button, Input, Card)
│  │  │  └─ layout/     # Layout components (DashboardLayout)
│  │  ├─ pages/         # Page components (Login, Dashboard, Accounts)
│  │  ├─ store/         # Zustand state management (authStore)
│  │  ├─ lib/           # Utilities (api, utils)
│  │  ├─ types/         # TypeScript type definitions
│  │  ├─ App.tsx        # Main app with routing
│  │  ├─ main.tsx       # React entry
│  │  └─ index.css      # Global styles with Tailwind
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ tailwind.config.js
│  ├─ package.json
│  └─ tsconfig.json
├─ cahier_des_charges_erp_type_sap.md  # Full requirements spec
└─ README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- SQL Server 2019+ instance (local or cloud VPS)
- Git

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL:
# DATABASE_URL="sqlserver://username:password@host:port?database=ERP&encrypt=true&trustServerCertificate=true"

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npx prisma migrate deploy

# Seed the database with initial data (tenant, company, admin user, chart of accounts)
npm run seed

# Run development server
npm run dev
```

Backend will start on **http://localhost:4000**

**Default Admin Credentials:**
- Tenant Code: `DEFAULT`
- Email: `admin@erp.local`
- Password: `Admin123!`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (already done)
npm install

# Run development server
npm run dev
```

Frontend will start on **http://localhost:3000** (or 3001 if 3000 is in use) with API proxy to backend.

### 3. Database Schema

The Prisma schema includes comprehensive ERP modules:

**Core Entities:**
- **Tenant**: Multi-tenancy support
- **Company**: Legal entities per tenant
- **User**: Authentication and user management
- **FiscalPeriod**: Accounting periods (monthly, quarterly, yearly)

**Accounting:**
- **Account**: Chart of accounts (GL accounts)
- **JournalEntry** & **JournalLine**: Double-entry bookkeeping
- **Customer** & **Supplier**: AR/AP master data
- **Invoice** & **InvoiceLine**: Sales invoicing
- **InvoicePayment**: Payment tracking
- **Bill** & **BillLine**: Purchase bills
- **BillPayment**: Bill payment tracking

**Banking:**
- **BankAccount**: Bank account master data
- **BankTransaction**: Bank transactions
- **BankReconciliation** & **ReconciliationItem**: Bank reconciliation

**Tax Management:**
- **TaxRate**: VAT and other tax rates
- **TaxTransaction**: Tax transaction tracking

## Available Scripts

### Backend
- `npm run dev` - Start dev server with hot reload (tsx)
- `npm run build` - Compile TypeScript to dist/
- `npm start` - Run production build
- `npm run seed` - Seed database with initial data
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Deploy migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Current Status

✅ **Completed:**

**Backend:**
- Multi-tenant architecture with Prisma ORM
- Complete database schema (Accounting, AR, AP, Banking, Tax)
- JWT authentication with bcrypt password hashing
- RESTful APIs for all modules:
  - Authentication (login, register, token management)
  - Chart of Accounts (CRUD, search, filtering)
  - Journal Entries (double-entry bookkeeping, posting, reversing)
  - Fiscal Periods (initialization, management)
  - Accounts Receivable (invoices, payments, aging reports)
  - Accounts Payable (bills, payments, supplier management)
  - Bank Reconciliation (accounts, transactions, matching)
  - Tax Management (VAT rates, tax reporting)
  - Financial Reports (General Ledger, Trial Balance, P&L, Balance Sheet)
- Database seeding script with default data
- Comprehensive test suite (`.http` files for all endpoints)
- Structured logging with Pino
- CORS and security middleware

**Frontend:**
- React 19 + TypeScript + Vite
- Modern UI with Tailwind CSS v4
- Authentication flow (login, protected routes, logout)
- Responsive dashboard layout with sidebar navigation
- Dashboard with financial stats and quick actions
- Chart of Accounts page with search and filtering
- Zustand state management
- Axios API client with JWT interceptors
- Reusable UI components (Button, Input, Card, etc.)

🚧 **Next Steps:**
1. Complete remaining frontend pages:
   - Journal Entries management
   - Customer/Supplier CRUD
   - Invoice creation and management
   - Bill creation and management
   - Financial reports visualization
   - Bank reconciliation interface
   - Tax management interface
2. Add form validation and error handling
3. Implement data tables with pagination and sorting
4. Add export functionality (PDF, Excel)
5. Implement role-based access control (RBAC)
6. Add audit logging
7. Performance optimization and caching
8. Production deployment setup

## Testing

### Backend API Testing

The backend includes comprehensive HTTP test files for all endpoints. Use the REST Client extension in VS Code to run these tests.

**Test Files:**
- `test-auth.http` - Authentication endpoints
- `test-accounts.http` - Chart of accounts
- `test-journal-entries.http` - Journal entries and fiscal periods
- `test-ar.http` - Accounts receivable (invoices, customers)
- `test-ap.http` - Accounts payable (bills, suppliers)
- `test-bank.http` - Bank accounts and reconciliation
- `test-tax.http` - Tax rates and VAT reports
- `test-reports.http` - Financial reports

**Testing Guide:**

See `backend/TESTING_GUIDE.md` for step-by-step instructions on testing all API endpoints.

**Quick Start:**
1. Ensure backend is running (`npm run dev`)
2. Run the seed script (`npm run seed`)
3. Open any `.http` file in VS Code
4. Click "Send Request" above each HTTP request
5. Variables are already populated with correct IDs

### Frontend Testing

1. Start the backend server: `cd backend && npm run dev`
2. Start the frontend server: `cd frontend && npm run dev`
3. Open http://localhost:3000 (or 3001) in your browser
4. Login with default credentials (see above)
5. Navigate through Dashboard and Chart of Accounts

## Development Guidelines

- Follow the cahier des charges for feature requirements
- Maintain strict TypeScript typing
- Use Prisma for all database operations
- Log important operations with Pino
- Keep frontend/backend separation clean
- Test locally before committing
- All API endpoints must be tested with `.http` files

## Cost Estimate

For small Mauritian company (80-150 users):
- **Development**: ~54-75M MUR over 12-15 months
- **Annual OPEX**: ~6-8M MUR (cloud + support)
- **Target**: Stay below SAP equivalent costs

See `cahier_des_charges_erp_type_sap.md` for full specifications and module roadmap.
