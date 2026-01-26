import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  Users, 
  Shield, 
  FileText, 
  Settings as SettingsIcon,
  Building2,
  Activity
} from "lucide-react";

export function AdminLayout() {
  const location = useLocation();

  const adminNavigation = [
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Roles & Permissions", href: "/admin/roles", icon: Shield },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
    { name: "Companies", href: "/admin/companies", icon: Building2 },
    { name: "System Settings", href: "/admin/system-settings", icon: SettingsIcon },
    { name: "System Health", href: "/admin/system-health", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
            <p className="text-sm text-gray-600 mt-1">Manage users, permissions, and system settings</p>
          </div>
          <nav className="flex space-x-8 -mb-px">
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Outlet />
      </div>
    </div>
  );
}
