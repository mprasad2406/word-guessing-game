import React from "react";
import { Users, BookA, Gamepad2, ShieldCheck, Lock } from "lucide-react";
import { AdminStatCard } from "./AdminStatCard";

/**
 * AdminStatsGrid:
 * 4-column responsive grid displaying core overview statistics:
 * 1. Registered Users
 * 2. Word Dictionary
 * 3. Gameplay Status
 * 4. Security Configuration
 */
export function AdminStatsGrid({ stats, isLoading = false }) {
  const isGameEnabled = stats?.gameSettings?.game_enabled ?? true;
  const isSecurityInitialized = stats?.securityStatus?.is_initialized ?? false;

  const totalUsers = stats?.totalUsers ?? 0;
  const activeUsers = stats?.activeUsers ?? 0;
  const blockedUsers = Math.max(0, totalUsers - activeUsers);

  const totalWords = stats?.totalWords ?? 0;
  const activeWords = stats?.activeWords ?? 0;

  return (
    <section className="admin-stats-grid" aria-label="System Overview Statistics">
      {/* 1. Registered Users */}
      <AdminStatCard
        icon={Users}
        iconColorClass="icon-blue"
        label="Registered Users"
        value={totalUsers}
        supportingText={
          <span>
            <strong>{activeUsers}</strong> active · <strong>{blockedUsers}</strong> blocked
          </span>
        }
        isLoading={isLoading}
      />

      {/* 2. Word Dictionary */}
      <AdminStatCard
        icon={BookA}
        iconColorClass="icon-indigo"
        label="Word Dictionary"
        value={totalWords}
        supportingText={
          <span>
            <strong>{activeWords}</strong> active in rotation
          </span>
        }
        isLoading={isLoading}
      />

      {/* 3. Gameplay Status */}
      <AdminStatCard
        icon={Gamepad2}
        iconColorClass={isGameEnabled ? "icon-green" : "icon-red"}
        label="Gameplay Status"
        value={isGameEnabled ? "Enabled" : "Disabled"}
        supportingText={
          isGameEnabled
            ? "Players can start new matches"
            : "Match creation is paused"
        }
        isStateValue={true}
        stateType={isGameEnabled ? "success" : "danger"}
        isLoading={isLoading}
      />

      {/* 4. Security Configuration */}
      <AdminStatCard
        icon={isSecurityInitialized ? ShieldCheck : Lock}
        iconColorClass={isSecurityInitialized ? "icon-emerald" : "icon-amber"}
        label="Security Configuration"
        value={isSecurityInitialized ? "Configured" : "Setup Needed"}
        supportingText={
          isSecurityInitialized
            ? "Argon2id encryption active"
            : "Initial key setup recommended"
        }
        isStateValue={true}
        stateType={isSecurityInitialized ? "success" : "warning"}
        isLoading={isLoading}
      />
    </section>
  );
}
