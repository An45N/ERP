# ERP Platform (Type SAP) – Implementation

Enterprise Resource Planning system for small Mauritian company, built with modern stack targeting business-standard capabilities at lower cost than SAP.

## Architecture Overview

| Layer | Stack | Notes |
| --- | --- | --- |
| Frontend | React 19 + Vite + TypeScript | Responsive UI, API integration via fetch |
| Backend | Node.js + Express + TypeScript | REST APIs, modular architecture |
| Data Access | Prisma ORM | SQL Server provider, type-safe queries |
| Database | SQL Server 2019+ | Cloud VPS hosted |
| AuthN/AuthZ | JWT + RBAC (planned) | SoD-ready, SSO integration later |
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
│  │  ├─ App.tsx         # Main component
│  │  ├─ main.tsx        # React entry
│  │  └─ index.css       # Global styles
│  ├─ index.html
│  ├─ vite.config.ts
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

# Install dependencies (already done)
npm install

# Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL:
# DATABASE_URL="sqlserver://username:password@host:port?database=ERP"

# Generate Prisma client
npm run prisma:generate

# Create database migration (when DB is ready)
npx prisma migrate dev --name init

# Run development server
npm run dev
```

Backend will start on **http://localhost:4000**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (already done)
npm install

# Run development server
npm run dev
```

Frontend will start on **http://localhost:3000** with API proxy to backend.

### 3. Database Setup

The Prisma schema includes:
- **Tenant**: Multi-tenancy support
- **Company**: Legal entities per tenant
- **User**: Authentication and user management
- **Role**: RBAC roles
- **UserRole**: User-role assignments

To create the database:
```bash
cd backend
npx prisma migrate dev --name init
```

## Available Scripts

### Backend
- `npm run dev` - Start dev server with hot reload (tsx)
- `npm run build` - Compile TypeScript to dist/
- `npm start` - Run production build
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Deploy migrations

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Current Status

✅ **Completed:**
- Project scaffolding (backend + frontend)
- TypeScript configuration
- Express server with health check endpoint
- Prisma schema with core entities (Tenant, Company, User, Role)
- React frontend with backend health check
- Environment configuration with validation
- Structured logging (Pino)

🚧 **Next Steps:**
1. Set up SQL Server connection and run migrations
2. Implement authentication (JWT, bcrypt)
3. Build user management APIs (CRUD)
4. Add company/tenant management
5. Implement role-based access control
6. Build frontend authentication flow
7. Add first business module (Finance or Master Data)

## Development Guidelines

- Follow the cahier des charges for feature requirements
- Maintain strict TypeScript typing
- Use Prisma for all database operations
- Log important operations with Pino
- Keep frontend/backend separation clean
- Test locally before committing

## Cost Estimate

For small Mauritian company (80-150 users):
- **Development**: ~54-75M MUR over 12-15 months
- **Annual OPEX**: ~6-8M MUR (cloud + support)
- **Target**: Stay below SAP equivalent costs

See `cahier_des_charges_erp_type_sap.md` for full specifications and module roadmap.
