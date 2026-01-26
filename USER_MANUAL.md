# ERP System User Manual

## Welcome to Your ERP System

This comprehensive guide will help you navigate and use all features of the ERP system effectively.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Chart of Accounts](#chart-of-accounts)
4. [Journal Entries](#journal-entries)
5. [Customers](#customers)
6. [Suppliers](#suppliers)
7. [Invoices](#invoices)
8. [Bills](#bills)
9. [Reports](#reports)
10. [Settings](#settings)
11. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Logging In

1. Navigate to the login page
2. Enter your email address
3. Enter your password
4. Click "Sign In"

**First-time users:** Contact your administrator to receive your login credentials.

### Navigation

The main navigation menu is located on the left side of the screen:
- **Dashboard** - Overview of your financial data
- **Accounts** - Chart of accounts management
- **Journal Entries** - Record transactions
- **Customers** - Customer database
- **Suppliers** - Supplier database
- **Invoices** - Customer invoices
- **Bills** - Supplier bills
- **Reports** - Financial reports
- **Settings** - System configuration

---

## Dashboard

The Dashboard provides a quick overview of your business finances.

### Key Metrics

**Total Revenue**
- Sum of all income from invoices
- Updated in real-time

**Total Expenses**
- Sum of all expenses from bills
- Includes all cost categories

**Total Customers**
- Number of active customers in your database

**Outstanding Invoices**
- Number of unpaid customer invoices
- Click to view details

### Recent Activity

View the last 10 transactions:
- Transaction description
- Date
- Amount (color-coded: green for income, red for expenses)

### Quick Actions

- **New Invoice** - Create customer invoice
- **New Bill** - Record supplier bill
- **Add Customer** - Add new customer
- **View Reports** - Access financial reports

---

## Chart of Accounts

Manage your accounting structure with the Chart of Accounts.

### Account Types

1. **Assets** - What you own (Cash, Inventory, Equipment)
2. **Liabilities** - What you owe (Loans, Accounts Payable)
3. **Equity** - Owner's stake in the business
4. **Revenue** - Income from sales and services
5. **Expenses** - Costs of doing business

### Creating an Account

1. Click "New Account" button
2. Fill in the form:
   - **Account Code** - Unique identifier (e.g., 1000)
   - **Account Name** - Descriptive name (e.g., "Cash in Bank")
   - **Account Type** - Select from dropdown
   - **Description** - Optional details
3. Click "Save"

### Editing an Account

1. Find the account in the list
2. Click the "Edit" button (pencil icon)
3. Modify the details
4. Click "Save"

### Deleting an Account

1. Click the "Delete" button (trash icon)
2. Confirm the deletion
3. **Note:** Accounts with transactions cannot be deleted

### Search & Filter

- Use the search box to find accounts by code or name
- Filter by account type using the dropdown
- Sort by clicking column headers

---

## Journal Entries

Record financial transactions with journal entries.

### Creating a Journal Entry

1. Click "New Entry" button
2. Fill in the details:
   - **Date** - Transaction date
   - **Reference** - Optional reference number
   - **Description** - What the transaction is for
3. Add line items:
   - Click "Add Line"
   - Select **Account**
   - Enter **Debit** or **Credit** amount
   - Add **Description** (optional)
4. Ensure debits equal credits (balance shown at bottom)
5. Click "Save"

### Double-Entry Accounting

Every transaction must balance:
- **Total Debits = Total Credits**
- The system will warn you if unbalanced

### Example: Recording a Sale

```
Date: 2024-01-15
Description: Sale to Customer ABC

Debit:  Cash in Bank         Rs 10,000
Credit: Sales Revenue                   Rs 10,000
```

### Viewing Journal Entries

- **List View** - See all entries with date, reference, description
- **Detail View** - Click an entry to see all line items
- **Search** - Find entries by reference or description
- **Filter by Date** - Select date range

---

## Customers

Manage your customer database.

### Adding a Customer

1. Click "New Customer" button
2. Fill in the form:
   - **Name** - Customer name (required)
   - **Email** - Contact email
   - **Phone** - Contact number
   - **Address** - Physical address
   - **Tax ID** - Tax identification number
3. Click "Save"

### Customer Information

Each customer record includes:
- Contact details
- Transaction history
- Outstanding balance
- Payment history

### Editing a Customer

1. Click "Edit" button on customer row
2. Update information
3. Click "Save"

### Viewing Customer Transactions

1. Click on a customer name
2. View all invoices and payments
3. See outstanding balance

---

## Suppliers

Manage your supplier database.

### Adding a Supplier

1. Click "New Supplier" button
2. Fill in the form:
   - **Name** - Supplier name (required)
   - **Email** - Contact email
   - **Phone** - Contact number
   - **Address** - Physical address
   - **Tax ID** - Tax identification number
3. Click "Save"

### Supplier Information

Each supplier record includes:
- Contact details
- Purchase history
- Outstanding payables
- Payment terms

---

## Invoices

Create and manage customer invoices.

### Creating an Invoice

1. Click "New Invoice" button
2. Fill in the details:
   - **Customer** - Select from dropdown
   - **Invoice Date** - Date of invoice
   - **Due Date** - Payment due date
   - **Invoice Number** - Auto-generated or manual
3. Add line items:
   - **Description** - What you're selling
   - **Quantity** - Number of units
   - **Unit Price** - Price per unit
   - **Amount** - Auto-calculated
4. Review totals:
   - **Subtotal** - Before tax
   - **Tax** - Calculated tax amount
   - **Total** - Final amount due
5. Click "Save"

### Invoice Status

- **Draft** - Not yet sent
- **Sent** - Sent to customer
- **Paid** - Payment received
- **Overdue** - Past due date
- **Cancelled** - Voided invoice

### Sending an Invoice

1. Click "Send Email" button
2. Verify customer email
3. Customize message (optional)
4. Click "Send"
5. PDF automatically attached

### Recording Payment

1. Find the invoice
2. Click "Record Payment"
3. Enter:
   - **Payment Date**
   - **Amount Received**
   - **Payment Method**
   - **Reference Number**
4. Click "Save"

### Exporting Invoices

- **PDF** - Click "Export PDF" for printable version
- **Excel** - Click "Export Excel" for spreadsheet

---

## Bills

Record and manage supplier bills.

### Creating a Bill

1. Click "New Bill" button
2. Fill in the details:
   - **Supplier** - Select from dropdown
   - **Bill Date** - Date received
   - **Due Date** - Payment due date
   - **Bill Number** - Supplier's reference
3. Add line items:
   - **Description** - What you purchased
   - **Quantity** - Number of units
   - **Unit Price** - Price per unit
   - **Amount** - Auto-calculated
4. Review totals
5. Click "Save"

### Bill Status

- **Unpaid** - Not yet paid
- **Partially Paid** - Partial payment made
- **Paid** - Fully paid
- **Overdue** - Past due date

### Recording Payment

1. Find the bill
2. Click "Pay Bill"
3. Enter payment details
4. Click "Save"

---

## Reports

Generate financial reports for analysis and compliance.

### Available Reports

1. **General Ledger** - All transactions by account
2. **Trial Balance** - Account balances at a point in time
3. **Balance Sheet** - Assets, Liabilities, Equity
4. **Income Statement** - Revenue and Expenses (P&L)
5. **AR Aging** - Outstanding customer invoices by age
6. **AP Aging** - Outstanding supplier bills by age
7. **VAT Return** - Tax report for filing
8. **Customer Statement** - Transaction history for a customer

### Generating a Report

1. Select report type from dropdown
2. Choose date range:
   - **Start Date**
   - **End Date**
3. Select additional filters (if applicable):
   - **Account** - For General Ledger
   - **Customer** - For Customer Statement
4. Click "Generate Report"

### Exporting Reports

- **PDF** - Click "Export PDF" for printing
- **Excel** - Click "Export Excel" for analysis
- **Print** - Click "Print" for direct printing

### Report Tips

- **Month-End** - Run Trial Balance to verify books balance
- **Tax Filing** - Use VAT Return for tax submissions
- **Customer Follow-up** - Use AR Aging to identify overdue invoices
- **Cash Flow** - Review Income Statement regularly

---

## Settings

Configure system preferences and company information.

### Company Settings

1. Navigate to Settings
2. Update:
   - **Company Name**
   - **Address**
   - **Phone & Email**
   - **Tax ID**
   - **Currency**
   - **Fiscal Year Start**
3. Click "Save Changes"

### User Profile

1. Click on your name (top right)
2. Update:
   - **Name**
   - **Email**
   - **Password** (if changing)
3. Click "Save"

### Tax Configuration

1. Go to Settings > Tax Rates
2. Add tax rates:
   - **Name** (e.g., "VAT 15%")
   - **Rate** (e.g., 15)
   - **Active** status
3. Click "Save"

### Email Templates

1. Go to Settings > Email Templates
2. Customize templates for:
   - Invoice emails
   - Payment receipts
   - Reminders
3. Use variables: `{customerName}`, `{invoiceNumber}`, `{amount}`

---

## Tips & Best Practices

### Daily Tasks

- [ ] Record all transactions promptly
- [ ] Check for new invoices to send
- [ ] Review outstanding payments
- [ ] Respond to customer inquiries

### Weekly Tasks

- [ ] Reconcile bank statements
- [ ] Follow up on overdue invoices
- [ ] Review cash flow
- [ ] Pay supplier bills on time

### Monthly Tasks

- [ ] Generate Trial Balance
- [ ] Review Income Statement
- [ ] Prepare VAT Return
- [ ] Close accounting period

### Data Entry Best Practices

1. **Be Consistent** - Use standard descriptions
2. **Be Accurate** - Double-check amounts
3. **Be Timely** - Record transactions daily
4. **Be Detailed** - Add notes and references
5. **Be Organized** - Use proper account codes

### Security Tips

- **Strong Passwords** - Use complex passwords
- **Logout** - Always logout when finished
- **Permissions** - Only give access to authorized users
- **Backups** - Ensure regular backups are running
- **Updates** - Keep system updated

### Getting Help

**Need Assistance?**
- Check this manual first
- Contact your system administrator
- Email support: support@yourerp.com
- Phone: +230-XXXX-XXXX

---

## Keyboard Shortcuts

Speed up your work with keyboard shortcuts:

- **Ctrl + N** - New entry (context-dependent)
- **Ctrl + S** - Save current form
- **Ctrl + F** - Search/Filter
- **Esc** - Close modal/Cancel
- **Tab** - Navigate between fields
- **Enter** - Submit form

---

## Troubleshooting

### Common Issues

**Can't Login**
- Verify email and password
- Check Caps Lock is off
- Contact administrator to reset password

**Numbers Don't Balance**
- Check all debit and credit entries
- Verify amounts are entered correctly
- Review account types

**Report Not Generating**
- Check date range is valid
- Ensure you have data for the period
- Try refreshing the page

**Invoice Not Sending**
- Verify customer email address
- Check internet connection
- Review email settings

---

## Glossary

**Account** - A record in the chart of accounts

**Accounts Payable (AP)** - Money owed to suppliers

**Accounts Receivable (AR)** - Money owed by customers

**Balance Sheet** - Financial statement showing assets, liabilities, and equity

**Credit** - Right side of accounting entry (increases liabilities, equity, revenue)

**Debit** - Left side of accounting entry (increases assets, expenses)

**Fiscal Year** - 12-month accounting period

**General Ledger** - Complete record of all transactions

**Income Statement** - Report showing revenue and expenses (P&L)

**Journal Entry** - Record of a financial transaction

**Trial Balance** - List of all accounts with their balances

**VAT** - Value Added Tax

---

## Version History

**Version 1.0** - January 26, 2026
- Initial release
- Complete user manual for all features

---

**Need More Help?**

Contact your system administrator or support team:
- Email: support@yourerp.com
- Phone: +230-XXXX-XXXX
- Hours: Monday-Friday, 9 AM - 5 PM (Mauritius Time)

---

**© 2026 ERP System. All rights reserved.**
