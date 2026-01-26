import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Download, Printer } from "lucide-react";
import { formatCurrency, formatDate } from "../../lib/utils";

interface ReportViewerProps {
  reportType: string;
  data: any;
  startDate: string;
  endDate: string;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

export function ReportViewer({ 
  reportType, 
  data, 
  startDate, 
  endDate,
  onExportPDF,
  onExportExcel 
}: ReportViewerProps) {
  
  const renderGeneralLedger = () => {
    if (!data?.entries) return <p>No data available</p>;
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Date</th>
              <th className="text-left py-2 px-4">Entry #</th>
              <th className="text-left py-2 px-4">Description</th>
              <th className="text-right py-2 px-4">Debit</th>
              <th className="text-right py-2 px-4">Credit</th>
              <th className="text-right py-2 px-4">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry: any, index: number) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{formatDate(entry.date)}</td>
                <td className="py-2 px-4">{entry.entryNumber}</td>
                <td className="py-2 px-4">{entry.description}</td>
                <td className="py-2 px-4 text-right">{entry.debit ? formatCurrency(entry.debit) : '-'}</td>
                <td className="py-2 px-4 text-right">{entry.credit ? formatCurrency(entry.credit) : '-'}</td>
                <td className="py-2 px-4 text-right font-medium">{formatCurrency(entry.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTrialBalance = () => {
    if (!data?.accounts) return <p>No data available</p>;
    
    const totalDebit = data.accounts.reduce((sum: number, acc: any) => sum + acc.debit, 0);
    const totalCredit = data.accounts.reduce((sum: number, acc: any) => sum + acc.credit, 0);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Account Code</th>
              <th className="text-left py-2 px-4">Account Name</th>
              <th className="text-right py-2 px-4">Debit</th>
              <th className="text-right py-2 px-4">Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.accounts.map((account: any, index: number) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{account.code}</td>
                <td className="py-2 px-4">{account.name}</td>
                <td className="py-2 px-4 text-right">{account.debit ? formatCurrency(account.debit) : '-'}</td>
                <td className="py-2 px-4 text-right">{account.credit ? formatCurrency(account.credit) : '-'}</td>
              </tr>
            ))}
            <tr className="border-t-2 font-bold">
              <td className="py-2 px-4" colSpan={2}>Total</td>
              <td className="py-2 px-4 text-right">{formatCurrency(totalDebit)}</td>
              <td className="py-2 px-4 text-right">{formatCurrency(totalCredit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!data) return <p>No data available</p>;
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-3">Assets</h3>
          <table className="w-full">
            <tbody>
              {data.assets?.map((item: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2 px-4">Total Assets</td>
                <td className="py-2 px-4 text-right">{formatCurrency(data.totalAssets || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div>
          <h3 className="font-bold text-lg mb-3">Liabilities</h3>
          <table className="w-full">
            <tbody>
              {data.liabilities?.map((item: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2 px-4">Total Liabilities</td>
                <td className="py-2 px-4 text-right">{formatCurrency(data.totalLiabilities || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div>
          <h3 className="font-bold text-lg mb-3">Equity</h3>
          <table className="w-full">
            <tbody>
              {data.equity?.map((item: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2 px-4">Total Equity</td>
                <td className="py-2 px-4 text-right">{formatCurrency(data.totalEquity || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!data) return <p>No data available</p>;
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-3">Revenue</h3>
          <table className="w-full">
            <tbody>
              {data.revenue?.map((item: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2 px-4">Total Revenue</td>
                <td className="py-2 px-4 text-right">{formatCurrency(data.totalRevenue || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div>
          <h3 className="font-bold text-lg mb-3">Expenses</h3>
          <table className="w-full">
            <tbody>
              {data.expenses?.map((item: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2 px-4">Total Expenses</td>
                <td className="py-2 px-4 text-right">{formatCurrency(data.totalExpenses || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="border-t-2 pt-4">
          <table className="w-full">
            <tbody>
              <tr className="font-bold text-lg">
                <td className="py-2 px-4">Net Income</td>
                <td className={`py-2 px-4 text-right ${(data.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netIncome || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderARAgingReport = () => {
    const agingData = data as any;
    
    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Current</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">1-30 Days</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">31-60 Days</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">61-90 Days</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Over 90 Days</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {agingData?.customers?.map((customer: any, index: number) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="py-3 px-4">{customer.name}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(customer.current || 0)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(customer.days1_30 || 0)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(customer.days31_60 || 0)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(customer.days61_90 || 0)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(customer.over90 || 0)}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(customer.total || 0)}</td>
              </tr>
            ))}
            <tr className="border-t-2 bg-gray-50 font-bold">
              <td className="py-3 px-4">Total</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.current || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.days1_30 || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.days31_60 || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.days61_90 || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.over90 || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.total || 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderAPAgingReport = () => {
    const agingData = data as any;
    
    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Supplier</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Current</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">1-30 Days</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">31-60 Days</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">61-90 Days</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Over 90 Days</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {agingData?.suppliers?.map((supplier: any, index: number) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="py-3 px-4">{supplier.name}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(supplier.current || 0)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(supplier.days1_30 || 0)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(supplier.days31_60 || 0)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(supplier.days61_90 || 0)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(supplier.over90 || 0)}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(supplier.total || 0)}</td>
              </tr>
            ))}
            <tr className="border-t-2 bg-gray-50 font-bold">
              <td className="py-3 px-4">Total</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.current || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.days1_30 || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.days31_60 || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.days61_90 || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.over90 || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrency(agingData?.totals?.total || 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderVATReturn = () => {
    const vatData = data as any;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">VAT Summary</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount (MUR)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-3 px-4 font-medium">Output VAT (Sales)</td>
                <td className="py-3 px-4 text-right">{formatCurrency(vatData?.outputVAT || 0)}</td>
              </tr>
              <tr className="border-t">
                <td className="py-3 px-4 font-medium">Input VAT (Purchases)</td>
                <td className="py-3 px-4 text-right">{formatCurrency(vatData?.inputVAT || 0)}</td>
              </tr>
              <tr className="border-t bg-gray-50 font-bold">
                <td className="py-3 px-4">Net VAT {(vatData?.netVAT || 0) >= 0 ? 'Payable' : 'Refundable'}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(Math.abs(vatData?.netVAT || 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">VAT Breakdown</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Net Amount</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">VAT Rate</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">VAT Amount</th>
              </tr>
            </thead>
            <tbody>
              {vatData?.breakdown?.map((item: any, index: number) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">{item.category}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.netAmount || 0)}</td>
                  <td className="py-3 px-4 text-right">{item.vatRate}%</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.vatAmount || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCustomerStatement = () => {
    const statementData = data as any;
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer Details</h3>
              <p className="text-lg font-bold text-gray-900">{statementData?.customer?.name}</p>
              <p className="text-sm text-gray-600">{statementData?.customer?.email}</p>
              <p className="text-sm text-gray-600">{statementData?.customer?.phone}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Account Summary</h3>
              <p className="text-sm text-gray-600">Opening Balance: {formatCurrency(statementData?.openingBalance || 0)}</p>
              <p className="text-sm text-gray-600">Total Invoiced: {formatCurrency(statementData?.totalInvoiced || 0)}</p>
              <p className="text-sm text-gray-600">Total Paid: {formatCurrency(statementData?.totalPaid || 0)}</p>
              <p className="text-lg font-bold text-gray-900 mt-2">Balance Due: {formatCurrency(statementData?.balanceDue || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Reference</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Debit</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Credit</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t bg-gray-50">
                <td className="py-3 px-4" colSpan={5}>Opening Balance</td>
                <td className="py-3 px-4 text-right font-medium">{formatCurrency(statementData?.openingBalance || 0)}</td>
              </tr>
              {statementData?.transactions?.map((txn: any, index: number) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{formatDate(txn.date)}</td>
                  <td className="py-3 px-4">{txn.type}</td>
                  <td className="py-3 px-4 text-sm">{txn.reference}</td>
                  <td className="py-3 px-4 text-right">{txn.debit ? formatCurrency(txn.debit) : '-'}</td>
                  <td className="py-3 px-4 text-right">{txn.credit ? formatCurrency(txn.credit) : '-'}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(txn.balance || 0)}</td>
                </tr>
              ))}
              <tr className="border-t-2 bg-gray-50 font-bold">
                <td className="py-3 px-4" colSpan={5}>Closing Balance</td>
                <td className="py-3 px-4 text-right">{formatCurrency(statementData?.balanceDue || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (reportType) {
      case 'general-ledger':
        return renderGeneralLedger();
      case 'trial-balance':
        return renderTrialBalance();
      case 'balance-sheet':
        return renderBalanceSheet();
      case "income-statement":
        return renderIncomeStatement();
      case "ar-aging":
        return renderARAgingReport();
      case "ap-aging":
        return renderAPAgingReport();
      case "vat-return":
        return renderVATReturn();
      case "customer-statement":
        return renderCustomerStatement();
      default:
        return <div>Unknown report type</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Report Results</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Period: {formatDate(startDate)} to {formatDate(endDate)}
            </p>
          </div>
          <div className="flex gap-2">
            {onExportPDF && (
              <Button variant="outline" size="sm" onClick={onExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            )}
            {onExportExcel && (
              <Button variant="outline" size="sm" onClick={onExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
