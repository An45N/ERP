import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Plus, Search, Edit, Building2, Users, CheckCircle, XCircle } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";
import { formatDate } from "../../lib/utils";

interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

export function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get("/companies");
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/companies/${companyId}`, { isActive: !currentStatus });
      toast.success(`Company ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchCompanies();
    } catch (error) {
      console.error("Failed to update company status:", error);
      toast.error("Failed to update company status");
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Management</h2>
          <p className="text-gray-600 mt-1">Manage multiple companies (multi-tenant)</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold">{companies.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Companies</p>
                <p className="text-2xl font-bold">
                  {companies.filter(c => c.isActive).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">
                  {companies.reduce((sum, c) => sum + c.userCount, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Company Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Currency</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Users</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{company.name}</td>
                    <td className="py-3 px-4">{company.email}</td>
                    <td className="py-3 px-4">{company.phone}</td>
                    <td className="py-3 px-4">{company.currency}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        {company.userCount}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        company.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {company.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(company.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(company.id, company.isActive)}
                        >
                          {company.isActive ? (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No companies found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
