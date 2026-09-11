import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function UnauthorizedPage() {
  const { user } = useAuth();
  const homePath = user?.role === "ADMIN" ? "/admin" : user?.role === "PLAYER" ? "/player" : "/login";

  return (
    <div className="error-page-container">
      <div className="error-card">
        <span className="error-badge-code">403</span>
        <h1 className="error-card-title">Access Forbidden</h1>
        <p className="error-card-message">
          You do not have the required permissions to access this administrative section.
        </p>
        <Link to={homePath} className="btn btn-primary">
          Back to Authorized Area
        </Link>
      </div>
    </div>
  );
}
