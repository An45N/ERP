import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Plus, Edit, Trash2, Shield } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export function AdminRoles() {
  const [roles] = useState<Role[]>([
    {
      id: "1",
      name: "Administrator",
      description: "Full system access with all permissions",
      permissions: ["*"],
      userCount: 2,
    },
    {
      id: "2",
      name: "Accountant",
      description: "Manage financial transactions and reports",
      permissions: ["invoices.*", "bills.*", "reports.*", "journal.*"],
      userCount: 5,
    },
    {
      id: "3",
      name: "Viewer",
      description: "Read-only access to financial data",
      permissions: ["invoices.read", "bills.read", "reports.read"],
      userCount: 3,
    },
  ]);

  const permissionCategories = [
    {
      category: "Invoices",
      permissions: [
        { id: "invoices.read", name: "View Invoices", description: "View invoice list and details" },
        { id: "invoices.create", name: "Create Invoices", description: "Create new invoices" },
        { id: "invoices.update", name: "Edit Invoices", description: "Modify existing invoices" },
        { id: "invoices.delete", name: "Delete Invoices", description: "Delete invoices" },
        { id: "invoices.send", name: "Send Invoices", description: "Send invoices to customers" },
      ],
    },
    {
      category: "Bills",
      permissions: [
        { id: "bills.read", name: "View Bills", description: "View bill list and details" },
        { id: "bills.create", name: "Create Bills", description: "Create new bills" },
        { id: "bills.update", name: "Edit Bills", description: "Modify existing bills" },
        { id: "bills.delete", name: "Delete Bills", description: "Delete bills" },
        { id: "bills.approve", name: "Approve Bills", description: "Approve bills for payment" },
      ],
    },
    {
      category: "Reports",
      permissions: [
        { id: "reports.read", name: "View Reports", description: "Generate and view financial reports" },
        { id: "reports.export", name: "Export Reports", description: "Export reports to PDF/Excel" },
      ],
    },
    {
      category: "Administration",
      permissions: [
        { id: "users.read", name: "View Users", description: "View user list" },
        { id: "users.manage", name: "Manage Users", description: "Create, edit, and delete users" },
        { id: "roles.manage", name: "Manage Roles", description: "Create and modify roles" },
        { id: "settings.manage", name: "Manage Settings", description: "Modify system settings" },
        { id: "audit.read", name: "View Audit Logs", description: "View system audit logs" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-gray-600 mt-1">Define roles and assign permissions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm, idx) => (
                      <span
                        key={idx}
                        className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{role.userCount}</span> users assigned
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={role.name === "Administrator"}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Permissions</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            System permissions that can be assigned to roles
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {permissionCategories.map((category) => (
              <div key={category.category}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {category.category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{permission.name}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {permission.description}
                          </p>
                          <code className="text-xs text-gray-500 mt-2 inline-block">
                            {permission.id}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
