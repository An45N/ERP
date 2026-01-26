import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash2, Play, Pause, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useCompanyStore } from '../store/companyStore';
import { formatCurrency, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { Pagination } from '../components/ui/Pagination';

interface RecurringTransaction {
  id: string;
  type: 'invoice' | 'bill';
  templateName: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  lastRunDate?: string;
  isActive: boolean;
  runCount: number;
  createdAt: string;
}

export function RecurringTransactions() {
  const companyId = useCompanyStore((state) => state.companyId);
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | null>(null);

  useEffect(() => {
    fetchRecurringTransactions();
  }, [companyId]);

  const fetchRecurringTransactions = async () => {
    try {
      const response = await api.get(`/recurring-transactions?companyId=${companyId}`);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch recurring transactions:', error);
      toast.error('Failed to load recurring transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/recurring-transactions/${id}`, { isActive: !isActive });
      toast.success(isActive ? 'Recurring transaction paused' : 'Recurring transaction activated');
      fetchRecurringTransactions();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recurring transaction?')) {
      return;
    }

    try {
      await api.delete(`/recurring-transactions/${id}`);
      toast.success('Recurring transaction deleted');
      fetchRecurringTransactions();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete recurring transaction');
    }
  };

  const handleRunNow = async (id: string) => {
    if (!window.confirm('Run this recurring transaction now?')) {
      return;
    }

    try {
      await api.post(`/recurring-transactions/${id}/run`);
      toast.success('Transaction created successfully');
      fetchRecurringTransactions();
    } catch (error) {
      console.error('Failed to run transaction:', error);
      toast.error('Failed to create transaction');
    }
  };

  const filteredTransactions = transactions.filter((txn) =>
    txn.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    };
    return labels[frequency] || frequency;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading recurring transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recurring Transactions</h1>
          <p className="text-gray-600 mt-2">Automate recurring invoices and bills</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Recurring Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Templates</p>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {transactions.filter(t => t.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Paused</p>
            <p className="text-2xl font-bold text-orange-600">
              {transactions.filter(t => !t.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Runs</p>
            <p className="text-2xl font-bold">
              {transactions.reduce((sum, t) => sum + t.runCount, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recurring Templates</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recurring transactions found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Template</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Party</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Frequency</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Next Run</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Runs</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((txn) => (
                      <tr key={txn.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{txn.templateName}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            txn.type === 'invoice' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {txn.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">{txn.customerName || txn.supplierName}</td>
                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(txn.amount)}</td>
                        <td className="py-3 px-4">{getFrequencyLabel(txn.frequency)}</td>
                        <td className="py-3 px-4 text-sm">{formatDate(txn.nextRunDate)}</td>
                        <td className="py-3 px-4 text-center">{txn.runCount}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            txn.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {txn.isActive ? 'Active' : 'Paused'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(txn.id, txn.isActive)}
                              title={txn.isActive ? 'Pause' : 'Activate'}
                            >
                              {txn.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRunNow(txn.id)}
                              title="Run Now"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTransaction(txn);
                                setIsModalOpen(true);
                              }}
                              title="Edit"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(txn.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length > pageSize && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={filteredTransactions.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
