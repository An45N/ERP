import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Plus, Search } from "lucide-react";
import type { Account } from "../types";

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const companyId = "c5f61904-b52b-4e97-a1a7-1164cd5556d2"; // From your backend
      const response = await api.get<{ accounts: Account[] }>(`/accounts?companyId=${companyId}`);
      setAccounts(response.data.accounts);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || account.type === filterType;
    return matchesSearch && matchesType;
  });

  const accountTypes = ["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-600 mt-2">Manage your general ledger accounts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {accountTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    filterType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{account.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{account.name}</div>
                      {account.description && (
                        <div className="text-sm text-gray-600">{account.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.type === "ASSET" ? "bg-blue-100 text-blue-800" :
                        account.type === "LIABILITY" ? "bg-red-100 text-red-800" :
                        account.type === "EQUITY" ? "bg-purple-100 text-purple-800" :
                        account.type === "REVENUE" ? "bg-green-100 text-green-800" :
                        "bg-orange-100 text-orange-800"
                      }`}>
                        {account.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{account.category}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAccounts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No accounts found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
