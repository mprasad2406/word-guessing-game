import React from "react";
import { CheckCircle2, PauseCircle } from "lucide-react";

/**
 * AdminDashboardHeader:
 * Displays a clean, personalized greeting based on local time and current gameplay status.
 * Format: "Good morning/afternoon/evening, [username]"
 * Subtitle: "Here's an overview of your game and system activity."
 */
export function AdminDashboardHeader({ user, gameSettings, isLoading = false }) {
  const isGameEnabled = gameSettings?.game_enabled ?? true;

  // Compute greeting based on local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const username = user?.username || "Admin";

  return (
    <header className="admin-dashboard-header" aria-label="Dashboard heading">
      <div className="admin-header-left">
        <h1 className="admin-page-title">
          {getGreeting()}, {username}
        </h1>
        <p className="admin-page-subtitle">
          Here's an overview of your game and system activity.
        </p>
      </div>

      <div className="admin-header-right">
        {!isLoading && gameSettings && (
          <div
            className={`admin-game-status-pill ${isGameEnabled ? "status-enabled" : "status-disabled"}`}
            role="status"
            aria-label={`Global gameplay is currently ${isGameEnabled ? "Active" : "Disabled"}`}
          >
            {isGameEnabled ? (
              <>
                <CheckCircle2 size={14} className="status-icon" />
                <span>Gameplay Active</span>
              </>
            ) : (
              <>
                <PauseCircle size={14} className="status-icon" />
                <span>Gameplay Disabled</span>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
