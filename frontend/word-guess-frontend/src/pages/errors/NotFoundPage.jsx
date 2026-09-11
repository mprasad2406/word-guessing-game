import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function NotFoundPage() {
  const { user } = useAuth();
  const homePath = user?.role === "ADMIN" ? "/admin" : user?.role === "PLAYER" ? "/player" : "/login";

  return (
    <div className="error-page-container">
      <div className="error-card">
        <span className="error-badge-code">404</span>
        <h1 className="error-card-title">Page Not Found</h1>
        <p className="error-card-message">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to={homePath} className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
