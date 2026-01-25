# Quick Start Guide - Backend Testing

## Step 1: Start the Backend Server

```bash
cd d:\01.Dev\ERP\backend
npm install
npm run dev
```

Keep this terminal open. You should see: `🚀 ERP backend listening on port 4000`

---

## Step 2: Seed the Database (First Time Only)

Open a **NEW** terminal:

```bash
cd d:\01.Dev\ERP\backend
npm run seed
```

This creates:
- ✅ Tenant: `DEFAULT`
- ✅ Company: `MAIN` 
- ✅ Admin User: `admin@erp.local` / `Admin123!`

---

## Step 3: Get Your Login Token

1. Open `test-auth.http` in VS Code
2. Find "Step 2: Login" 
3. Click **"Send Request"** above the POST line
4. Copy the `token` value from the response (starts with `eyJ...`)
5. Paste it at the top of each `.http` file where it says `@token = YOUR_TOKEN_HERE`

---

## Step 4: Get Your Company ID

1. Open `test-reports.http`
2. Update `@token` with your token from Step 3
3. Find the request: `GET {{baseUrl}}/companies` (you may need to add this)
4. Or check the seed output - it printed the Company ID
5. Copy the company ID and paste it in all `.http` files: `@companyId = your-id-here`

---

## Step 5: Run the Tests

Follow the **TESTING_GUIDE.md** in order:

1. **Baseline Data** - Create accounts, customers, suppliers, tax rates
2. **AR Flow** - Create invoices, post to GL, record payments
3. **AP Flow** - Create bills, approve, post, pay
4. **Bank Reconciliation** - Import statements, match transactions
5. **VAT Reports** - Generate returns, check MRA format
6. **Financial Reports** - Trial balance, P&L, Balance Sheet
7. **Multi-tenant** - Test data isolation
8. **Negative Tests** - Verify error handling

---

## Common Issues

**"Tenant not found"** → Run `npm run seed` first

**"Cannot GET /api/auth/login"** → Don't use browser, use REST Client in VS Code

**"Unauthorized"** → Update your `@token` variable (tokens expire after 7 days)

**"Company not found"** → Update your `@companyId` variable

---

## Full Documentation

- **TESTING_GUIDE.md** - Complete step-by-step testing instructions
- **SAAS_ROADMAP.md** - Project roadmap and progress
- **test-*.http** - All API test requests

---

## Need Help?

1. Check server logs in the terminal running `npm run dev`
2. Verify database connection in `.env` file
3. Ensure all migrations ran: `npx prisma migrate deploy`
