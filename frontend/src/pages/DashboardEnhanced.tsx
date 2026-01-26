import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  ShoppingCart,
  Receipt
} from "lucide-react";
import { useCompanyStore } from "../store/companyStore";
import { api } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/utils";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  invoiceCount: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  totalCustomers: number;
  totalSuppliers: number;
}

interface RecentTransaction {
  id: string;
  type: 'invoice' | 'bill' | 'payment';
  reference: string;
  description: string;
  amount: number;
  date: string;
  status: string;
}

interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
}

interface TopCustomer {
  id: string;
  name: string;
  totalRevenue: number;
  invoiceCount: number;
}

interface TopSupplier {
  id: string;
  name: string;
  totalExpenses: number;
  billCount: number;
}

type DateFilter = 'this_month' | 'last_month' | 'this_quarter' | 'this_year';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function DashboardEnhanced() {
  const navigate = useNavigate();
  const { companyId } = useCompanyStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    invoiceCount: 0,
    outstandingInvoices: 0,
    overdueInvoices: 0,
    totalCustomers: 0,
    totalSuppliers: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<TopSupplier[]>([]);
  const [cashFlow, setCashFlow] = useState({ inflow: 0, outflow: 0, net: 0 });
  const [dateFilter, setDateFilter] = useState<DateFilter>('this_month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [companyId, dateFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dateParams = getDateRangeParams(dateFilter);
      
      // Fetch real data from existing endpoints
      const [invoicesRes, billsRes, customersRes, suppliersRes] = await Promise.all([
        api.get(`/invoices?companyId=${companyId}`),
        api.get(`/bills?companyId=${companyId}`),
        api.get(`/customers?companyId=${companyId}`),
        api.get(`/suppliers?companyId=${companyId}`),
      ]);

      const invoices = invoicesRes.data.invoices || [];
      const bills = billsRes.data.bills || [];
      const customers = customersRes.data.customers || [];
      const suppliers = suppliersRes.data.suppliers || [];

      // Calculate stats
      const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.total, 0);
      const totalExpenses = bills.reduce((sum: number, bill: any) => sum + bill.total, 0);
      const netIncome = totalRevenue - totalExpenses;
      const outstandingInvoices = invoices.filter((inv: any) => inv.status !== 'PAID').length;
      const overdueInvoices = invoices.filter((inv: any) => 
        inv.status === 'OVERDUE' || (inv.status !== 'PAID' && new Date(inv.dueDate) < new Date())
      ).length;

      setStats({
        totalRevenue,
        totalExpenses,
        netIncome,
        invoiceCount: invoices.length,
        outstandingInvoices,
        overdueInvoices,
        totalCustomers: customers.length,
        totalSuppliers: suppliers.length,
      });

      // Build chart data (last 6 months)
      const monthlyData = buildMonthlyChartData(invoices, bills);
      setChartData(monthlyData);

      // Recent transactions
      const transactions = buildRecentTransactions(invoices, bills);
      setRecentTransactions(transactions);

      // Top customers
      const topCust = buildTopCustomers(invoices, customers);
      setTopCustomers(topCust);

      // Top suppliers
      const topSupp = buildTopSuppliers(bills, suppliers);
      setTopSuppliers(topSupp);

      // Cash flow
      const paidRevenue = invoices
        .filter((inv: any) => inv.status === 'PAID')
        .reduce((sum: number, inv: any) => sum + inv.total, 0);
      const paidExpenses = bills
        .filter((bill: any) => bill.status === 'PAID')
        .reduce((sum: number, bill: any) => sum + bill.total, 0);
      
      setCashFlow({
        inflow: paidRevenue,
        outflow: paidExpenses,
        net: paidRevenue - paidExpenses,
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeParams = (filter: DateFilter): string => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (filter) {
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return `startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
  };

  const buildMonthlyChartData = (invoices: any[], bills: any[]): ChartData[] => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthRevenue = invoices
        .filter((inv: any) => {
          const invDate = new Date(inv.invoiceDate);
          return invDate >= monthStart && invDate <= monthEnd;
        })
        .reduce((sum: number, inv: any) => sum + inv.total, 0);

      const monthExpenses = bills
        .filter((bill: any) => {
          const billDate = new Date(bill.billDate);
          return billDate >= monthStart && billDate <= monthEnd;
        })
        .reduce((sum: number, bill: any) => sum + bill.total, 0);

      months.push({
        name: monthName,
        revenue: monthRevenue,
        expenses: monthExpenses,
      });
    }

    return months;
  };

  const buildRecentTransactions = (invoices: any[], bills: any[]): RecentTransaction[] => {
    const transactions: RecentTransaction[] = [];

    invoices.slice(0, 5).forEach((inv: any) => {
      transactions.push({
        id: inv.id,
        type: 'invoice',
        reference: inv.invoiceNumber,
        description: `Invoice to ${inv.customer?.name || 'N/A'}`,
        amount: inv.total,
        date: inv.invoiceDate,
        status: inv.status,
      });
    });

    bills.slice(0, 5).forEach((bill: any) => {
      transactions.push({
        id: bill.id,
        type: 'bill',
        reference: bill.billNumber,
        description: `Bill from ${bill.supplier?.name || 'N/A'}`,
        amount: bill.total,
        date: bill.billDate,
        status: bill.status,
      });
    });

    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  const buildTopCustomers = (invoices: any[], customers: any[]): TopCustomer[] => {
    const customerMap = new Map<string, { totalRevenue: number; invoiceCount: number }>();

    invoices.forEach((inv: any) => {
      if (inv.customer?.id) {
        const existing = customerMap.get(inv.customer.id) || { totalRevenue: 0, invoiceCount: 0 };
        customerMap.set(inv.customer.id, {
          totalRevenue: existing.totalRevenue + inv.total,
          invoiceCount: existing.invoiceCount + 1,
        });
      }
    });

    const topCust = Array.from(customerMap.entries())
      .map(([id, data]) => {
        const customer = customers.find((c: any) => c.id === id);
        return {
          id,
          name: customer?.name || 'Unknown',
          totalRevenue: data.totalRevenue,
          invoiceCount: data.invoiceCount,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    return topCust;
  };

  const buildTopSuppliers = (bills: any[], suppliers: any[]): TopSupplier[] => {
    const supplierMap = new Map<string, { totalExpenses: number; billCount: number }>();

    bills.forEach((bill: any) => {
      if (bill.supplier?.id) {
        const existing = supplierMap.get(bill.supplier.id) || { totalExpenses: 0, billCount: 0 };
        supplierMap.set(bill.supplier.id, {
          totalExpenses: existing.totalExpenses + bill.total,
          billCount: existing.billCount + 1,
        });
      }
    });

    const topSupp = Array.from(supplierMap.entries())
      .map(([id, data]) => {
        const supplier = suppliers.find((s: any) => s.id === id);
        return {
          id,
          name: supplier?.name || 'Unknown',
          totalExpenses: data.totalExpenses,
          billCount: data.billCount,
        };
      })
      .sort((a, b) => b.totalExpenses - a.totalExpenses)
      .slice(0, 5);

    return topSupp;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your ERP system overview</p>
        </div>
        <div className="flex gap-2">
          {(['this_month', 'last_month', 'this_quarter', 'this_year'] as DateFilter[]).map((filter) => (
            <Button
              key={filter}
              variant={dateFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter(filter)}
            >
              {filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {stats.invoiceCount} invoices
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  From suppliers
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Income</p>
                <p className={`text-2xl font-bold ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.netIncome)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Profit margin
                </p>
              </div>
              <div className={`p-3 ${stats.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg`}>
                <TrendingUp className={`h-6 w-6 ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold">{stats.outstandingInvoices}</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  {stats.overdueInvoices} overdue
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Cash Inflow</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(cashFlow.inflow)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Cash Outflow</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(cashFlow.outflow)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${cashFlow.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlow.net)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers and Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No customer data</div>
            ) : (
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.invoiceCount} invoices</p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">{formatCurrency(customer.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            {topSuppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No supplier data</div>
            ) : (
              <div className="space-y-4">
                {topSuppliers.map((supplier, index) => (
                  <div key={supplier.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-gray-600">{supplier.billCount} bills</p>
                      </div>
                    </div>
                    <p className="font-semibold text-red-600">{formatCurrency(supplier.totalExpenses)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recent transactions</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reference</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{formatDate(txn.date)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          txn.type === 'invoice' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {txn.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{txn.reference}</td>
                      <td className="py-3 px-4">{txn.description}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        txn.type === 'invoice' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          txn.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          txn.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/invoices')}
              className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="h-6 w-6 text-blue-600 mb-2" />
              <p className="font-medium">New Invoice</p>
              <p className="text-sm text-gray-600">Create invoice</p>
            </button>
            <button 
              onClick={() => navigate('/bills')}
              className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Receipt className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-medium">New Bill</p>
              <p className="text-sm text-gray-600">Record bill</p>
            </button>
            <button 
              onClick={() => navigate('/customers')}
              className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-medium">Add Customer</p>
              <p className="text-sm text-gray-600">New customer</p>
            </button>
            <button 
              onClick={() => navigate('/reports')}
              className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
              <p className="font-medium">View Reports</p>
              <p className="text-sm text-gray-600">Financial reports</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
