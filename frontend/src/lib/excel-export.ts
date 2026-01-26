import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './utils';

interface ReportData {
  title: string;
  dateRange?: { startDate: string; endDate: string };
  data: any;
  reportType: string;
}

export const exportReportToExcel = (reportData: ReportData) => {
  const { title, dateRange, data, reportType } = reportData;

  let worksheetData: any[][] = [];
  let worksheetName = title.substring(0, 31);

  worksheetData.push([title]);
  if (dateRange) {
    worksheetData.push([
      `Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`,
    ]);
  }
  worksheetData.push([`Generated: ${formatDate(new Date().toISOString())}`]);
  worksheetData.push([]);

  switch (reportType) {
    case 'general-ledger':
      worksheetData = [...worksheetData, ...formatGeneralLedgerExcel(data)];
      break;
    case 'trial-balance':
      worksheetData = [...worksheetData, ...formatTrialBalanceExcel(data)];
      break;
    case 'balance-sheet':
      worksheetData = [...worksheetData, ...formatBalanceSheetExcel(data)];
      break;
    case 'income-statement':
      worksheetData = [...worksheetData, ...formatIncomeStatementExcel(data)];
      const ws3 = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(wb, ws3, worksheetName);
      break;
    case 'ar-aging':
      worksheetData = [...worksheetData, ...formatARAgingExcel(data)];
      const ws4 = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(wb, ws4, worksheetName);
      break;
    case 'ap-aging':
      exportAPAgingToExcel(wb, reportData);
      break;
    case 'vat-return':
      exportVATReturnToExcel(wb, reportData);
      break;
    case 'customer-statement':
      exportCustomerStatementToExcel(wb, reportData);
      break;
    default:
      const ws = XLSX.utils.json_to_sheet([{ Message: 'Report type not supported' }]);
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
  }

  XLSX.writeFile(wb, `${reportData.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`);
};

function exportVATReturnToExcel(wb: any, reportData: ReportData) {
  const data = reportData.data;

  // VAT Summary
  const summaryData = [
    { Description: 'Output VAT (Sales)', 'Amount (MUR)': data.outputVAT || 0 },
    { Description: 'Input VAT (Purchases)', 'Amount (MUR)': data.inputVAT || 0 },
    { Description: `Net VAT ${(data.netVAT || 0) >= 0 ? 'Payable' : 'Refundable'}`, 'Amount (MUR)': Math.abs(data.netVAT || 0) },
  ];

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'VAT Summary');

  // VAT Breakdown
  const breakdownData = (data.breakdown || []).map((item: any) => ({
    Category: item.category,
    'Net Amount': item.netAmount || 0,
    'VAT Rate': `${item.vatRate}%`,
    'VAT Amount': item.vatAmount || 0,
  }));

  const breakdownWs = XLSX.utils.json_to_sheet(breakdownData);
  XLSX.utils.book_append_sheet(wb, breakdownWs, 'VAT Breakdown');
}

function exportCustomerStatementToExcel(wb: any, reportData: ReportData) {
  const data = reportData.data;

  // Customer Details
  const detailsData = [
    { Field: 'Customer Name', Value: data.customer?.name || 'N/A' },
    { Field: 'Email', Value: data.customer?.email || 'N/A' },
    { Field: 'Phone', Value: data.customer?.phone || 'N/A' },
    { Field: '', Value: '' },
    { Field: 'Opening Balance', Value: data.openingBalance || 0 },
    { Field: 'Total Invoiced', Value: data.totalInvoiced || 0 },
    { Field: 'Total Paid', Value: data.totalPaid || 0 },
    { Field: 'Balance Due', Value: data.balanceDue || 0 },
  ];

  const detailsWs = XLSX.utils.json_to_sheet(detailsData);
  XLSX.utils.book_append_sheet(wb, detailsWs, 'Customer Details');

  // Transactions
  const transactionsData = [
    { Date: 'Opening Balance', Transaction: '', Reference: '', Debit: '', Credit: '', Balance: data.openingBalance || 0 },
    ...(data.transactions || []).map((txn: any) => ({
      Date: txn.date,
      Transaction: txn.type,
      Reference: txn.reference,
      Debit: txn.debit || '',
      Credit: txn.credit || '',
      Balance: txn.balance || 0,
    })),
    { Date: 'Closing Balance', Transaction: '', Reference: '', Debit: '', Credit: '', Balance: data.balanceDue || 0 },
  ];

  const transactionsWs = XLSX.utils.json_to_sheet(transactionsData);
  XLSX.utils.book_append_sheet(wb, transactionsWs, 'Transactions');
};

