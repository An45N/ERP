# Comprehensive Backend Testing Guide (Plain-English Walkthrough)

This document explains the **Comprehensive Backend Testing (Critical Priority)** pass as if you have never coded before. Every section lists the exact steps to click, run, and double-check so you can verify the ERP backend with confidence before the frontend work begins.

---

## Testing Sequence (Do These in Order)

1. **Step 0 – Prepare Tools & Accounts** (install extensions, run server, seed, login)
2. **Step 1 – Verify Shared Variables** (token/company already set, just confirm)
3. **Step 2 – Baseline Data Preparation** (chart of accounts, fiscal periods, customers, suppliers, tax rates)
4. **Step 3 – Accounts Receivable Flow** (invoices + payments)
5. **Step 4 – Accounts Payable Flow** (bills + payments)
6. **Step 5 – Bank Reconciliation Flow** (import + match)
7. **Step 6 – Tax & VAT Compliance Flow** (rates, transactions, reports)
8. **Step 7 – Financial Reports Review** (TB, BS, P&L, GL)
9. **Step 8 – Multi-Tenant Isolation Test**
10. **Step 9 – Negative & Edge Case Scenarios**
11. **Step 10 – Final Acceptance Checklist**

Complete each step before moving on. Now follow the detailed instructions below.

---

## Step 0 – Prepare Tools & Accounts

1. **Code Editor:** Visual Studio Code (VS Code) with the “REST Client” extension installed. This lets you click “Send Request” inside every `.http` file.
2. **Terminal:** Use the built-in VS Code terminal or Windows PowerShell.
3. **Backend Server:**
   - Open a terminal.
   - Run `cd d:\01.Dev\ERP\backend`.
   - Run `npm install` once (if you have never done it).
   - Run `npm run dev` and leave this terminal open. You should see a log message such as `ERP backend listening on port 4000`.
4. **Database:** Already configured through Prisma migrations. No extra action unless the server shows errors.
5. **Seed the database (FIRST TIME ONLY):**
   - Open a NEW terminal (keep the server running in the first one).
   - Run `cd d:\01.Dev\ERP\backend`.
   - Run `npm run seed`.
   - This creates:
     - A tenant with code "DEFAULT"
     - A company with code "MAIN"
     - An admin user: `admin@erp.local` / `Admin123!`
   - You should see success messages with IDs printed.
7. **Get your JWT token:**
   - Open `test-auth.http` in VS Code.
   - Find the "Step 2: Login" section.
   - Click "Send Request" above the POST line.
   - The request looks like this:
     ```http
     POST http://localhost:4000/api/auth/login
     Content-Type: application/json

     {
       "tenantCode": "DEFAULT",
       "email": "admin@erp.local",
       "password": "Admin123!"
     }
     ```
   - Copy the value inside the `token` field from the response (a long string starting with `eyJ...`).
   - At the top of every `.http` file you will see `@token = YOUR_TOKEN_HERE`. Replace `YOUR_TOKEN_HERE` with the actual token (no quotes).
   - Now every request automatically includes your authentication token.

---

## Step 1 – Verify Variables Are Set

At the top of each `.http` file you will see variables that are already filled in:

```
@baseUrl = http://localhost:4000/api
@token = eyJhbGciOi... (your JWT token)
@companyId = c5f61904-b52b-4e97-a1a7-1164cd5556d2
@customerId = leave blank for now, we will copy IDs as we create data
```

✅ **The token and company ID are already set!** You're ready to start testing.

**Note:** As you create records (customers, suppliers, invoices, etc.), the API will return IDs. Copy these IDs into the variables at the top of each file so later requests can reference them easily. For example:
- After creating a customer, copy the `id` and paste it as `@customerId = the-id-here`
- After creating an invoice, copy the `id` and paste it as `@invoiceId = the-id-here`

---

## Step 2 – Baseline Data Preparation (do this once)

1. **Confirm Chart of Accounts**
   - Open `test-reports.http`.
   - Run the GET `/api/accounts?companyId=...` request.
   - Make sure you see accounts for “Cash”, “Accounts Receivable”, “Accounts Payable”, “Revenue”, “Expense”, and “Tax Payable”.
   - If something is missing, use the POST `/api/accounts` request in the same file to create it (fill in the JSON form and click “Send Request”).

