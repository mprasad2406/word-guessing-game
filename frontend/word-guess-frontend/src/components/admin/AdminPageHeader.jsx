import React from "react";
import { Link } from "react-router-dom";

export function AdminPageHeader({ title, subtitle, breadcrumbItem, actions }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-1">
            <li className="breadcrumb-item">
              <Link to="/admin" className="text-decoration-none">
                <i className="bi bi-shield-lock me-1"></i>Admin
              </Link>
            </li>
            {breadcrumbItem && (
              <li className="breadcrumb-item active" aria-current="page">
                {breadcrumbItem}
              </li>
            )}
          </ol>
        </nav>
        <h2 className="fw-bold mb-0">{title}</h2>
        {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
      </div>

      {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
    </div>
  );
}
