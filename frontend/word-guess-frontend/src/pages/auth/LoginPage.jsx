import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to appropriate area
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      if (from && from !== "/login") {
        navigate(from, { replace: true });
      } else {
        navigate(user.role === "ADMIN" ? "/admin" : "/player", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error("Username is required.");
      return;
    }
    if (!password) {
      toast.error("Password is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const loggedInUser = await login(trimmedUsername, password);
      toast.success(`Welcome back, ${loggedInUser.username}!`);
      const destination = loggedInUser.role === "ADMIN" ? "/admin" : "/player";
      navigate(destination, { replace: true });
    } catch (err) {
      if (
        err?.code === "USER_INACTIVE" ||
        err?.message?.toLowerCase().includes("inactive") ||
        err?.message?.toLowerCase().includes("blocked")
      ) {
        toast.error("Account is blocked. Please contact the administrator.", { toastId: "account-blocked" });
      } else {
        const errMsg = err?.message || "Login failed. Please check your credentials.";
        toast.error(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card shadow-lg border-0 rounded-4 overflow-hidden w-100">
      <div className="card-body p-4 p-sm-5">
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3 shadow-sm"
            style={{ width: "64px", height: "64px", fontSize: "1.75rem" }}
          >
            <i className="bi bi-controller"></i>
          </div>
          <h2 className="fw-bold mb-1">Guess the Word</h2>
          <p className="text-muted small">Sign in to your account to start playing</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="username" className="form-label fw-semibold">
              Username
            </label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-person text-muted"></i>
              </span>
              <input
                id="username"
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                autoComplete="username"
                maxLength={12}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label fw-semibold">
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-control border-start-0 border-end-0 ps-0"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
                maxLength={16}
                required
              />
              <button
                type="button"
                className="input-group-text bg-transparent border-start-0 text-muted"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 rounded-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                <span>Sign In</span>
              </>
            )}
          </button>

          <div className="text-center mt-4">
            <span className="text-muted small">Don't have an account? </span>
            <Link to="/register" className="fw-semibold text-decoration-none">
              Create Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
