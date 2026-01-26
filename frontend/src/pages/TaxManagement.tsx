import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Plus, Edit, Trash2, Search, FileText, DollarSign } from "lucide-react";
import { api } from "../lib/api";
import { useCompanyStore } from "../store/companyStore";
import { formatCurrency, formatDate } from "../lib/utils";
import toast from "react-hot-toast";
import { Pagination } from "../components/ui/Pagination";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface TaxTransaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  type: 'sale' | 'purchase';
}

interface TaxSummary {
  totalSales: number;
  totalPurchases: number;
  outputVAT: number;
  inputVAT: number;
  netVAT: number;
}

export function TaxManagement() {
  const companyId = useCompanyStore((state) => state.companyId);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [transactions, setTransactions] = useState<TaxTransaction[]>([]);
  const [summary, setSummary] = useState<TaxSummary>({
    totalSales: 0,
    totalPurchases: 0,
    outputVAT: 0,
    inputVAT: 0,
    netVAT: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<TaxRate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetchTaxData();
  }, [companyId]);

  const fetchTaxData = async () => {
    try {
      const [ratesRes, transactionsRes, summaryRes] = await Promise.all([
        api.get(`/tax/rates?companyId=${companyId}`),
        api.get(`/tax/transactions?companyId=${companyId}`),
        api.get(`/tax/summary?companyId=${companyId}`),
      ]);

      setTaxRates(ratesRes.data.rates || []);
      setTransactions(transactionsRes.data.transactions || []);
      setSummary(summaryRes.data || summary);
    } catch (error) {
      console.error("Failed to fetch tax data:", error);
      toast.error("Failed to load tax data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRate = () => {
    setSelectedRate(null);
    setFormData({
      name: "",
      rate: "",
      description: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEditRate = (rate: TaxRate) => {
    setSelectedRate(rate);
    setFormData({
      name: rate.name,
      rate: rate.rate.toString(),
      description: rate.description,
      isActive: rate.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSaveRate = async () => {
    try {
      const payload = {
        ...formData,
        rate: parseFloat(formData.rate),
        companyId,
      };

      if (selectedRate) {
        await api.put(`/tax/rates/${selectedRate.id}`, payload);
        toast.success("Tax rate updated successfully");
      } else {
        await api.post("/tax/rates", payload);
        toast.success("Tax rate created successfully");
      }

      setIsModalOpen(false);
      fetchTaxData();
    } catch (error) {
      console.error("Failed to save tax rate:", error);
      toast.error("Failed to save tax rate");
    }
  };

  const handleDeleteRate = async (rateId: string) => {
    if (!window.confirm("Are you sure you want to delete this tax rate?")) {
      return;
    }

    try {
      await api.delete(`/tax/rates/${rateId}`);
      toast.success("Tax rate deleted successfully");
      fetchTaxData();
    } catch (error) {
      console.error("Failed to delete tax rate:", error);
      toast.error("Failed to delete tax rate");
    }
  };

  const filteredTransactions = transactions.filter((txn) =>
    txn.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading tax data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Management</h1>
          <p className="text-gray-600 mt-2">Manage tax rates and view tax transactions</p>
        </div>
        <Button onClick={handleCreateRate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tax Rate
        </Button>
      </div>

      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalSales)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalPurchases)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Output VAT</p>
                <p className="text-xl font-bold">{formatCurrency(summary.outputVAT)}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Input VAT</p>
                <p className="text-xl font-bold">{formatCurrency(summary.inputVAT)}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net VAT</p>
                <p className={`text-xl font-bold ${summary.netVAT >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(summary.netVAT))}
                </p>
                <p className="text-xs text-gray-600">{summary.netVAT >= 0 ? 'Payable' : 'Refundable'}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {taxRates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tax rates configured
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taxRates.map((rate) => (
                <div
                  key={rate.id}
                  className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{rate.name}</h3>
                      <p className="text-2xl font-bold text-primary">{rate.rate}%</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        rate.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {rate.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{rate.description}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRate(rate)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRate(rate.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tax Transactions</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
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
              No tax transactions found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Reference</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Taxable Amount</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Tax Rate</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Tax Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((txn) => (
                      <tr key={txn.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{formatDate(txn.date)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              txn.type === "sale"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {txn.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{txn.reference}</td>
                        <td className="py-3 px-4">{txn.description}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(txn.taxableAmount)}</td>
                        <td className="py-3 px-4 text-right">{txn.taxRate}%</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(txn.taxAmount)}
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

      {/* Tax Rate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedRate ? "Edit Tax Rate" : "Add Tax Rate"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard VAT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="e.g., 15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveRate} className="flex-1">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