2. **Ensure Fiscal Period is Open**
   - Still in `test-reports.http`, run GET `/api/fiscal-periods?companyId=...`.
   - Look for the month you will test (for example January 2026) and confirm its `status` is `OPEN`.
   - If it’s missing, use POST `/api/fiscal-periods` to create it (start date, end date, label, etc.).

3. **Create Customers and Suppliers**
   - Open `test-ar.http` and run the “Create Customer” request. Copy the `id` from the response into `@customerId`.
   - Open `test-ap.http` and run the “Create Supplier” request. Copy the `id` into `@supplierId`.

4. **Create Tax Rates**
   - Open `test-tax.http`.
   - Run the “Create VAT Tax Rate (15%)” request.
   - Run the “Create Zero-Rated VAT” request.
   - (Optional) Create withholding tax or other rates if needed.
   - Copy each created `id` if you want to reference a specific tax rate later.

---

## Step 3 – Accounts Receivable Flow (Invoices & Customers)

### Step-by-step using `test-ar.http`

1. **Create an invoice:**
   - Scroll to “Create Invoice”.
   - Ensure the `companyId`, `customerId`, tax rates, and amounts are correct.
   - Click “Send Request”. Copy the returned `id` (`@invoiceId`) and `invoiceNumber`.

2. **Send the invoice to the customer (simulated):**
   - Run “Send Invoice”. You should receive `{ "success": true }`.

3. **Post the invoice to the General Ledger (GL):**
   - Run “Post Invoice to GL”. Response should include a `journalEntry` with `entryNumber`. This proves the GL entry exists.

4. **Record payments:**
   - Run the “Record Payment on Invoice” section.
   - Start with a partial payment (change `amount` to a part of the total), then send.
   - Run again with the remaining amount to fully pay the invoice.
   - Each response updates `paidAmount` and `status` (eventually `PAID`).

5. **Check balances and AR aging:**
   - Run “Get Customer Balance”. Verify the `openBalance` equals 0 after full payment.
   - Run “AR Aging Report”. Confirm that the invoice no longer appears in overdue buckets.

6. **If something looks wrong:**
   - Re-run GET `/api/invoices/:id` to inspect the invoice status and line totals.
   - Check `/api/reports/general-ledger` for the AR and revenue accounts to confirm the postings.

---

## Step 4 – Accounts Payable Flow (Bills & Suppliers)

### Step-by-step using `test-ap.http`

1. **Create a bill:**
   - Fill in supplier ID, line items, and tax details.
   - Send the “Create Bill” request. Copy `@billId`.

2. **Approve the bill:**
   - Run “Approve Bill”. Now the bill can be posted and paid.

3. **Post the bill to the GL:**
   - Run “Post Bill to General Ledger”. Confirm response includes `journalEntry`.

4. **Record bill payments:**
   - Use “Record Payment on Bill” requests. Try a partial payment first, then a final payment.
   - Watch the `status` change (DRAFT → APPROVED → PARTIAL → PAID).

5. **Review AP aging and supplier statement:**
   - Run “AP Aging Report”. Confirm outstanding amounts match what you expect.
   - Run “Supplier Statement” to see the timeline of bills and payments for the supplier.

6. **Verification tips:**
   - GET `/api/bills/:id` to verify `paidAmount`.
   - Check the GL report for the AP and expense accounts.

---

## Step 5 – Bank Reconciliation Flow

### Step-by-step using `test-bank.http`

1. **Create a bank account:**
   - Run “Create Bank Account”. Use your Cash GL account ID.
   - Copy the `bankAccountId` from the response.

2. **Import a bank statement:**
   - In “Import Bank Statement”, set `bankAccountId` and a unique `importBatch` name (e.g., `STMT-2026-01`).
   - Send the request. The response tells you how many transactions were imported.

3. **Start a reconciliation:**
   - Run “Start New Reconciliation” for the statement period and balance.
   - Copy the `reconciliationId`.

