import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Plus, Edit, Trash2, Search, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useCompanyStore } from "../store/companyStore";
import { formatDate } from "../lib/utils";
import toast from "react-hot-toast";
import { Pagination } from "../components/ui/Pagination";

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  source: string;
  isActive: boolean;
  createdAt: string;
}

interface CurrencyPair {
  from: string;
  to: string;
  currentRate: number;
  previousRate: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export function ExchangeRates() {
  const companyId = useCompanyStore((state) => state.companyId);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [currencyPairs, setCurrencyPairs] = useState<CurrencyPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);
  const [formData, setFormData] = useState({
    fromCurrency: "MUR",
    toCurrency: "USD",
    rate: "",
    effectiveDate: new Date().toISOString().split('T')[0],
    source: "Manual",
  });

  const currencies = [
    { code: "MUR", name: "Mauritian Rupee", symbol: "Rs" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "ZAR", name: "South African Rand", symbol: "R" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  ];

  useEffect(() => {
    fetchExchangeRates();
    fetchCurrencyPairs();
  }, [companyId]);

  const fetchExchangeRates = async () => {
    try {
      const response = await api.get(`/exchange-rates?companyId=${companyId}`);
      setRates(response.data.rates || []);
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
      toast.error("Failed to load exchange rates");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencyPairs = async () => {
    try {
      const response = await api.get(`/exchange-rates/pairs?companyId=${companyId}`);
      setCurrencyPairs(response.data.pairs || []);
    } catch (error) {
      console.error("Failed to fetch currency pairs:", error);
    }
  };

  const handleCreateRate = () => {
    setSelectedRate(null);
    setFormData({
      fromCurrency: "MUR",
      toCurrency: "USD",
      rate: "",
      effectiveDate: new Date().toISOString().split('T')[0],
      source: "Manual",
    });
    setIsModalOpen(true);
  };

  const handleEditRate = (rate: ExchangeRate) => {
    setSelectedRate(rate);
    setFormData({
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate.toString(),
      effectiveDate: rate.effectiveDate.split('T')[0],
      source: rate.source,
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
        await api.put(`/exchange-rates/${selectedRate.id}`, payload);
        toast.success("Exchange rate updated successfully");
      } else {
        await api.post("/exchange-rates", payload);
        toast.success("Exchange rate created successfully");
      }

      setIsModalOpen(false);
      fetchExchangeRates();
      fetchCurrencyPairs();
    } catch (error) {
      console.error("Failed to save exchange rate:", error);
      toast.error("Failed to save exchange rate");
    }
  };

  const handleDeleteRate = async (rateId: string) => {
    if (!window.confirm("Are you sure you want to delete this exchange rate?")) {
      return;
    }

    try {
      await api.delete(`/exchange-rates/${rateId}`);
      toast.success("Exchange rate deleted successfully");
      fetchExchangeRates();
      fetchCurrencyPairs();
    } catch (error) {
      console.error("Failed to delete exchange rate:", error);
      toast.error("Failed to delete exchange rate");
    }
  };

  const handleRefreshRates = async () => {
    try {
      await api.post(`/exchange-rates/refresh?companyId=${companyId}`);
      toast.success("Exchange rates refreshed from external source");
      fetchExchangeRates();
      fetchCurrencyPairs();
    } catch (error) {
      console.error("Failed to refresh rates:", error);
      toast.error("Failed to refresh exchange rates");
    }
  };

  const filteredRates = rates.filter((rate) =>
    rate.fromCurrency.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.toCurrency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRates.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRates = filteredRates.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading exchange rates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exchange Rates</h1>
          <p className="text-gray-600 mt-2">Manage currency exchange rates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshRates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Rates
          </Button>
          <Button onClick={handleCreateRate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rate
          </Button>
        </div>
      </div>

      {/* Currency Pairs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currencyPairs.map((pair) => (
          <Card key={`${pair.from}-${pair.to}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-600">
                    {pair.from}/{pair.to}
                  </p>
                  <p className="text-2xl font-bold">{pair.currentRate.toFixed(4)}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  pair.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {pair.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(pair.changePercent).toFixed(2)}%
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Updated: {formatDate(pair.lastUpdated)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exchange Rates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exchange Rate History</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exchange rates found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">From</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">To</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Rate</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Effective Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRates.map((rate) => (
                      <tr key={rate.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{rate.fromCurrency}</td>
                        <td className="py-3 px-4 font-medium">{rate.toCurrency}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {rate.rate.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 text-sm">{formatDate(rate.effectiveDate)}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {rate.source}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rate.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {rate.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRate(rate)}
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRates.length > pageSize && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={filteredRates.length}
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

      {/* Exchange Rate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedRate ? "Edit Exchange Rate" : "Add Exchange Rate"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Currency
                  </label>
                  <select
                    value={formData.fromCurrency}
                    onChange={(e) => setFormData({ ...formData, fromCurrency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Currency
                  </label>
                  <select
                    value={formData.toCurrency}
                    onChange={(e) => setFormData({ ...formData, toCurrency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exchange Rate
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="e.g., 0.0250"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Date
                </label>
                <Input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Manual">Manual</option>
                  <option value="Bank of Mauritius">Bank of Mauritius</option>
                  <option value="XE.com">XE.com</option>
                  <option value="Bloomberg">Bloomberg</option>
                  <option value="Reuters">Reuters</option>
                </select>
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