const formatGeneralLedgerExcel = (data: any): any[][] => {
  const rows: any[][] = [];
  rows.push(['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance']);

  data.entries?.forEach((entry: any) => {
    rows.push([
      formatDate(entry.date),
      entry.reference || '',
      entry.description || '',
      entry.debit || '',
      entry.credit || '',
      entry.balance || 0,
    ]);
  });

  return rows;
};

const formatTrialBalanceExcel = (data: any): any[][] => {
  const rows: any[][] = [];
  rows.push(['Code', 'Account Name', 'Debit', 'Credit']);

  data.accounts?.forEach((account: any) => {
    rows.push([
      account.code,
      account.name,
      account.debit || '',
      account.credit || '',
    ]);
  });

  rows.push(['', 'Total', data.totals?.totalDebit || 0, data.totals?.totalCredit || 0]);

  return rows;
};

const formatBalanceSheetExcel = (data: any): any[][] => {
  const rows: any[][] = [];
  
  rows.push(['Assets', 'Amount']);
  data.assets?.forEach((asset: any) => {
    rows.push([asset.name, asset.balance || 0]);
  });
  rows.push(['Total Assets', data.totals?.totalAssets || 0]);
  rows.push([]);

  rows.push(['Liabilities', 'Amount']);
  data.liabilities?.forEach((liability: any) => {
    rows.push([liability.name, liability.balance || 0]);
  });
  rows.push([]);

  rows.push(['Equity', 'Amount']);
  data.equity?.forEach((eq: any) => {
    rows.push([eq.name, eq.balance || 0]);
  });
  rows.push(['Total Liabilities & Equity', data.totals?.totalLiabilitiesAndEquity || 0]);

  return rows;
};

const formatIncomeStatementExcel = (data: any): any[][] => {
  const rows: any[][] = [];
  
  rows.push(['Revenue', 'Amount']);
  data.revenue?.forEach((rev: any) => {
    rows.push([rev.name, rev.amount || 0]);
  });
  rows.push(['Total Revenue', data.totals?.totalRevenue || 0]);
  rows.push([]);

  rows.push(['Expenses', 'Amount']);
  data.expenses?.forEach((exp: any) => {
    rows.push([exp.name, exp.amount || 0]);
  });
  rows.push(['Total Expenses', data.totals?.totalExpenses || 0]);
  rows.push([]);

  rows.push(['Net Income', data.totals?.netIncome || 0]);

  return rows;
};

const formatARAgingExcel = (data: any): any[][] => {
  const rows: any[][] = [];
  rows.push(['Customer', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', 'Over 90 Days', 'Total']);

  data.customers?.forEach((customer: any) => {
    rows.push([
      customer.name,
      customer.current || 0,
      customer.days1_30 || 0,
      customer.days31_60 || 0,
      customer.days61_90 || 0,
      customer.over90 || 0,
      customer.total || 0,
    ]);
  });

  rows.push([
    'Total',
    data.totals?.current || 0,
    data.totals?.days1_30 || 0,
    data.totals?.days31_60 || 0,
    data.totals?.days61_90 || 0,
    data.totals?.over90 || 0,
    data.totals?.total || 0,
  ]);

  return rows;
};

const formatAPAgingExcel = (data: any): any[][] => {
  const rows: any[][] = [];
  rows.push(['Supplier', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', 'Over 90 Days', 'Total']);

  data.suppliers?.forEach((supplier: any) => {
    rows.push([
      supplier.name,
      supplier.current || 0,
      supplier.days1_30 || 0,
      supplier.days31_60 || 0,
      supplier.days61_90 || 0,
      supplier.over90 || 0,
      supplier.total || 0,
    ]);
  });

  rows.push([
    'Total',
    data.totals?.current || 0,
    data.totals?.days1_30 || 0,
    data.totals?.days31_60 || 0,
    data.totals?.days61_90 || 0,
    data.totals?.over90 || 0,
    data.totals?.total || 0,
  ]);

  return rows;
};
