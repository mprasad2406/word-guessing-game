import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application render error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page-container">
          <div className="error-card">
            <div className="error-card-icon">💥</div>
            <h1 className="error-card-title">Something went wrong</h1>
            <p className="error-card-message">
              An unexpected application error occurred. Please refresh the page to try again.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleReload}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
