import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { PlayerLayout } from "../layouts/PlayerLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { AdminHomePage } from "../pages/admin/AdminHomePage";
import { AdminReportsPage } from "../pages/admin/AdminReportsPage";
import { SettingsPage } from "../pages/admin/SettingsPage";
import { UserDetailPage } from "../pages/admin/UserDetailPage";
import { AdminMatchDetailPage } from "../pages/admin/AdminMatchDetailPage";
import { UserManagementPage } from "../pages/admin/UserManagementPage";
import { WordManagementPage } from "../pages/admin/WordManagementPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { NotFoundPage } from "../pages/errors/NotFoundPage";
import { ServerErrorPage } from "../pages/errors/ServerErrorPage";
import { UnauthorizedPage } from "../pages/errors/UnauthorizedPage";
import { ActiveGamePage } from "../pages/player/ActiveGamePage";
import { GameHistoryPage } from "../pages/player/GameHistoryPage";
import { PlayerHomePage } from "../pages/player/PlayerHomePage";
import { useAuth } from "../context/AuthContext";
import { RoleBasedRoute } from "./RoleBasedRoute";

function HomeRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === "ADMIN" ? "/admin" : "/player"} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Root redirect based on auth status */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Player Protected routes (Players only, Admin cannot play) */}
      <Route element={<RoleBasedRoute allowedRoles={["PLAYER"]} />}>
        <Route element={<PlayerLayout />}>
          <Route path="/player" element={<PlayerHomePage />} />
          <Route path="/player/matches/:publicId" element={<ActiveGamePage />} />
          <Route path="/player/game/:gameId" element={<ActiveGamePage />} />
          <Route path="/player/history" element={<GameHistoryPage />} />
        </Route>
      </Route>

      {/* Admin Protected routes */}
      <Route element={<RoleBasedRoute allowedRoles={["ADMIN"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminHomePage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/users/:userId" element={<UserDetailPage />} />
          <Route path="/admin/users/:userId/matches/:matchId" element={<AdminMatchDetailPage />} />
          <Route path="/admin/words" element={<WordManagementPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Error routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/server-error" element={<ServerErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
