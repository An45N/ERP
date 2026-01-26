import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}
import { formatCurrency, formatDate } from './utils';

interface ReportData {
  title: string;
  dateRange?: { startDate: string; endDate: string };
  data: any;
  reportType: string;
}

export const exportReportToPDF = (reportData: ReportData) => {
  const doc = new jsPDF();
  const { title, dateRange, data, reportType } = reportData;

  doc.setFontSize(18);
  doc.text(title, 14, 20);

  if (dateRange) {
    doc.setFontSize(10);
    doc.text(
      `Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`,
      14,
      28
    );
  }

  doc.setFontSize(10);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 14, 35);

  switch (reportType) {
    case 'general-ledger':
      exportGeneralLedgerPDF(doc, data);
      break;
    case 'trial-balance':
      exportTrialBalancePDF(doc, data);
      break;
    case 'balance-sheet':
      exportBalanceSheetPDF(doc, data);
      break;
    case 'income-statement':
      exportIncomeStatementPDF(doc, data);
      break;
    case 'ar-aging':
      exportARAgingPDF(doc, data);
      break;
    case 'ap-aging':
      exportAPAgingPDF(doc, data);
      break;
    case 'vat-return':
      exportVATReturnToPDF(doc, reportData);
      break;
    case 'customer-statement':
      exportCustomerStatementToPDF(doc, reportData);
      break;
    default:
      doc.text('Report type not supported', 14, 40);
  }

  doc.save(`${reportData.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
};

function exportVATReturnToPDF(doc: jsPDF, reportData: ReportData) {
  const data = reportData.data;
  
  // VAT Summary
  doc.setFontSize(12);
  doc.text('VAT Summary', 14, 40);
  
  autoTable(doc, {
    startY: 45,
    head: [['Description', 'Amount (MUR)']],
    body: [
      ['Output VAT (Sales)', formatCurrency(data.outputVAT || 0)],
      ['Input VAT (Purchases)', formatCurrency(data.inputVAT || 0)],
      [`Net VAT ${(data.netVAT || 0) >= 0 ? 'Payable' : 'Refundable'}`, formatCurrency(Math.abs(data.netVAT || 0))],
    ],
    theme: 'grid',
  });
  
  // VAT Breakdown
  const breakdownY = (doc as any).lastAutoTable.finalY + 10;
  doc.text('VAT Breakdown', 14, breakdownY);
  
  autoTable(doc, {
    startY: breakdownY + 5,
    head: [['Category', 'Net Amount', 'VAT Rate', 'VAT Amount']],
    body: (data.breakdown || []).map((item: any) => [
      item.category,
      formatCurrency(item.netAmount || 0),
      `${item.vatRate}%`,
      formatCurrency(item.vatAmount || 0),
    ]),
    theme: 'grid',
  });
}

function exportCustomerStatementToPDF(doc: jsPDF, reportData: ReportData) {
  const data = reportData.data;
  
  // Customer Details
  doc.setFontSize(12);
  doc.text('Customer Statement', 14, 40);
  doc.setFontSize(10);
  doc.text(`Customer: ${data.customer?.name || 'N/A'}`, 14, 48);
  doc.text(`Email: ${data.customer?.email || 'N/A'}`, 14, 54);
  
  // Account Summary
  doc.text(`Opening Balance: ${formatCurrency(data.openingBalance || 0)}`, 120, 48);
  doc.text(`Total Invoiced: ${formatCurrency(data.totalInvoiced || 0)}`, 120, 54);
  doc.text(`Total Paid: ${formatCurrency(data.totalPaid || 0)}`, 120, 60);
  doc.setFontSize(12);
  doc.text(`Balance Due: ${formatCurrency(data.balanceDue || 0)}`, 120, 68);
  
  // Transactions
  const transactions = [
    ['Opening Balance', '', '', '', '', formatCurrency(data.openingBalance || 0)],
    ...(data.transactions || []).map((txn: any) => [
      formatDate(txn.date),
      txn.type,
      txn.reference,
      txn.debit ? formatCurrency(txn.debit) : '-',
      txn.credit ? formatCurrency(txn.credit) : '-',
      formatCurrency(txn.balance || 0),
    ]),
    ['Closing Balance', '', '', '', '', formatCurrency(data.balanceDue || 0)],
  ];
  
  autoTable(doc, {
    startY: 75,
    head: [['Date', 'Transaction', 'Reference', 'Debit', 'Credit', 'Balance']],
    body: transactions,
    theme: 'grid',
  });
};

const exportGeneralLedgerPDF = (doc: jsPDF, data: any) => {
  const tableData = data.entries?.map((entry: any) => [
    formatDate(entry.date),
    entry.reference || '',
    entry.description || '',
    entry.debit ? formatCurrency(entry.debit) : '',
    entry.credit ? formatCurrency(entry.credit) : '',
    formatCurrency(entry.balance || 0),
  ]) || [];

  autoTable(doc, {
    startY: 45,
    head: [['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 8 },
  });
};

const exportTrialBalancePDF = (doc: jsPDF, data: any) => {
  const tableData = data.accounts?.map((account: any) => [
    account.code,
    account.name,
    account.debit ? formatCurrency(account.debit) : '',
    account.credit ? formatCurrency(account.credit) : '',
  ]) || [];

  tableData.push([
    '',
    'Total',
    formatCurrency(data.totals?.totalDebit || 0),
    formatCurrency(data.totals?.totalCredit || 0),
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Code', 'Account Name', 'Debit', 'Credit']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 8 },
    foot: [[
      '',
      'Total',
      formatCurrency(data.totals?.totalDebit || 0),
      formatCurrency(data.totals?.totalCredit || 0),
    ]],
    footStyles: { fillColor: [243, 244, 246], fontStyle: 'bold' },
  });
};

const exportBalanceSheetPDF = (doc: jsPDF, data: any) => {
  const assetsData = data.assets?.map((asset: any) => [
    asset.name,
    formatCurrency(asset.balance || 0),
  ]) || [];

  const liabilitiesData = data.liabilities?.map((liability: any) => [
    liability.name,
    formatCurrency(liability.balance || 0),
  ]) || [];

  const equityData = data.equity?.map((eq: any) => [
    eq.name,
    formatCurrency(eq.balance || 0),
  ]) || [];

  autoTable(doc, {
    startY: 45,
    head: [['Assets', 'Amount']],
    body: assetsData,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 8 },
    foot: [['Total Assets', formatCurrency(data.totals?.totalAssets || 0)]],
    footStyles: { fillColor: [243, 244, 246], fontStyle: 'bold' },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: finalY,
    head: [['Liabilities & Equity', 'Amount']],
    body: [...liabilitiesData, ...equityData],
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 8 },
    foot: [['Total Liabilities & Equity', formatCurrency(data.totals?.totalLiabilitiesAndEquity || 0)]],
    footStyles: { fillColor: [243, 244, 246], fontStyle: 'bold' },
  });
};

const exportIncomeStatementPDF = (doc: jsPDF, data: any) => {
  const revenueData = data.revenue?.map((rev: any) => [
    rev.name,
    formatCurrency(rev.amount || 0),
  ]) || [];

  const expenseData = data.expenses?.map((exp: any) => [
    exp.name,
    formatCurrency(exp.amount || 0),
  ]) || [];

  autoTable(doc, {
    startY: 45,
    head: [['Revenue', 'Amount']],
    body: revenueData,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 8 },
    foot: [['Total Revenue', formatCurrency(data.totals?.totalRevenue || 0)]],
    footStyles: { fillColor: [243, 244, 246], fontStyle: 'bold' },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: finalY,
    head: [['Expenses', 'Amount']],
    body: expenseData,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 8 },
    foot: [['Total Expenses', formatCurrency(data.totals?.totalExpenses || 0)]],
    footStyles: { fillColor: [243, 244, 246], fontStyle: 'bold' },
  });

  const netIncomeY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Net Income: ${formatCurrency(data.totals?.netIncome || 0)}`, 14, netIncomeY);
};

