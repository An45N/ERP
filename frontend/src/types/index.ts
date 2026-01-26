export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantCode: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantCode: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  category: string;
  subCategory?: string | null;
  currency: string;
  description?: string | null;
  parentId?: string | null;
  isActive: boolean;
  isSystem: boolean;
  parent?: {
    id: string;
    code: string;
    name: string;
  } | null;
  children?: Array<{
    id: string;
    code: string;
    name: string;
  }>;
}

export interface FiscalPeriod {
  id: string;
  companyId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "OPEN" | "CLOSED" | "LOCKED";
  periodType: "MONTH" | "QUARTER" | "YEAR";
}

export interface JournalEntry {
  id: string;
  companyId: string;
  entryNumber: string;
  entryDate: string;
  entryType: string;
  reference?: string | null;
  description: string;
  status: "DRAFT" | "POSTED" | "REVERSED";
  fiscalPeriodId?: string | null;
  lines: JournalLine[];
}

export interface JournalLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string | null;
  account?: {
    code: string;
    name: string;
    type: string;
  };
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  creditLimit?: number | null;
  paymentTerms?: string | null;
  currency: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  currency: string;
  isActive: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  customer?: Customer;
  lines: InvoiceLine[];
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string | null;
  taxAmount: number;
  lineTotal: number;
  accountId: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  supplierId: string;
  billDate: string;
  dueDate: string;
  status: "DRAFT" | "APPROVED" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  supplier?: Supplier;
  lines: BillLine[];
}

export interface BillLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string | null;
  taxAmount: number;
  lineTotal: number;
  accountId: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  taxType: "VAT" | "SALES_TAX" | "WITHHOLDING" | "OTHER";
  isActive: boolean;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  glAccountId: string;
  isActive: boolean;
}
