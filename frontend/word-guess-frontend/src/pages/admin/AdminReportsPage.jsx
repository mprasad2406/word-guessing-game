import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { adminReportService } from "../../services/adminReportService";
import { userService } from "../../services/userService";
import { ReportHeader } from "../../components/admin/reports/ReportHeader";
import { ReportKpiGrid } from "../../components/admin/reports/ReportKpiGrid";
import { ReportAnalyticsSection } from "../../components/admin/reports/ReportAnalyticsSection";
import { ReportDateFilterToolbar } from "../../components/admin/reports/ReportDateFilterToolbar";
import { DailyReportTable } from "../../components/admin/reports/DailyReportTable";
import { PlayerAnalyticsView } from "../../components/admin/reports/PlayerAnalyticsView";
import { ReportDownloadDialog } from "../../components/admin/reports/ReportDownloadDialog";
import { ReportPreviewModal } from "../../components/admin/reports/ReportPreviewModal";
import { formatReportDate } from "../../utils/dateUtils";
import "./AdminReports.css";

/**
 * Helpers for local calendar date strings (YYYY-MM-DD)
 */
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNDaysAgoDateString = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("daily"); // "daily" | "users"

  // Date Filter State (Shared across tabs)
  const [filterPreset, setFilterPreset] = useState("7D"); // "ALL" | "TODAY" | "7D" | "30D" | "CUSTOM"
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState(() => getNDaysAgoDateString(7));
  const [appliedEndDate, setAppliedEndDate] = useState(() => getTodayDateString());

  // --- Daily Reports State ---
  const [dailyData, setDailyData] = useState({ summaries: [], total: 0, page: 1, page_size: 20, pages: 1 });
  const [isDailyLoading, setIsDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState(null);

  // Selected date for on-demand detailed logs
  const [expandedDate, setExpandedDate] = useState(null);
  const [detailsData, setDetailsData] = useState({ sessions: [], total: 0, page: 1, page_size: 10, pages: 1 });
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [drawerStatusFilter, setDrawerStatusFilter] = useState("ALL");
  const [drawerSearchTerm, setDrawerSearchTerm] = useState("");

  // --- User Reports State ---
  const [userFilterId, setUserFilterId] = useState("ALL");
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [userData, setUserData] = useState({ summaries: [], total: 0, page: 1, page_size: 100, pages: 1 });
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);
  const [userOptions, setUserOptions] = useState([]);

  // Refresh and timestamp state
  const [lastUpdated, setLastUpdated] = useState("just now");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // PDF Download Modal State
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState({ reportType: "daily", reportParams: {} });

  const handleOpenPreview = ({ reportType, reportParams }) => {
    setPreviewConfig({ reportType, reportParams });
    setIsDownloadDialogOpen(false);
    setIsPreviewModalOpen(true);
  };

  // Load User dropdown list on mount
  useEffect(() => {
    async function loadUserDropdown() {
      try {
        const res = await userService.listUsers({ pageSize: 100 });
        if (res && res.items) {
          setUserOptions(res.items);
        }
      } catch (err) {
        console.error("Could not load users for report filter:", err);
      }
    }
    loadUserDropdown();
  }, []);

  // Compute start/end dates from preset
  const handlePresetChange = (preset) => {
    setFilterPreset(preset);
    const today = getTodayDateString();

    if (preset === "ALL") {
      setAppliedStartDate(null);
      setAppliedEndDate(null);
    } else if (preset === "TODAY") {
      setAppliedStartDate(today);
      setAppliedEndDate(today);
    } else if (preset === "7D") {
      setAppliedStartDate(getNDaysAgoDateString(7));
      setAppliedEndDate(today);
    } else if (preset === "30D") {
      setAppliedStartDate(getNDaysAgoDateString(30));
      setAppliedEndDate(today);
    } else if (preset === "CUSTOM") {
      if (!customStartDate) setCustomStartDate(today);
      if (!customEndDate) setCustomEndDate(today);
    }
  };

  const handleApplyCustomFilter = () => {
    if (customStartDate && customEndDate && customStartDate > customEndDate) {
      toast.warning("Start date cannot be after end date.");
      return;
    }
    setAppliedStartDate(customStartDate || null);
    setAppliedEndDate(customEndDate || null);
  };

  const handleResetFilter = () => {
    setFilterPreset("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setAppliedStartDate(null);
    setAppliedEndDate(null);
  };

  // Human-readable active filter description
  const activeFilterDescription = useMemo(() => {
    if (filterPreset === "ALL" || (!appliedStartDate && !appliedEndDate)) {
      return "All Time";
    }
    if (filterPreset === "TODAY" || (appliedStartDate === appliedEndDate && appliedStartDate)) {
      return `Today (${formatReportDate(appliedStartDate)})`;
    }
    if (appliedStartDate && appliedEndDate) {
      return `${formatReportDate(appliedStartDate)} – ${formatReportDate(appliedEndDate)}`;
    }
    if (appliedStartDate) return `From ${formatReportDate(appliedStartDate)}`;
    if (appliedEndDate) return `Until ${formatReportDate(appliedEndDate)}`;
    return null;
  }, [filterPreset, appliedStartDate, appliedEndDate]);

  // Fetch Daily Reports
  const fetchDailyReports = useCallback(
    async (page = 1) => {
      setIsDailyLoading(true);
      setDailyError(null);
      try {
        const res = await adminReportService.getDailyReports({
          startDate: appliedStartDate,
          endDate: appliedEndDate,
          page,
          pageSize: 20,
        });
        setDailyData(res || { summaries: [], total: 0, page: 1, page_size: 20, pages: 1 });
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (err) {
        console.error("Failed to fetch daily reports:", err);
        setDailyError(err?.message || "Failed to load daily gameplay reports.");
      } finally {
        setIsDailyLoading(false);
      }
    },
    [appliedStartDate, appliedEndDate]
  );

  // Fetch User Reports
  const fetchUserReports = useCallback(
    async (page = 1) => {
      setIsUserLoading(true);
      setUserError(null);
      try {
        const res = await adminReportService.getUserReports({
          userId: userFilterId === "ALL" ? null : userFilterId,
          startDate: appliedStartDate,
          endDate: appliedEndDate,
          page,
          pageSize: 100,
        });
        setUserData(res || { summaries: [], total: 0, page: 1, page_size: 100, pages: 1 });
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (err) {
        console.error("Failed to fetch user reports:", err);
        setUserError(err?.message || "Failed to load player analytics reports.");
      } finally {
        setIsUserLoading(false);
      }
    },
    [userFilterId, appliedStartDate, appliedEndDate]
  );

  useEffect(() => {
    if (activeTab === "daily") {
      fetchDailyReports(1);
    } else {
      fetchUserReports(1);
    }
  }, [activeTab, fetchDailyReports, fetchUserReports]);

  // Refresh Action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === "daily") {
      await fetchDailyReports(dailyData.page);
    } else {
      await fetchUserReports(userData.page);
    }
    setIsRefreshing(false);
    toast.success("Reports refreshed successfully.");
  };

  // Detailed Session Logs on-demand loader helper
  const fetchSessionDetails = useCallback(
    async (targetDate, page = 1, status = drawerStatusFilter, search = drawerSearchTerm) => {
      if (!targetDate) return;
      setIsDetailsLoading(true);
      try {
        const res = await adminReportService.getDailyDetails(targetDate, {
          status: status === "ALL" ? null : status,
          search: search.trim() ? search.trim() : null,
          page,
          pageSize: 10,
        });
        setDetailsData(res || { sessions: [], total: 0, page: 1, page_size: 10, pages: 1 });
      } catch (err) {
        toast.error(err?.message || "Failed to load session details.");
      } finally {
        setIsDetailsLoading(false);
      }
    },
    [drawerStatusFilter, drawerSearchTerm]
  );

  const handleToggleExpandDate = async (targetDate) => {
    if (expandedDate === targetDate) {
      setExpandedDate(null);
      return;
    }

    setExpandedDate(targetDate);
    setDrawerStatusFilter("ALL");
    setDrawerSearchTerm("");
    await fetchSessionDetails(targetDate, 1, "ALL", "");
  };

  const handleDrawerStatusChange = (status) => {
    setDrawerStatusFilter(status);
    fetchSessionDetails(expandedDate, 1, status, drawerSearchTerm);
  };

  const handleDrawerSearchChange = (search) => {
    setDrawerSearchTerm(search);
    fetchSessionDetails(expandedDate, 1, drawerStatusFilter, search);
  };

  const handleDetailsPageChange = async (targetDate, page) => {
    await fetchSessionDetails(targetDate, page, drawerStatusFilter, drawerSearchTerm);
  };

  // Aggregate KPI metrics across active dataset
  const kpiMetrics = useMemo(() => {
    const list = dailyData.summaries || [];
    const totalPlayers = list.reduce((acc, curr) => acc + (curr.number_of_users || 0), 0);
    const totalGames = list.reduce((acc, curr) => acc + (curr.total_games || 0), 0);
    const totalWon = list.reduce((acc, curr) => acc + (curr.games_won || 0), 0);
    const totalGuesses = list.reduce((acc, curr) => acc + (curr.total_guesses || 0), 0);
    const winRate = totalGames > 0 ? (totalWon / totalGames) * 100 : 0;

    return {
      totalPlayers,
      totalGames,
      totalWon,
      totalGuesses,
      winRate,
      daysCount: list.length,
    };
  }, [dailyData.summaries]);

  return (
    <div className="admin-reports-container py-3">
      {/* 1. Header with Title, Timestamp, Refresh, PDF Download & Segmented Navigation Tabs */}
      <ReportHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        onOpenDownloadDialog={() => setIsDownloadDialogOpen(true)}
        onOpenPreview={() => {
          let startDate = appliedStartDate || customStartDate || null;
          let endDate = appliedEndDate || customEndDate || null;
          let targetDate = filterPreset === "TODAY" ? getTodayDateString() : null;
          if (filterPreset === "TODAY") {
            startDate = null;
            endDate = null;
          }
          handleOpenPreview({
            reportType: activeTab === "users" ? "player" : "daily",
            reportParams: {
              player: userFilterId !== "ALL" ? userFilterId : (userOptions[0]?.username || "admin"),
              date: targetDate,
              startDate,
              endDate,
              summaryOnly: false,
            },
          });
        }}
      />

      {/* 2. Compact Date Filters Toolbar (Shared Across Tabs) */}
      <ReportDateFilterToolbar
        filterPreset={filterPreset}
        onPresetChange={handlePresetChange}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
        onApplyCustomFilter={handleApplyCustomFilter}
        onResetFilter={handleResetFilter}
        activeFilterDescription={activeFilterDescription}
      />

      {/* TAB 1: DAILY OVERVIEW */}
      {activeTab === "daily" && (
        <>
          {dailyError && <ErrorMessage message={dailyError} onRetry={() => fetchDailyReports(1)} />}

          {/* 3. Unified 4 KPI Cards */}
          <ReportKpiGrid
            totalPlayers={kpiMetrics.totalPlayers}
            totalGames={kpiMetrics.totalGames}
            totalWon={kpiMetrics.totalWon}
            totalGuesses={kpiMetrics.totalGuesses}
            winRate={kpiMetrics.winRate}
            daysCount={kpiMetrics.daysCount}
          />

          {/* 4. Visual Analytics Section (Bar Chart, Doughnut, Line Chart) */}
          <ReportAnalyticsSection
            summaries={dailyData.summaries}
            totalGames={kpiMetrics.totalGames}
            totalWon={kpiMetrics.totalWon}
          />

          {/* 5. Clean 6-Column Daily Reports Table with Expandable Logs */}
          <DailyReportTable
            summaries={dailyData.summaries}
            total={dailyData.total}
            page={dailyData.page}
            pages={dailyData.pages}
            pageSize={dailyData.page_size}
            isLoading={isDailyLoading}
            onPageChange={fetchDailyReports}
            expandedDate={expandedDate}
            onToggleExpandDate={handleToggleExpandDate}
            detailsData={detailsData}
            isDetailsLoading={isDetailsLoading}
            onDetailsPageChange={handleDetailsPageChange}
            drawerStatusFilter={drawerStatusFilter}
            onDrawerStatusChange={handleDrawerStatusChange}
            drawerSearchTerm={drawerSearchTerm}
            onDrawerSearchChange={handleDrawerSearchChange}
          />
        </>
      )}

      {/* TAB 2: PLAYER ANALYTICS */}
      {activeTab === "users" && (
        <>
          {userError && <ErrorMessage message={userError} onRetry={() => fetchUserReports(1)} />}

          <PlayerAnalyticsView
            userReports={userData.summaries}
            userList={userOptions}
            selectedUserId={userFilterId}
            onSelectUser={setUserFilterId}
            searchTerm={playerSearchTerm}
            onSearchChange={setPlayerSearchTerm}
            isLoading={isUserLoading}
          />
        </>
      )}

      {/* 6. Professional PDF Report Generation Dialog */}
      <ReportDownloadDialog
        isOpen={isDownloadDialogOpen}
        onClose={() => setIsDownloadDialogOpen(false)}
        onPreview={handleOpenPreview}
        initialReportType={activeTab === "users" ? "player" : "daily"}
        initialPreset={filterPreset}
        initialStartDate={appliedStartDate || customStartDate}
        initialEndDate={appliedEndDate || customEndDate}
        initialPlayerId={userFilterId}
        userOptions={userOptions}
      />

      {/* 7. Interactive React-Rendered PDF Preview Modal */}
      <ReportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        reportType={previewConfig.reportType}
        reportParams={previewConfig.reportParams}
      />
    </div>
  );
}
