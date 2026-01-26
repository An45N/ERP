import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Building2, Save, User, Mail, Upload, Image, Plus, Edit, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { useCompanyStore } from "../store/companyStore";
import { useAuthStore } from "../store/authStore";

interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  fiscalYearStart: string;
  logo?: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  description: string;
  isActive: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'invoice' | 'bill' | 'statement' | 'reminder';
}

type SettingsTab = 'company' | 'profile' | 'tax' | 'email' | 'logo';

export function SettingsEnhanced() {
  const companyId = useCompanyStore((state) => state.companyId);
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Company Settings
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxId: "",
    currency: "MUR",
    fiscalYearStart: "01-01",
    logo: "",
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Tax Rates
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null);
  const [taxFormData, setTaxFormData] = useState({
    name: "",
    rate: "",
    description: "",
    isActive: true,
  });

  // Email Templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [emailFormData, setEmailFormData] = useState<{
    name: string;
    subject: string;
    body: string;
    type: 'invoice' | 'bill' | 'statement' | 'reminder';
  }>({
    name: "",
    subject: "",
    body: "",
    type: 'invoice',
  });

  // Logo Upload
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAllSettings();
  }, [companyId]);

  const fetchAllSettings = async () => {
    try {
      const [companyRes, taxRes, emailRes] = await Promise.all([
        api.get(`/companies/${companyId}`),
        api.get(`/tax/rates?companyId=${companyId}`),
        api.get(`/email-templates?companyId=${companyId}`),
      ]);

      if (companyRes.data) {
        setCompanySettings({
          name: companyRes.data.name || "",
          address: companyRes.data.address || "",
          phone: companyRes.data.phone || "",
          email: companyRes.data.email || "",
          taxId: companyRes.data.taxId || "",
          currency: companyRes.data.currency || "MUR",
          fiscalYearStart: companyRes.data.fiscalYearStart || "01-01",
          logo: companyRes.data.logo || "",
        });
        setLogoPreview(companyRes.data.logo || "");
      }

      setTaxRates(taxRes.data.rates || []);
      setEmailTemplates(emailRes.data.templates || []);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // Company Settings Handlers
  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await api.put(`/companies/${companyId}`, companySettings);
      toast.success("Company settings saved successfully");
    } catch (error) {
      console.error("Failed to save company settings:", error);
      toast.error("Failed to save company settings");
    } finally {
      setSaving(false);
    }
  };

  // User Profile Handlers
  const handleSaveProfile = async () => {
    if (userProfile.newPassword && userProfile.newPassword !== userProfile.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (userProfile.newPassword && userProfile.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
      };

      if (userProfile.newPassword) {
        payload.currentPassword = userProfile.currentPassword;
        payload.newPassword = userProfile.newPassword;
      }

      await api.put(`/users/${user?.id}`, payload);
      toast.success("Profile updated successfully");
      
      // Clear password fields
      setUserProfile({
        ...userProfile,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Tax Rate Handlers
  const handleCreateTaxRate = () => {
    setSelectedTaxRate(null);
    setTaxFormData({
      name: "",
      rate: "",
      description: "",
      isActive: true,
    });
    setTaxModalOpen(true);
  };

  const handleEditTaxRate = (rate: TaxRate) => {
    setSelectedTaxRate(rate);
    setTaxFormData({
      name: rate.name,
      rate: rate.rate.toString(),
      description: rate.description,
      isActive: rate.isActive,
    });
    setTaxModalOpen(true);
  };

  const handleSaveTaxRate = async () => {
    try {
      const payload = {
        ...taxFormData,
        rate: parseFloat(taxFormData.rate),
        companyId,
      };

      if (selectedTaxRate) {
        await api.put(`/tax/rates/${selectedTaxRate.id}`, payload);
        toast.success("Tax rate updated successfully");
      } else {
        await api.post("/tax/rates", payload);
        toast.success("Tax rate created successfully");
      }

      setTaxModalOpen(false);
      fetchAllSettings();
    } catch (error) {
      console.error("Failed to save tax rate:", error);
      toast.error("Failed to save tax rate");
    }
  };

  const handleDeleteTaxRate = async (rateId: string) => {
    if (!window.confirm("Are you sure you want to delete this tax rate?")) {
      return;
    }

    try {
      await api.delete(`/tax/rates/${rateId}`);
      toast.success("Tax rate deleted successfully");
      fetchAllSettings();
    } catch (error) {
      console.error("Failed to delete tax rate:", error);
      toast.error("Failed to delete tax rate");
    }
  };

  // Email Template Handlers
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setEmailFormData({
      name: "",
      subject: "",
      body: "",
      type: 'invoice',
    });
    setEmailModalOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEmailFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
    });
    setEmailModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const payload = {
        ...emailFormData,
        companyId,
      };

      if (selectedTemplate) {
        await api.put(`/email-templates/${selectedTemplate.id}`, payload);
        toast.success("Email template updated successfully");
      } else {
        await api.post("/email-templates", payload);
        toast.success("Email template created successfully");
      }

      setEmailModalOpen(false);
      fetchAllSettings();
    } catch (error) {
      console.error("Failed to save email template:", error);
      toast.error("Failed to save email template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm("Are you sure you want to delete this email template?")) {
      return;
    }

    try {
      await api.delete(`/email-templates/${templateId}`);
      toast.success("Email template deleted successfully");
      fetchAllSettings();
    } catch (error) {
      console.error("Failed to delete email template:", error);
      toast.error("Failed to delete email template");
    }
  };

  // Logo Upload Handler
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);
    formData.append('companyId', companyId);

    setUploading(true);
    try {
      const response = await api.post('/companies/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setLogoPreview(response.data.logoUrl);
      setCompanySettings({ ...companySettings, logo: response.data.logoUrl });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Failed to upload logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'company' as const, label: 'Company', icon: Building2 },
    { id: 'profile' as const, label: 'User Profile', icon: User },
    { id: 'tax' as const, label: 'Tax Rates', icon: Save },
    { id: 'email' as const, label: 'Email Templates', icon: Mail },
    { id: 'logo' as const, label: 'Logo', icon: Image },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your company and system settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Company Settings Tab */}
      {activeTab === 'company' && (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <Input
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <Input
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID
                  </label>
                  <Input
                    value={companySettings.taxId}
                    onChange={(e) => setCompanySettings({ ...companySettings, taxId: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={companySettings.currency}
                    onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
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
                    value={companySettings.fiscalYearStart}
                    onChange={(e) => setCompanySettings({ ...companySettings, fiscalYearStart: e.target.value })}
                    placeholder="01-01"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <Input
                      value={userProfile.firstName}
                      onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <Input
                      value={userProfile.lastName}
                      onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={userProfile.currentPassword}
                    onChange={(e) => setUserProfile({ ...userProfile, currentPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={userProfile.newPassword}
                    onChange={(e) => setUserProfile({ ...userProfile, newPassword: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={userProfile.confirmPassword}
                    onChange={(e) => setUserProfile({ ...userProfile, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      )}

      {/* Tax Rates Tab */}
      {activeTab === 'tax' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tax Rates</CardTitle>
              <Button onClick={handleCreateTaxRate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Rate
              </Button>
            </div>
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
                        onClick={() => handleEditTaxRate(rate)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTaxRate(rate.id)}
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
      )}

      {/* Email Templates Tab */}
      {activeTab === 'email' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Email Templates</CardTitle>
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {emailTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No email templates configured
              </div>
            ) : (
              <div className="space-y-4">
                {emailTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {template.type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Subject: {template.subject}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">{template.body}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logo Upload Tab */}
      {activeTab === 'logo' && (
        <Card>
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {logoPreview && (
                <div className="flex justify-center">
                  <div className="p-4 border rounded-lg">
                    <img
                      src={logoPreview}
                      alt="Company Logo"
                      className="max-w-xs max-h-48 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="text-center">
                <label htmlFor="logo-upload" className="cursor-pointer inline-block">
                  <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    {uploading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </>
                    )}
                  </div>
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-4">
                  Supported formats: JPG, PNG, SVG (Max 2MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tax Rate Modal */}
      {taxModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedTaxRate ? "Edit Tax Rate" : "Add Tax Rate"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <Input
                  value={taxFormData.name}
                  onChange={(e) => setTaxFormData({ ...taxFormData, name: e.target.value })}
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
                  value={taxFormData.rate}
                  onChange={(e) => setTaxFormData({ ...taxFormData, rate: e.target.value })}
                  placeholder="e.g., 15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  value={taxFormData.description}
                  onChange={(e) => setTaxFormData({ ...taxFormData, description: e.target.value })}
                  placeholder="Description"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={taxFormData.isActive}
                  onChange={(e) => setTaxFormData({ ...taxFormData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveTaxRate} className="flex-1">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setTaxModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Template Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedTemplate ? "Edit Email Template" : "Add Email Template"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <Input
                    value={emailFormData.name}
                    onChange={(e) => setEmailFormData({ ...emailFormData, name: e.target.value })}
                    placeholder="e.g., Invoice Email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={emailFormData.type}
                    onChange={(e) => setEmailFormData({ ...emailFormData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="invoice">Invoice</option>
                    <option value="bill">Bill</option>
                    <option value="statement">Statement</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <Input
                  value={emailFormData.subject}
                  onChange={(e) => setEmailFormData({ ...emailFormData, subject: e.target.value })}
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body
                </label>
                <textarea
                  value={emailFormData.body}
                  onChange={(e) => setEmailFormData({ ...emailFormData, body: e.target.value })}
                  placeholder="Email body content..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variables: {'{company_name}'}, {'{customer_name}'}, {'{invoice_number}'}, {'{amount}'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveTemplate} className="flex-1">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setEmailModalOpen(false)}
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
