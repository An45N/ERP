import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  FileText,
  TrendingUp,
  BarChart3,
  PieChart,
} from "lucide-react";
import { api } from "../lib/api";
import { ReportViewer } from "../components/reports/ReportViewer";
import toast from "react-hot-toast";
import { exportReportToPDF } from "../lib/pdf-export";
import { exportReportToExcel } from "../lib/excel-export";
import { useCompanyStore } from "../store/companyStore";
import { usePreferencesStore } from "../store/preferencesStore";

export function Reports() {
  const companyId = useCompanyStore((state) => state.companyId);
  const { lastReportDates, setLastReportDates } = usePreferencesStore();
  
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(lastReportDates.startDate || '');
  const [endDate, setEndDate] = useState(lastReportDates.endDate || '');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchAccounts();
    fetchCustomers();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get(`/accounts?companyId=${companyId}`);
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get(`/customers?companyId=${companyId}`);
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const reports = [
    {
      id: "general-ledger",
      name: "General Ledger",
      description: "Detailed transaction listing by account",
      icon: FileText,
      color: "blue",
    },
    {
      id: "trial-balance",
      name: "Trial Balance",
      description: "Account balances verification report",
      icon: BarChart3,
      color: "green",
    },
    {
      id: "balance-sheet",
      name: "Balance Sheet",
      description: "Assets, liabilities, and equity statement",
      icon: PieChart,
      color: "purple",
    },
    {
      id: "income-statement",
      name: "Income Statement",
      description: "Profit and loss statement",
      icon: TrendingUp,
      color: "orange",
    },
    {
      id: "ar-aging",
      name: "AR Aging Report",
      description: "Accounts receivable aging analysis",
      icon: FileText,
      color: "cyan",
    },
    {
      id: "ap-aging",
      name: "AP Aging Report",
      description: "Accounts payable aging analysis",
      icon: FileText,
      color: "red",
    },
    {
      id: "vat-return",
      name: "VAT Return",
      description: "MRA VAT return report for Mauritius",
      icon: FileText,
      color: "indigo",
    },
    {
      id: "customer-statement",
      name: "Customer Statement",
      description: "Customer account statement with transactions",
      icon: FileText,
      color: "teal",
    },
  ];

  const handleExportPDF = () => {
    if (!reportData || !selectedReport) {
      toast.error('Please generate a report first');
      return;
    }

    const reportTitle = reports.find(r => r.id === selectedReport)?.name || 'Report';
    
    exportReportToPDF({
      title: reportTitle,
      dateRange: { startDate, endDate },
      data: reportData,
      reportType: selectedReport,
    });

    toast.success('Report exported to PDF');
  };

  const handleExportExcel = () => {
    if (!reportData || !selectedReport) {
      toast.error('Please generate a report first');
      return;
    }

    const reportTitle = reports.find(r => r.id === selectedReport)?.name || 'Report';
    
    exportReportToExcel({
      title: reportTitle,
      dateRange: { startDate, endDate },
      data: reportData,
      reportType: selectedReport,
    });

    toast.success('Report exported to Excel');
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    // Save dates to preferences
    setLastReportDates(startDate, endDate);

    setLoading(true);
    try {
      let response;
      
      switch (selectedReport) {
        case 'general-ledger':
          response = await api.get(`/reports/general-ledger?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`);
          break;
        case 'trial-balance':
          response = await api.get(`/reports/trial-balance?companyId=${companyId}&asOfDate=${endDate}`);
          break;
        case 'balance-sheet':
          response = await api.get(`/reports/balance-sheet?companyId=${companyId}&asOfDate=${endDate}`);
          break;
        case "income-statement":
          response = await api.get(`/reports/income-statement?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`);
          break;
        case "ar-aging":
          response = await api.get(`/reports/ar-aging?companyId=${companyId}&asOfDate=${endDate}`);
          break;
        case "ap-aging":
          response = await api.get(`/reports/ap-aging?companyId=${companyId}&asOfDate=${endDate}`);
          break;
        case "vat-return":
          response = await api.get(`/reports/vat-return?companyId=${companyId}&startDate=${startDate}&endDate=${endDate}`);
          break;
        case "customer-statement":
          if (!selectedCustomer) {
            toast.error('Please select a customer');
            setLoading(false);
            return;
          }
          response = await api.get(`/reports/customer-statement?companyId=${companyId}&customerId=${selectedCustomer}&startDate=${startDate}&endDate=${endDate}`);
          break;
        default:
          throw new Error("Unknown report type");
      }

      setReportData(response.data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600 mt-2">Generate and view financial reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                selectedReport === report.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`h-16 w-16 rounded-full bg-${report.color}-100 flex items-center justify-center`}>
                    <Icon className={`h-8 w-8 text-${report.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{report.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle>Report Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedReport === "general-ledger" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account (Optional)
                  </label>
                  <select 
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Accounts</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedReport === "customer-statement" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer
                  </label>
                  <select 
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={generateReport}
                  disabled={loading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Trial Balance - December 2025</p>
                  <p className="text-sm text-gray-600">Generated on Jan 15, 2026</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Income Statement - Q4 2025</p>
                  <p className="text-sm text-gray-600">Generated on Jan 10, 2026</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <PieChart className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Balance Sheet - December 2025</p>
                  <p className="text-sm text-gray-600">Generated on Jan 5, 2026</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && selectedReport && (
        <ReportViewer
          reportType={selectedReport}
          data={reportData}
          startDate={startDate}
          endDate={endDate}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />
      )}
    </div>
  );
}
