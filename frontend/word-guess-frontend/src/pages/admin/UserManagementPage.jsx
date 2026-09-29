import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/userService";
import { UserStats } from "../../components/admin/users/UserStats";
import { UserFilters } from "../../components/admin/users/UserFilters";
import { UserTable } from "../../components/admin/users/UserTable";
import { UserPagination } from "../../components/admin/users/UserPagination";
import { AccountActionDialog } from "../../components/admin/users/AccountActionDialog";
import "./UserManagement.css";

export function UserManagementPage() {
  const { user: currentAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract filter state from URL search params
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";
  const role = searchParams.get("role") || "ALL";
  const sortBy = searchParams.get("sort") || "newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  // Local data state
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [overviewStats, setOverviewStats] = useState(null);

  // Loading & status states
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // Block/Unblock dialog state
  const [dialogUser, setDialogUser] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Helper to update search params
  const updateParams = useCallback(
    (newParams) => {
      const updated = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, val]) => {
        if (
          val === null ||
          val === undefined ||
          val === "" ||
          (key === "page" && val === 1) ||
          (key === "pageSize" && val === 10) ||
          (key === "status" && val === "ALL") ||
          (key === "role" && val === "ALL") ||
          (key === "sort" && val === "newest")
        ) {
          updated.delete(key);
        } else {
          updated.set(key, String(val));
        }
      });
      setSearchParams(updated, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Load Overview Statistics
  const loadOverviewStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const stats = await userService.getOverviewStats();
      setOverviewStats(stats);
    } catch (err) {
      console.error("Failed to load user overview stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Map sort keys for backend
  const mapSortForApi = (sortKey) => {
    switch (sortKey) {
      case "oldest": return "OLDEST";
      case "most_games": return "MOST_GAMES";
      case "highest_win_rate": return "HIGHEST_WIN_RATE";
      case "recent_activity": return "RECENT_ACTIVITY";
      case "newest":
      default:
        return "NEWEST";
    }
  };

  // Load Users List
  const loadUsersList = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const data = await userService.listUsers({
        search: search.trim() || undefined,
        status: status === "ALL" ? undefined : status,
        role: role === "ALL" ? undefined : role,
        sortBy: mapSortForApi(sortBy),
        page: currentPage,
        pageSize: pageSize,
      });

      setUsers(data.items || []);
      setTotalUsers(data.total || 0);
      setTotalPages(data.pages || 1);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error("Failed to list users:", err);
      toast.error(err?.message || "Failed to load user accounts.");
    } finally {
      setIsLoadingList(false);
    }
  }, [search, status, role, sortBy, currentPage, pageSize]);

  // Initial load and filter change trigger
  useEffect(() => {
    loadOverviewStats();
  }, [loadOverviewStats]);

  useEffect(() => {
    loadUsersList();
  }, [loadUsersList]);

  // Refresh both stats and user list
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadOverviewStats(), loadUsersList()]);
      toast.success("User management data refreshed.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter handlers
  const handleSearchChange = (val) => {
    updateParams({ search: val, page: 1 });
  };

  const handleStatusChange = (val) => {
    updateParams({ status: val, page: 1 });
  };

  const handleRoleChange = (val) => {
    updateParams({ role: val, page: 1 });
  };

  const handleSortChange = (val) => {
    updateParams({ sort: val, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
  };

  const handlePageSizeChange = (newSize) => {
    updateParams({ pageSize: newSize, page: 1 });
  };

  const handleOpenStatusDialog = (user) => {
    setDialogUser(user);
  };

  const handleConfirmStatusChange = async (targetUser, newActiveStatus) => {
    if (!targetUser || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const targetIdentifier = targetUser.public_id || targetUser.id;
      const updated = await userService.updateUserStatus(targetIdentifier, newActiveStatus);

      // Update in local users array
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id || (targetUser.public_id && u.public_id === targetUser.public_id)
            ? { ...u, is_active: updated.is_active }
            : u
        )
      );

      // Refresh overview stats to reflect updated counts
      loadOverviewStats();

      toast.success(
        `User '${targetUser.username}' has been ${newActiveStatus ? "unblocked" : "blocked"} successfully.`
      );
      setDialogUser(null);
    } catch (err) {
      toast.error(err?.message || "Failed to update user status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isFiltered = Boolean(search.trim()) || status !== "ALL" || role !== "ALL" || sortBy !== "newest";

  const formatLastUpdated = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="user-management-container">
      {/* 1. Page Header */}
      <div className="user-page-header">
        <div className="user-header-left">
          <div className="user-breadcrumb">
            <Link to="/admin" className="user-breadcrumb-link">
              Admin
            </Link>
            <span className="user-breadcrumb-separator">/</span>
            <span className="user-breadcrumb-current">Users</span>
          </div>
          <h1 className="user-page-title">User Management</h1>
          <p className="user-page-subtitle">
            Administer player accounts, monitor gameplay statistics, and manage platform access controls.
          </p>
        </div>

        <div className="user-header-actions">
          <div className="user-last-updated">
            Updated {formatLastUpdated(lastRefreshedAt)}
          </div>
          <button
            type="button"
            className="btn-user-refresh"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingList}
            title="Refresh user list and metrics"
          >
            <RefreshCw size={15} className={isRefreshing ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Summary Cards */}
      <UserStats stats={overviewStats} isLoading={isLoadingStats} />

      {/* 3. Filter Toolbar */}
      <UserFilters
        searchQuery={search}
        onSearchChange={handleSearchChange}
        statusFilter={status}
        onStatusChange={handleStatusChange}
        roleFilter={role}
        onRoleChange={handleRoleChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onClearFilters={handleResetFilters}
        totalMatching={totalUsers}
        isLoading={isLoadingList}
      />

      {/* 4. Users Data Table */}
      <UserTable
        users={users}
        currentAdminId={currentAdmin?.id}
        isLoading={isLoadingList}
        isFiltered={isFiltered}
        onClearFilters={handleResetFilters}
        onOpenStatusDialog={handleOpenStatusDialog}
      />

      {/* 5. Pagination Footer */}
      <UserPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalUsers}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoadingList}
      />

      {/* 6. Block/Unblock Confirmation Dialog */}
      <AccountActionDialog
        isOpen={Boolean(dialogUser)}
        user={dialogUser}
        isProcessing={isUpdatingStatus}
        onClose={() => setDialogUser(null)}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}
