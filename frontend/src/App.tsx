import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Accounts } from "./pages/Accounts";
import { JournalEntries } from "./pages/JournalEntries";
import { Customers } from "./pages/Customers";
import { Suppliers } from "./pages/Suppliers";
import { Invoices } from "./pages/Invoices";
import { Bills } from "./pages/Bills";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AdminRoute } from "./components/auth/AdminRoute";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminUsers } from "./pages/admin/Users";
import { AdminRoles } from "./pages/admin/Roles";
import { AdminAuditLogs } from "./pages/admin/AuditLogs";
import { AdminCompanies } from "./pages/admin/Companies";
import { AdminSystemSettings } from "./pages/admin/SystemSettings";
import { AdminSystemHealth } from "./pages/admin/SystemHealth";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster />
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Accounts />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal-entries"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <JournalEntries />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Customers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suppliers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Invoices />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bills"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Bills />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="settings" element={<AdminSystemSettings />} />
          <Route path="health" element={<AdminSystemHealth />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
