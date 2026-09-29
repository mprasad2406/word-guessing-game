import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * AdminActionCard:
 * Reusable action card for the Quick Actions navigation grid.
 */
export function AdminActionCard({
  icon: Icon,
  iconColorClass = "action-blue",
  title,
  description,
  linkTo,
  actionLabel = "Open Console",
}) {
  return (
    <Link to={linkTo} className="admin-action-card" aria-label={`${title} - ${description}`}>
      <div className="action-card-header">
        <div className={`action-icon-box ${iconColorClass}`}>
          {Icon && <Icon size={20} strokeWidth={2.2} />}
        </div>
        <span className="action-arrow-indicator" aria-hidden="true">
          <ArrowRight size={16} />
        </span>
      </div>

      <div className="action-card-body">
        <h3 className="action-card-title">{title}</h3>
        <p className="action-card-desc">{description}</p>
      </div>

      <div className="action-card-footer">
        <span className="action-btn-text">
          <span>{actionLabel}</span>
          <ArrowRight size={14} className="action-btn-arrow" />
        </span>
      </div>
    </Link>
  );
}
