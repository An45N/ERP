import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Pagination } from "../components/ui/Pagination";
import { Plus, Search, Mail, Phone, Edit, Download, Trash2 } from "lucide-react";
import { CustomerModal } from "../components/customers/CustomerModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { exportToCSV } from "../lib/export";
import toast from "react-hot-toast";
import type { Customer } from "../types";

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const companyId = "c5f61904-b52b-4e97-a1a7-1164cd5556d2";

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get<{ customers: Customer[] }>(`/customers?companyId=${companyId}`);
      setCustomers(response.data.customers);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = () => {
    setSelectedCustomer(undefined);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCustomer(undefined);
  };

  const handleSuccess = () => {
    fetchCustomers();
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/customers/${customerToDelete.id}`);
      toast.success('Customer deleted successfully');
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleExport = () => {
    exportToCSV(
      filteredCustomers,
      'customers',
      [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'address', label: 'Address' },
        { key: 'taxId', label: 'Tax ID' },
        { key: 'paymentTerms', label: 'Payment Terms (days)' },
        { key: 'isActive', label: 'Status' },
      ]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage your customer database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleCreateCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.isActive).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Customers</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => !c.isActive).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-2xl">⏸️</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers by name, code, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <p className="text-sm text-gray-600 font-mono">{customer.code}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {customer.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {customer.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.address && (
                      <p className="text-gray-600 text-xs mt-2 line-clamp-2">
                        {customer.address}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-sm">
                      {customer.creditLimit && (
                        <p className="text-gray-600">
                          Credit: <span className="font-semibold">{customer.creditLimit}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteClick(customer)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No customers found
            </div>
          )}
          
          {filteredCustomers.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredCustomers.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        customer={selectedCustomer}
        companyId={companyId}
      />

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customerToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
