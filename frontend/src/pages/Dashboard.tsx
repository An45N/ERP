import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DollarSign, TrendingUp, Users, ShoppingCart, ArrowUpRight, ArrowDownRight, Calendar, FileText } from "lucide-react";
import { useCompanyStore } from "../store/companyStore";
import { api } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/utils";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Invoice, Bill, Customer } from "../types";

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

type DateFilter = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';

export function Dashboard() {
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
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const dateParams = getDateRangeParams(dateFilter);
        
        const [statsResponse, transactionsResponse, chartResponse, customersResponse, suppliersResponse, cashFlowResponse] = await Promise.all([
          api.get(`/dashboard/stats?companyId=${companyId}&${dateParams}`),
          api.get(`/dashboard/recent-transactions?companyId=${companyId}&limit=10`),
          api.get(`/dashboard/chart-data?companyId=${companyId}&${dateParams}`),
          api.get(`/dashboard/top-customers?companyId=${companyId}&${dateParams}&limit=5`),
          api.get(`/dashboard/top-suppliers?companyId=${companyId}&${dateParams}&limit=5`),
          api.get(`/dashboard/cash-flow?companyId=${companyId}&${dateParams}`),
        ]);

        setStats(statsResponse.data);
        setRecentTransactions(transactionsResponse.data.transactions || []);
        setChartData(chartResponse.data.chartData || []);
        setTopCustomers(customersResponse.data.customers || []);
        setTopSuppliers(suppliersResponse.data.suppliers || []);
        setCashFlow(cashFlowResponse.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [companyId, dateFilter]);

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

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Outstanding Invoices",
      value: stats.outstandingInvoices.toString(),
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your ERP system overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No recent activity
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <div 
                    key={transaction.id} 
                    className={`flex items-center justify-between py-3 ${
                      index < recentTransactions.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                    <span className={`font-semibold ${
                      transaction.type === 'invoice' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/invoices')}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium">New Invoice</p>
                <p className="text-sm text-gray-600">Create invoice</p>
              </button>
              <button 
                onClick={() => navigate('/bills')}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-6 w-6 text-purple-600 mb-2" />
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
    </div>
  );
}
