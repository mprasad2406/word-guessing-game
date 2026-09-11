import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PasswordChecklist, UsernameChecklist } from "../../components/common/ValidationChecklist";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { validatePassword, validateUsername } from "../../utils/validators";

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Username availability states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState(null); // null | "available" | "taken" | "error"

  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      if (from && from !== "/register" && from !== "/login") {
        navigate(from, { replace: true });
      } else {
        navigate(user.role === "ADMIN" ? "/admin" : "/player", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  // Debounced username availability check (5-second debounce)
  useEffect(() => {
    const trimmed = username.trim();

    if (!trimmed || trimmed.length < 5) {
      setIsCheckingUsername(false);
      setUsernameAvailability(null);
      return;
    }

    const formatValidation = validateUsername(trimmed);
    if (!formatValidation.isValid) {
      setIsCheckingUsername(false);
      setUsernameAvailability(null);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameAvailability(null);

    const timer = setTimeout(async () => {
      try {
        const response = await authService.checkUsernameAvailability(trimmed);
        if (response && response.available) {
          setUsernameAvailability("available");
        } else {
          setUsernameAvailability("taken");
        }
      } catch (err) {
        console.warn("Username availability check failed:", err);
        setUsernameAvailability(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 5000); // 5-second delay after typing stops

    return () => clearTimeout(timer);
  }, [username]);

  // Validation states
  const isUsernameFormatValid = validateUsername(username).isValid;
  const isPasswordValid = validatePassword(password).isValid;
  const isConfirmPasswordEntered = confirmPassword.length > 0;
  const isPasswordMatching = password.length > 0 && password === confirmPassword;

  const isFormValid =
    isUsernameFormatValid &&
    isPasswordValid &&
    isPasswordMatching &&
    usernameAvailability !== "taken";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      toast.error(usernameValidation.error);
      return;
    }

    if (usernameAvailability === "taken") {
      toast.error("Username is already taken. Please choose another.");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.error);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const registeredUser = await register(username.trim(), password);
      toast.success(`Account created successfully! Welcome, ${registeredUser.username}!`);
      const destination = registeredUser.role === "ADMIN" ? "/admin" : "/player";
      navigate(destination, { replace: true });
    } catch (err) {
      const errMsg = err?.message || "Registration failed. Please try a different username.";
      toast.error(errMsg);
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
            <i className="bi bi-person-plus"></i>
          </div>
          <h2 className="fw-bold mb-1">Create Account</h2>
          <p className="text-muted small">Join the game and start guessing words</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Username Field */}
          <div className="mb-3">
            <label htmlFor="reg-username" className="form-label fw-semibold">
              Username
            </label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-person text-muted"></i>
              </span>
              <input
                id="reg-username"
                type="text"
                className={`form-control border-start-0 ps-0 ${
                  usernameAvailability === "available"
                    ? "border-end-0"
                    : usernameAvailability === "taken"
                    ? "border-end-0 is-invalid"
                    : ""
                }`}
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                autoComplete="username"
                maxLength={12}
                required
              />
              {/* Live Availability Status in input */}
              {isCheckingUsername && (
                <span className="input-group-text bg-transparent border-start-0 text-primary">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                </span>
              )}
              {!isCheckingUsername && usernameAvailability === "available" && (
                <span className="input-group-text bg-transparent border-start-0 text-primary" title="Username available">
                  <i className="bi bi-patch-check-fill text-primary fs-6"></i>
                </span>
              )}
              {!isCheckingUsername && usernameAvailability === "taken" && (
                <span className="input-group-text bg-transparent border-start-0 text-danger" title="Username not available">
                  <i className="bi bi-x-circle-fill text-danger fs-6"></i>
                </span>
              )}
            </div>

            {/* Username Availability Feedback Text */}
            {!isCheckingUsername && usernameAvailability === "available" && (
              <div className="text-primary small fw-medium mt-1 d-flex align-items-center gap-1">
                <i className="bi bi-patch-check-fill"></i>
                <span>Username is available</span>
              </div>
            )}
            {!isCheckingUsername && usernameAvailability === "taken" && (
              <div className="text-danger small fw-medium mt-1 d-flex align-items-center gap-1">
                <i className="bi bi-x-circle-fill"></i>
                <span>Username is not available</span>
              </div>
            )}

            {/* Username Requirements Checklist */}
            <UsernameChecklist value={username} />
          </div>

          {/* Password Field */}
          <div className="mb-3">
            <label htmlFor="reg-password" className="form-label fw-semibold">
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                className="form-control border-start-0 border-end-0 ps-0"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
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

            {/* Password Requirements Checklist */}
            <PasswordChecklist value={password} />
          </div>

          {/* Confirm Password Field */}
          <div className="mb-4">
            <label htmlFor="reg-confirm-password" className="form-label fw-semibold">
              Confirm Password
            </label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-shield-check text-muted"></i>
              </span>
              <input
                id="reg-confirm-password"
                type={showPassword ? "text" : "password"}
                className={`form-control border-start-0 ps-0 ${
                  isConfirmPasswordEntered
                    ? isPasswordMatching
                      ? "border-end-0 is-valid"
                      : "border-end-0 is-invalid"
                    : ""
                }`}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
                maxLength={16}
                required
              />
              {isConfirmPasswordEntered && (
                <span className="input-group-text bg-transparent border-start-0">
                  {isPasswordMatching ? (
                    <i className="bi bi-check-circle-fill text-success fs-6"></i>
                  ) : (
                    <i className="bi bi-x-circle-fill text-danger fs-6"></i>
                  )}
                </span>
              )}
            </div>

            {/* Live Confirm Password Feedback */}
            {isConfirmPasswordEntered && (
              <div
                className={`small fw-medium mt-1 d-flex align-items-center gap-1 ${
                  isPasswordMatching ? "text-success" : "text-danger"
                }`}
              >
                <i className={`bi ${isPasswordMatching ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i>
                <span>{isPasswordMatching ? "Passwords match" : "Passwords do not match"}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <i className="bi bi-check-circle"></i>
                <span>Sign Up</span>
              </>
            )}
          </button>

          <div className="text-center mt-4">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="fw-semibold text-decoration-none">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
