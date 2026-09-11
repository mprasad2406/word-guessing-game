import React from "react";
import { Link } from "react-router-dom";

export function ServerErrorPage() {
  return (
    <div className="error-page-container">
      <div className="error-card">
        <span className="error-badge-code">500</span>
        <h1 className="error-card-title">Server Connection Error</h1>
        <p className="error-card-message">
          We encountered an issue connecting to the backend services. Please ensure the backend server is running and try again.
        </p>
        <div className="error-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </button>
          <Link to="/login" className="btn btn-outline">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