4. **Match transactions:**
   - Run “List Unreconciled Transactions” to see items. Note their IDs.
   - For each item, run “Suggest Matches” to see recommended journal entries.
   - Use “Match Bank Transaction to Journal Entry” (or the manual version without a journal entry) for each transaction you can identify.

5. **Unmatch if needed:**
   - Use “Unmatch Bank Transaction” to undo a mistake.

6. **Complete reconciliation:**
   - When all transactions are matched and the difference is 0, run “Complete Reconciliation”.
   - The response should confirm success, and the bank account now stores the `lastReconciledBalance`.

---

## Step 6 – Tax & VAT Compliance Flow

### Step-by-step using `test-tax.http`

1. **Confirm tax rates exist:** run GET `/api/tax/rates?companyId=...`. You should see the VAT rates you created.
2. **Check tax transactions:** run GET `/api/tax/transactions?companyId=...`. You will see entries generated automatically when invoices and bills were created earlier.
3. **Generate VAT reports:**
   - Run “Get VAT Return Summary” for the testing month. Review the numbers (Boxes 1–13).
   - Run “Get VAT Breakdown by Rate” to confirm the 15% and 0% buckets.
   - Run “Get Current VAT Liability” to know whether you owe or get a refund.
   - Run “Generate MRA VAT Return” to view the exact payload you would submit to Mauritius Revenue Authority.

4. **Audit trail and reversal:**
   - Run “Get VAT Audit Trail” to review every tax transaction.
   - Pick one `taxTransactionId` and run “Reverse Tax Transaction”. Run the audit trail again to see the change.

---

## Step 7 – Financial Reports (Overall Health Check)

### Step-by-step using `test-reports.http`

1. **Trial Balance:** run GET `/api/reports/trial-balance`. Confirm total debits equal total credits; look for AR/AP balances you expect.
2. **Income Statement:** run GET `/api/reports/income-statement`. Confirm revenue from invoices and expenses from bills appear in the correct period.
3. **Balance Sheet:** run GET `/api/reports/balance-sheet`. Ensure Cash, AR, AP, and retained earnings reflect your transactions.
4. **General Ledger:** run GET `/api/reports/general-ledger?accountId=...` for key accounts (Cash, AR, AP, VAT). Verify each journal entry you posted earlier shows up.

---

## Step 8 – Multi-Tenant Isolation Test

1. Create a second company (if you do not already have one) using `/api/companies`.
2. Update the variables in the `.http` files with the second company’s `companyId`.
3. Repeat a mini-version of the AR/AP/bank flow (create one invoice, one bill, one bank statement).
4. Confirm that when you run GET requests with `companyId` of company A, you never see data from company B—and vice versa. If you try to fetch another company’s invoice by ID, you should get `404`.

---

## Step 9 – Negative & Edge Case Scenarios

1. **Duplicate entries:** try to create a customer or tax rate using an existing code. Expect a `400 Bad Request` with a validation message.
2. **Wrong workflow order:** attempt to post a bill before approving it, or delete a supplier that still has bills. The API should reject the action with an error.
3. **Unauthorized access:** remove the `Authorization` header (or set an invalid token) in one request; it must respond with `401 Unauthorized`.
4. **Bank reconciliation errors:** attempt to complete a reconciliation while there are unreconciled transactions or a non-zero difference; the API must block it.

Document every error message you see so you know the validations are protecting the data.

---

## Step 10 – Final Acceptance Checklist

Tick each item only when you have proof (screenshot or saved response).

- [ ] Customers and suppliers created successfully.
- [ ] Invoices created, sent, posted to GL, and fully paid; AR aging empty afterward.
- [ ] Bills created, approved, posted, and paid; AP aging reflects balances correctly.
- [ ] Bank statement imported, matched, and reconciliation completed with zero difference.
- [ ] VAT return generated; numbers match manual calculations; MRA payload reviewed.
- [ ] Trial Balance, Income Statement, Balance Sheet all reflect the same figures.
- [ ] Second company isolated (no cross-tenant data leaks).
- [ ] Negative tests confirmed validations (duplicate codes, missing auth, wrong workflow order).
- [ ] Server logs (`npm run dev` window) show no unexpected errors while testing.

Once every box is checked, the backend is thoroughly tested and ready for frontend integration, demo preparation, or production deployment.
