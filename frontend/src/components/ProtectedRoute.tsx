import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useCompanyStore } from "../store/companyStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requireCompany?: boolean;
}

export function ProtectedRoute({ children, requireCompany = true }: ProtectedRouteProps) {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { companyId } = useCompanyStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If company is required and not selected, redirect to company selection
  // (except if already on the select-company page)
  if (requireCompany && !companyId && location.pathname !== "/select-company") {
    return <Navigate to="/select-company" replace />;
  }

  return <>{children}</>;
}
