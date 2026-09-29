import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/userService";
import { UserProfileHeader } from "../../components/admin/users/UserProfileHeader";
import { UserGameStats } from "../../components/admin/users/UserGameStats";
import { UserGameHistory } from "../../components/admin/users/UserGameHistory";
import { AccountActionDialog } from "../../components/admin/users/AccountActionDialog";
import "./UserManagement.css";

export function UserDetailPage() {
  const { userId, publicId } = useParams();
  const identifier = publicId || userId;
  const { user: currentAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params for state preservation
  const urlStatus = searchParams.get("status") || "ALL";
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlSearch = searchParams.get("search") || "";

  const [userDetails, setUserDetails] = useState(null);
  const [gameHistory, setGameHistory] = useState({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    pages: 1,
  });

  const [currentPage, setCurrentPage] = useState(isNaN(urlPage) ? 1 : urlPage);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [searchTerm, setSearchTerm] = useState(urlSearch);

  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  // Status Dialog state
  const [dialogUser, setDialogUser] = useState(null);
  const [dialogAction, setDialogAction] = useState("block"); // "block" | "unblock"
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Update URL Search Params when filters/pagination/search change
  const updateUrlParams = useCallback(
    (newFilter, newPage, newSearch) => {
      const params = new URLSearchParams();
      if (newFilter && newFilter !== "ALL") {
        params.set("status", newFilter);
      }
      if (newPage && newPage > 1) {
        params.set("page", String(newPage));
      }
      if (newSearch && newSearch.trim()) {
        params.set("search", newSearch.trim());
      }
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Load user profile & overview
  const loadUserDetails = useCallback(async () => {
    if (!identifier) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getUserDetails(identifier);
      setUserDetails(data);
    } catch (err) {
      console.error("Failed to load user details:", err);
      setError(err?.message || "Failed to load user profile.");
    } finally {
      setIsLoading(false);
    }
  }, [identifier]);

  // Load user game history
  const loadUserHistory = useCallback(async () => {
    if (!identifier) return;
    setIsHistoryLoading(true);
    try {
      const historyRes = await userService.getUserGameHistory(identifier, {
        status: statusFilter === "ALL" ? null : statusFilter,
        page: currentPage,
        pageSize: 10,
      });
      setGameHistory(historyRes);
    } catch (err) {
      console.error("Failed to load user games:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [identifier, statusFilter, currentPage]);

  useEffect(() => {
    loadUserDetails();
  }, [loadUserDetails]);

  useEffect(() => {
    if (identifier) {
      loadUserHistory();
    }
  }, [loadUserHistory]);

  const handleStatusFilterChange = (filterId) => {
    setStatusFilter(filterId);
    setCurrentPage(1);
    updateUrlParams(filterId, 1, searchTerm);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateUrlParams(statusFilter, page, searchTerm);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    updateUrlParams(statusFilter, currentPage, term);
  };

  const handleOpenStatusDialog = () => {
    if (!userDetails) return;
    setDialogAction(userDetails.is_active ? "block" : "unblock");
    setDialogUser(userDetails);
  };

  const handleConfirmStatusChange = async () => {
    if (!dialogUser || isUpdatingStatus) return;

    const newStatus = !dialogUser.is_active;
    setIsUpdatingStatus(true);
    try {
      const targetIdentifier = dialogUser.public_id || dialogUser.id;
      const updated = await userService.updateUserStatus(targetIdentifier, newStatus);
      setUserDetails(updated);
      setDialogUser(null);
      toast.success(
        `User '${dialogUser.username}' has been ${newStatus ? "unblocked" : "blocked"} successfully.`
      );
    } catch (err) {
      toast.error(err?.message || "Failed to update user status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isSelf = Boolean(
    userDetails &&
      currentAdmin &&
      (userDetails.id === currentAdmin.id ||
        (userDetails.public_id && userDetails.public_id === currentAdmin.public_id) ||
        userDetails.username === currentAdmin.username)
  );

  if (isLoading) {
    return (
      <div className="user-detail-container">
        <div className="user-table-skeleton-rows" style={{ padding: "32px 0" }}>
          <div className="user-table-skeleton-row" style={{ height: "72px" }} />
          <div className="user-table-skeleton-row" style={{ height: "120px" }} />
          <div className="user-table-skeleton-row" style={{ height: "200px" }} />
        </div>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="user-detail-container">
        <div className="user-not-found-card">
          <AlertCircle size={48} className="user-not-found-icon" />
          <h2 className="user-not-found-title">User Not Found</h2>
          <p className="user-not-found-desc">
            {error || "The requested user profile does not exist or may have been removed."}
          </p>
          <Link to="/admin/users" className="btn-user-primary">
            <ArrowLeft size={16} />
            <span>Return to User Management</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="user-detail-container">
      {/* Top Header & Breadcrumbs */}
      <UserProfileHeader
        user={userDetails}
        isSelf={isSelf}
        onToggleStatus={handleOpenStatusDialog}
        isUpdatingStatus={isUpdatingStatus}
      />

      {/* Gameplay Metrics Breakdown (4 Scannable Cards) */}
      <UserGameStats user={userDetails} />

      {/* Match History Table with Segmented Controls & Search */}
      <UserGameHistory
        userId={identifier}
        userStats={userDetails}
        gameHistory={gameHistory}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isLoading={isHistoryLoading}
      />

      {/* Block / Unblock Modal */}
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
