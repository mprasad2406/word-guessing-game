import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AdminDashboardHeader } from "../../components/admin/AdminDashboardHeader";
import { AdminStatsGrid } from "../../components/admin/AdminStatsGrid";
import { GameplayAnalyticsSection } from "../../components/admin/GameplayAnalyticsSection";
import { AdminQuickActions } from "../../components/admin/AdminQuickActions";
import { useAuth } from "../../context/AuthContext";
import { adminReportService } from "../../services/adminReportService";
import { securityService } from "../../services/securityService";
import { settingsService } from "../../services/settingsService";
import { userService } from "../../services/userService";
import { wordService } from "../../services/wordService";
import "./AdminDashboard.css";

export function AdminHomePage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalWords: 0,
    activeWords: 0,
    totalUsers: 0,
    activeUsers: 0,
    gameSettings: null,
    securityStatus: null,
  });

  const [dailyReports, setDailyReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        allWordsRes,
        activeWordsRes,
        allUsersRes,
        activeUsersRes,
        settingsRes,
        secStatusRes,
        dailyReportsRes,
      ] = await Promise.allSettled([
        wordService.listWords({ page: 1, pageSize: 1 }),
        wordService.listWords({ isActive: true, page: 1, pageSize: 1 }),
        userService.listUsers({ page: 1, pageSize: 1 }),
        userService.listUsers({ isActive: true, page: 1, pageSize: 1 }),
        settingsService.getGameSettings(),
        securityService.getSecurityStatus(),
        adminReportService.getDailyReports({ page: 1, pageSize: 7 }),
      ]);

      setStats({
        totalWords:
          allWordsRes.status === "fulfilled" ? allWordsRes.value.total : 0,
        activeWords:
          activeWordsRes.status === "fulfilled" ? activeWordsRes.value.total : 0,
        totalUsers:
          allUsersRes.status === "fulfilled" ? allUsersRes.value.total : 0,
        activeUsers:
          activeUsersRes.status === "fulfilled" ? activeUsersRes.value.total : 0,
        gameSettings:
          settingsRes.status === "fulfilled" ? settingsRes.value : null,
        securityStatus:
          secStatusRes.status === "fulfilled" ? secStatusRes.value : null,
      });

      if (dailyReportsRes.status === "fulfilled" && dailyReportsRes.value?.summaries) {
        setDailyReports(dailyReportsRes.value.summaries);
      } else {
        setDailyReports([]);
      }
    } catch (err) {
      console.error("Dashboard metrics load error:", err);
      setError("Some dashboard metrics could not be loaded. Please try refreshing.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="admin-dashboard-container">
      {/* 1. Personalized Page Header */}
      <AdminDashboardHeader
        user={user}
        gameSettings={stats.gameSettings}
        isLoading={isLoading}
      />

      {/* Error Alert Banner with Retry */}
      {error && (
        <div
          className="alert alert-warning d-flex align-items-center justify-content-between gap-2 rounded-3 mb-0"
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={18} className="text-warning flex-shrink-0" />
            <span style={{ fontSize: "0.875rem" }}>{error}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-warning text-dark fw-semibold d-inline-flex align-items-center gap-1"
            onClick={loadDashboardData}
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. Overview Statistics (4-Column Grid) */}
      <AdminStatsGrid
        stats={stats}
        isLoading={isLoading}
      />

      {/* 3. Gameplay Overview & Activity Chart Section */}
      <GameplayAnalyticsSection
        dailyReports={dailyReports}
        isLoading={isLoading}
      />

      {/* 4. Administrative Modules Quick Actions (4-Column Grid) */}
      <AdminQuickActions />
    </div>
  );
}
