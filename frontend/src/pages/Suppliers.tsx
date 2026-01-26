import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Plus, Search, Mail, Phone, Edit, Download, Trash2 } from "lucide-react";
import { Pagination } from "../components/ui/Pagination";
import { SupplierModal } from "../components/suppliers/SupplierModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { exportToCSV } from "../lib/export";
import toast from "react-hot-toast";
import type { Supplier } from "../types";

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const companyId = "c5f61904-b52b-4e97-a1a7-1164cd5556d2";

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get<{ suppliers: Supplier[] }>(`/suppliers?companyId=${companyId}`);
      setSuppliers(response.data.suppliers);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = () => {
    setSelectedSupplier(undefined);
    setIsModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSupplier(undefined);
  };

  const handleSuccess = () => {
    fetchSuppliers();
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/suppliers/${supplierToDelete.id}`);
      toast.success('Supplier deleted successfully');
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      toast.error('Failed to delete supplier');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleExport = () => {
    exportToCSV(
      filteredSuppliers,
      'suppliers',
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
        <div className="text-lg text-gray-600">Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-2">Manage your supplier database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleCreateSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            New Supplier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Suppliers</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Suppliers</p>
                <p className="text-2xl font-bold">
                  {suppliers.filter(s => s.isActive).length}
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
                <p className="text-sm text-gray-600">Inactive Suppliers</p>
                <p className="text-2xl font-bold">
                  {suppliers.filter(s => !s.isActive).length}
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
              placeholder="Search suppliers by name, code, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      <p className="text-sm text-gray-600 font-mono">{supplier.code}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      supplier.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {supplier.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {supplier.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <p className="text-gray-600 text-xs mt-2 line-clamp-2">
                        {supplier.address}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-sm">
                      {supplier.paymentTerms && (
                        <p className="text-gray-600">
                          Terms: <span className="font-semibold">{supplier.paymentTerms} days</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteClick(supplier)}
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
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No suppliers found
            </div>
          )}
          
          {filteredSuppliers.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredSuppliers.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        supplier={selectedSupplier}
        companyId={companyId}
      />

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${supplierToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
