import React from "react";
import { Users, BookA, BarChart3, Settings } from "lucide-react";
import { AdminActionCard } from "./AdminActionCard";

/**
 * AdminQuickActions:
 * Compact navigation grid providing direct access to core administrative modules:
 * 1. Manage Users (/admin/users)
 * 2. Word Dictionary (/admin/words)
 * 3. Reports & Analytics (/admin/reports)
 * 4. Gameplay Settings (/admin/settings)
 */
export function AdminQuickActions() {
  return (
    <section className="admin-quick-actions-section" aria-label="Administrative Quick Actions">
      <div className="section-header-row">
        <h2 className="admin-section-title">Quick Actions</h2>
        <span className="section-subtitle-tag">Administrative Consoles</span>
      </div>

      <div className="admin-actions-grid">
        {/* 1. Manage Users */}
        <AdminActionCard
          icon={Users}
          iconColorClass="action-blue"
          title="Manage Users"
          description="Inspect player profiles, evaluate individual win rates and game histories, and manage account status."
          linkTo="/admin/users"
          actionLabel="Open Users"
        />

        {/* 2. Word Dictionary */}
        <AdminActionCard
          icon={BookA}
          iconColorClass="action-indigo"
          title="Word Dictionary"
          description="Maintain target words, configure clues and hints, set difficulty classifications, and toggle rotation."
          linkTo="/admin/words"
          actionLabel="Open Words"
        />

        {/* 3. Reports & Analytics */}
        <AdminActionCard
          icon={BarChart3}
          iconColorClass="action-teal"
          title="Reports & Analytics"
          description="Review overall match trends, player win-loss ratios, guess attempt distributions, and activity logs."
          linkTo="/admin/reports"
          actionLabel="Open Reports"
        />

        {/* 4. Gameplay Settings */}
        <AdminActionCard
          icon={Settings}
          iconColorClass="action-slate"
          title="Gameplay Settings"
          description="Fine-tune allowed attempts, word length limits, hint quotas, session timeouts, and security policies."
          linkTo="/admin/settings"
          actionLabel="Open Settings"
        />
      </div>
    </section>
  );
}
