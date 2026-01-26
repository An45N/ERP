import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Plus, Search, CheckCircle, DollarSign, Edit, ArrowUpDown, ArrowUp, ArrowDown, Download, Trash2 } from "lucide-react";
import { Pagination } from "../components/ui/Pagination";
import { BillModal } from "../components/bills/BillModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { formatDate, formatCurrency } from "../lib/utils";
import toast from "react-hot-toast";
import { exportToCSV, formatCurrencyForExport, formatDateForExport } from "../lib/export";
import type { Bill } from "../types";

export function Bills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof Bill | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [deleting, setDeleting] = useState(false);
  const companyId = "c5f61904-b52b-4e97-a1a7-1164cd5556d2";

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await api.get<{ bills: Bill[] }>(`/bills?companyId=${companyId}`);
      setBills(response.data.bills);
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = () => {
    setSelectedBill(undefined);
    setIsModalOpen(true);
  };

  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBill(undefined);
  };

  const handleSuccess = () => {
    fetchBills();
  };

  const handleApprove = async (billId: string) => {
    try {
      await api.post(`/bills/${billId}/approve`);
      fetchBills();
    } catch (error) {
      console.error("Failed to approve bill:", error);
    }
  };

  const handleDeleteClick = (bill: Bill) => {
    setBillToDelete(bill);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!billToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/bills/${billToDelete.id}`);
      toast.success('Bill deleted successfully');
      setDeleteDialogOpen(false);
      setBillToDelete(null);
      fetchBills();
    } catch (error) {
      console.error('Failed to delete bill:', error);
      toast.error('Failed to delete bill');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBillToDelete(null);
  };

  const handleSort = (field: keyof Bill) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: keyof Bill) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1 inline" /> : 
      <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  const filteredBills = bills.filter((bill) => {
    const matchesSearch = 
      bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || bill.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedBills = [...filteredBills].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    if (sortField === 'billDate' || sortField === 'dueDate') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedBills.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBills = sortedBills.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const exportData = sortedBills.map(bill => ({
      billNumber: bill.billNumber,
      supplierName: bill.supplier?.name || 'N/A',
      billDate: formatDateForExport(bill.billDate),
      dueDate: formatDateForExport(bill.dueDate),
      total: formatCurrencyForExport(bill.total),
      balanceAmount: formatCurrencyForExport(bill.balanceAmount),
      status: bill.status,
    }));

    exportToCSV(
      exportData,
      'bills',
      [
        { key: 'billNumber', label: 'Bill #' },
        { key: 'supplierName', label: 'Supplier' },
        { key: 'billDate', label: 'Bill Date' },
        { key: 'dueDate', label: 'Due Date' },
        { key: 'total', label: 'Total' },
        { key: 'balanceAmount', label: 'Balance' },
        { key: 'status', label: 'Status' },
      ]
    );
  };

  const statuses = ["ALL", "DRAFT", "APPROVED", "PARTIAL", "PAID", "OVERDUE"];

  const totalExpenses = bills.reduce((sum, bill) => sum + bill.total, 0);
  const totalOutstanding = bills
    .filter(bill => bill.status !== "PAID")
    .reduce((sum, bill) => sum + bill.balanceAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading bills...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600 mt-2">Manage supplier bills and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleCreateBill}>
            <Plus className="h-4 w-4 mr-2" />
            New Bill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold">{bills.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Bills</p>
                <p className="text-2xl font-bold">
                  {bills.filter(bill => bill.status === "PAID").length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    filterStatus === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('billNumber')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Bill # {getSortIcon('billNumber')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Supplier</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('billDate')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Date {getSortIcon('billDate')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('dueDate')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Due Date {getSortIcon('dueDate')}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('total')}
                      className="flex items-center hover:text-gray-900 ml-auto"
                    >
                      Total {getSortIcon('total')}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('balanceAmount')}
                      className="flex items-center hover:text-gray-900 ml-auto"
                    >
                      Balance {getSortIcon('balanceAmount')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('status')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Status {getSortIcon('status')}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBills.map((bill) => (
                  <tr key={bill.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{bill.billNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{bill.supplier?.name || "N/A"}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatDate(bill.billDate)}</td>
                    <td className="py-3 px-4 text-sm">{formatDate(bill.dueDate)}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(bill.total)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(bill.balanceAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        bill.status === "PAID" ? "bg-green-100 text-green-800" :
                        bill.status === "APPROVED" ? "bg-blue-100 text-blue-800" :
                        bill.status === "PARTIAL" ? "bg-yellow-100 text-yellow-800" :
                        bill.status === "OVERDUE" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {bill.status === "DRAFT" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditBill(bill)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        {bill.status === "DRAFT" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleApprove(bill.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        )}
                        {bill.status !== "PAID" && bill.status !== "DRAFT" && (
                          <Button variant="outline" size="sm">
                            Record Payment
                          </Button>
                        )}
                        {bill.status === "DRAFT" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick(bill)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            {sortedBills.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No bills found
              </div>
            )}
          
          {sortedBills.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={sortedBills.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <BillModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        bill={selectedBill}
        companyId={companyId}
      />

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Bill"
        message={`Are you sure you want to delete bill "${billToDelete?.billNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
