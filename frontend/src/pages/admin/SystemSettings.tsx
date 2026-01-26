import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Save, Database, Mail, Bell, Lock, Globe } from "lucide-react";
import toast from "react-hot-toast";

export function AdminSystemSettings() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Email Settings
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    emailFrom: "noreply@company.com",
    
    // System Settings
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    passwordMinLength: "8",
    requirePasswordChange: true,
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: "daily",
    backupRetention: "30",
    
    // Notification Settings
    enableEmailNotifications: true,
    notifyOnInvoiceCreate: true,
    notifyOnBillApproval: true,
    
    // Regional Settings
    defaultCurrency: "MUR",
    defaultTimezone: "Indian/Mauritius",
    dateFormat: "DD/MM/YYYY",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // await api.put("/system/settings", settings);
      toast.success("System settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600 mt-1">Configure global system settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Email Configuration</CardTitle>
                <p className="text-sm text-gray-600 mt-1">SMTP settings for outgoing emails</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <Input
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <Input
                type="number"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username
              </label>
              <Input
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password
              </label>
              <Input
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email
              </label>
              <Input
                type="email"
                value={settings.emailFrom}
                onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle>Security Settings</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Authentication and access control</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Login Attempts
              </label>
              <Input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Min Length
              </label>
              <Input
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => setSettings({ ...settings, passwordMinLength: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requirePasswordChange"
                checked={settings.requirePasswordChange}
                onChange={(e) => setSettings({ ...settings, requirePasswordChange: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="requirePasswordChange" className="text-sm font-medium text-gray-700">
                Require password change on first login
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Database className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Backup Settings</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Automated backup configuration</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoBackup"
                checked={settings.autoBackup}
                onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="autoBackup" className="text-sm font-medium text-gray-700">
                Enable automatic backups
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Frequency
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retention Period (days)
              </label>
              <Input
                type="number"
                value={settings.backupRetention}
                onChange={(e) => setSettings({ ...settings, backupRetention: e.target.value })}
              />
            </div>
            <Button variant="outline" className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Backup Now
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle>Notification Settings</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Email notification preferences</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableEmailNotifications"
                checked={settings.enableEmailNotifications}
                onChange={(e) => setSettings({ ...settings, enableEmailNotifications: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="enableEmailNotifications" className="text-sm font-medium text-gray-700">
                Enable email notifications
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyOnInvoiceCreate"
                checked={settings.notifyOnInvoiceCreate}
                onChange={(e) => setSettings({ ...settings, notifyOnInvoiceCreate: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                disabled={!settings.enableEmailNotifications}
              />
              <label htmlFor="notifyOnInvoiceCreate" className="text-sm font-medium text-gray-700">
                Notify on invoice creation
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyOnBillApproval"
                checked={settings.notifyOnBillApproval}
                onChange={(e) => setSettings({ ...settings, notifyOnBillApproval: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                disabled={!settings.enableEmailNotifications}
              />
              <label htmlFor="notifyOnBillApproval" className="text-sm font-medium text-gray-700">
                Notify on bill approval
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Regional Settings</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Localization and formatting</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Currency
                </label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
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
                  Default Timezone
                </label>
                <select
                  value={settings.defaultTimezone}
                  onChange={(e) => setSettings({ ...settings, defaultTimezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Indian/Mauritius">Indian/Mauritius (UTC+4)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
