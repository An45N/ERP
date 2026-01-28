import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Building2, Save, User } from "lucide-react";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { useCompanyStore } from "../store/companyStore";
import { CompanySelector } from "../components/CompanySelector";

interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  fiscalYearStart: string;
}

export function Settings() {
  const companyId = useCompanyStore((state) => state.companyId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<CompanySettings>({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxId: "",
    currency: "MUR",
    fiscalYearStart: "01-01",
  });

  useEffect(() => {
    if (companyId) {
      fetchSettings();
    } else {
      setLoading(false);
      setError("No company selected");
    }
  }, [companyId]);

  const fetchSettings = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.get(`/companies/${companyId}`);
      if (response.data) {
        setSettings({
          name: response.data.name || "",
          address: response.data.address || "",
          phone: response.data.phone || "",
          email: response.data.email || "",
          taxId: response.data.taxId || "",
          currency: response.data.currency || "MUR",
          fiscalYearStart: response.data.fiscalYearStart || "01-01",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      const message = error instanceof Error ? error.message : "Failed to load settings";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/companies/${companyId}`, settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-lg text-gray-600">Loading settings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your company settings and preferences</p>
          </div>
          <div className="flex-shrink-0">
            <CompanySelector />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-lg text-red-600">{error}</div>
          {companyId ? (
            <Button onClick={fetchSettings} variant="outline">
              Try Again
            </Button>
          ) : (
            <p className="text-gray-500">Please select a company from the dropdown above</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your company settings and preferences</p>
          </div>
          <div className="flex-shrink-0">
            <CompanySelector />
          </div>
        </div>
        {companyId && (
          <p className="text-sm text-gray-500">
            Company ID: {companyId}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle>Company Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <Input
                  value={settings.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={settings.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Enter company address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax ID / VAT Number
                </label>
                <Input
                  value={settings.taxId}
                  onChange={(e) => handleChange("taxId", e.target.value)}
                  placeholder="Enter tax ID"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle>System Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="MUR">MUR - Mauritian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiscal Year Start (MM-DD)
                </label>
                <Input
                  value={settings.fiscalYearStart}
                  onChange={(e) => handleChange("fiscalYearStart", e.target.value)}
                  placeholder="MM-DD (e.g., 01-01)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: MM-DD (e.g., 01-01 for January 1st)
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">System Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Version: 1.0.0</p>
                  <p>Last Updated: January 26, 2026</p>
                  <p>Company ID: {companyId}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-32">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