const exportARAgingPDF = (doc: jsPDF, data: any) => {
  const tableData = data.customers?.map((customer: any) => [
    customer.name,
    formatCurrency(customer.current || 0),
    formatCurrency(customer.days1_30 || 0),
    formatCurrency(customer.days31_60 || 0),
    formatCurrency(customer.days61_90 || 0),
    formatCurrency(customer.over90 || 0),
    formatCurrency(customer.total || 0),
  ]) || [];

  autoTable(doc, {
    startY: 45,
    head: [['Customer', 'Current', '1-30', '31-60', '61-90', '90+', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 7 },
    foot: [[
      'Total',
      formatCurrency(data.totals?.current || 0),
      formatCurrency(data.totals?.days1_30 || 0),
      formatCurrency(data.totals?.days31_60 || 0),
      formatCurrency(data.totals?.days61_90 || 0),
      formatCurrency(data.totals?.over90 || 0),
      formatCurrency(data.totals?.total || 0),
    ]],
    footStyles: { fillColor: [243, 244, 246], fontStyle: 'bold' },
  });
};

const exportAPAgingPDF = (doc: jsPDF, data: any) => {
  const tableData = data.suppliers?.map((supplier: any) => [
    supplier.name,
    formatCurrency(supplier.current || 0),
    formatCurrency(supplier.days1_30 || 0),
    formatCurrency(supplier.days31_60 || 0),
    formatCurrency(supplier.days61_90 || 0),
    formatCurrency(supplier.over90 || 0),
    formatCurrency(supplier.total || 0),
  ]) || [];

  autoTable(doc, {
    startY: 45,
    head: [['Supplier', 'Current', '1-30', '31-60', '61-90', '90+', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 7 },
    foot: [[
      'Total',
      formatCurrency(data.totals?.current || 0),
      formatCurrency(data.totals?.days1_30 || 0),
      formatCurrency(data.totals?.days31_60 || 0),
      formatCurrency(data.totals?.days61_90 || 0),
      formatCurrency(data.totals?.over90 || 0),
      formatCurrency(data.totals?.total || 0),
    ]],
    footStyles: { fillColor: [243, 244, 246], fontStyle: 'bold' },
  });
};
