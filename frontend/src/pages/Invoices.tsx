import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Plus, Search, Send, DollarSign, Edit, ArrowUpDown, ArrowUp, ArrowDown, Download, Trash2, Filter } from "lucide-react";
import { Pagination } from "../components/ui/Pagination";
import { InvoiceModal } from "../components/invoices/InvoiceModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { DateRangeFilter } from "../components/ui/DateRangeFilter";
import { DropdownFilter } from "../components/ui/DropdownFilter";
import { formatDate, formatCurrency } from "../lib/utils";
import toast from "react-hot-toast";
import { exportToCSV, formatCurrencyForExport, formatDateForExport } from "../lib/export";
import { useCompanyStore } from "../store/companyStore";
import type { Invoice } from "../types";

export function Invoices() {
  const companyId = useCompanyStore((state) => state.companyId);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof Invoice | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Advanced filtering
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  
  // Row selection
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get(`/customers?companyId=${companyId}`);
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get<{ invoices: Invoice[] }>(`/invoices?companyId=${companyId}`);
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    setSelectedInvoice(undefined);
    setIsModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedInvoice(undefined);
  };

  const handleSuccess = () => {
    fetchInvoices();
  };

  const handleSend = async (invoiceId: string) => {
    try {
      await api.post(`/invoices/${invoiceId}/send`);
      fetchInvoices();
    } catch (error) {
      console.error("Failed to send invoice:", error);
    }
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/invoices/${invoiceToDelete.id}`);
      toast.success('Invoice deleted successfully');
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  const toggleRowSelection = (invoiceId: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(invoiceId)) {
      newSelection.delete(invoiceId);
    } else {
      newSelection.add(invoiceId);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === paginatedInvoices.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedInvoices.map(inv => inv.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      toast.error('No invoices selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedRows.size} selected invoice(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedRows).map(id => api.delete(`/invoices/${id}`))
      );
      toast.success(`${selectedRows.size} invoice(s) deleted successfully`);
      setSelectedRows(new Set());
      fetchInvoices();
    } catch (error) {
      console.error('Failed to delete invoices:', error);
      toast.error('Failed to delete some invoices');
    }
  };

  const handleBulkExport = () => {
    const selectedInvoices = invoices.filter(inv => selectedRows.has(inv.id));
    if (selectedInvoices.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    const exportData = selectedInvoices.map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer?.name || "N/A",
      invoiceDate: formatDateForExport(invoice.invoiceDate),
      dueDate: formatDateForExport(invoice.dueDate),
      total: formatCurrencyForExport(invoice.total),
      balance: formatCurrencyForExport(invoice.balanceAmount),
      status: invoice.status,
    }));

    exportToCSV(
      exportData,
      `selected-invoices-${Date.now()}`,
      [
        { key: 'invoiceNumber', label: 'Invoice #' },
        { key: 'customerName', label: 'Customer' },
        { key: 'invoiceDate', label: 'Invoice Date' },
        { key: 'dueDate', label: 'Due Date' },
        { key: 'total', label: 'Total' },
        { key: 'balance', label: 'Balance' },
        { key: 'status', label: 'Status' },
      ]
    );
    toast.success(`Exported ${selectedInvoices.length} invoice(s)`);
  };

  const handleSort = (field: keyof Invoice) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: keyof Invoice) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1 inline" /> : 
      <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || invoice.status === filterStatus;
    
    // Advanced filters
    const matchesDateRange = 
      (!filterStartDate || new Date(invoice.invoiceDate) >= new Date(filterStartDate)) &&
      (!filterEndDate || new Date(invoice.invoiceDate) <= new Date(filterEndDate));
    const matchesCustomer = !filterCustomer || invoice.customer?.id === filterCustomer;
    
    return matchesSearch && matchesStatus && matchesDateRange && matchesCustomer;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    if (sortField === 'invoiceDate' || sortField === 'dueDate') {
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

  const totalPages = Math.ceil(sortedInvoices.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedInvoices = sortedInvoices.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const exportData = sortedInvoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.name || 'N/A',
      invoiceDate: formatDateForExport(inv.invoiceDate),
      dueDate: formatDateForExport(inv.dueDate),
      total: formatCurrencyForExport(inv.total),
      balanceAmount: formatCurrencyForExport(inv.balanceAmount),
      status: inv.status,
    }));

    exportToCSV(
      exportData,
      'invoices',
      [
        { key: 'invoiceNumber', label: 'Invoice #' },
        { key: 'customerName', label: 'Customer' },
        { key: 'invoiceDate', label: 'Invoice Date' },
        { key: 'dueDate', label: 'Due Date' },
        { key: 'total', label: 'Total' },
        { key: 'balanceAmount', label: 'Balance' },
        { key: 'status', label: 'Status' },
      ]
    );
  };

  const statuses = ["ALL", "DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE"];

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalOutstanding = invoices
    .filter(inv => inv.status !== "PAID")
    .reduce((sum, inv) => sum + inv.balanceAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">Manage customer invoices and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleCreateInvoice}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
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
                <p className="text-sm text-gray-600">Paid Invoices</p>
                <p className="text-2xl font-bold">
                  {invoices.filter(inv => inv.status === "PAID").length}
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
                placeholder="Search invoices..."
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="ml-2"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <DateRangeFilter
                startDate={filterStartDate}
                endDate={filterEndDate}
                onStartDateChange={setFilterStartDate}
                onEndDateChange={setFilterEndDate}
                onClear={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                label="Invoice Date Range"
              />
              <DropdownFilter
                value={filterCustomer}
                onChange={setFilterCustomer}
                options={customers.map(c => ({ value: c.id, label: c.name }))}
                label="Customer"
                placeholder="All Customers"
              />
            </div>
          )}

          {selectedRows.size > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border-t">
              <span className="text-sm font-medium text-blue-900">
                {selectedRows.size} invoice(s) selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRows(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedInvoices.length && paginatedInvoices.length > 0}
                      onChange={toggleAllRows}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('invoiceNumber')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Invoice # {getSortIcon('invoiceNumber')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('invoiceDate')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Date {getSortIcon('invoiceDate')}
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
                {paginatedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(invoice.id)}
                        onChange={() => toggleRowSelection(invoice.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">{invoice.invoiceNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{invoice.customer?.name || "N/A"}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatDate(invoice.invoiceDate)}</td>
                    <td className="py-3 px-4 text-sm">{formatDate(invoice.dueDate)}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(invoice.balanceAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === "PAID" ? "bg-green-100 text-green-800" :
                        invoice.status === "SENT" ? "bg-blue-100 text-blue-800" :
                        invoice.status === "PARTIAL" ? "bg-yellow-100 text-yellow-800" :
                        invoice.status === "OVERDUE" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {invoice.status === "DRAFT" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditInvoice(invoice)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        {invoice.status === "DRAFT" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSend(invoice.id)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        )}
                        {invoice.status !== "PAID" && invoice.status !== "DRAFT" && (
                          <Button variant="outline" size="sm">
                            Record Payment
                          </Button>
                        )}
                        {invoice.status === "DRAFT" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick(invoice)}
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
            {sortedInvoices.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No invoices found
              </div>
            )}
          
          {sortedInvoices.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={sortedInvoices.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        invoice={selectedInvoice}
        companyId={companyId}
      />

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${invoiceToDelete?.invoiceNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
