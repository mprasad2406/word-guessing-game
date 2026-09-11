import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { LoadingScreen } from "../components/common/LoadingScreen";
import { useAuth } from "../context/AuthContext";

export function RoleBasedRoute({ allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Verifying permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
