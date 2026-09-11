import React from "react";

/**
 * Modern dynamic requirement checklist for Username in Registration.
 */
export function UsernameChecklist({ value }) {
  if (!value || value.length === 0) return null;

  const isMinMet = value.length >= 5;
  const isMaxValid = value.length <= 12;
  const isLengthValid = isMinMet && isMaxValid;
  const isAllowedChars = /^[a-zA-Z0-9_]+$/.test(value);

  // Hide the UI checklist once all requirements are fulfilled
  const isAllSatisfied = isLengthValid && isAllowedChars;
  if (isAllSatisfied) return null;

  return (
    <div className="p-3 mt-2 bg-light bg-opacity-50 rounded-3 border border-light-subtle">
      <div className="fw-semibold text-secondary small mb-2 text-uppercase tracking-wider" style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>
        Username requirements
      </div>
      <div className="d-flex flex-column gap-1">
        <div className={`d-flex align-items-center small ${isLengthValid ? "text-success fw-medium" : "text-muted"}`}>
          <i className={`bi ${isLengthValid ? "bi-check-circle-fill text-success" : "bi-circle text-secondary opacity-50"} me-2`}></i>
          <span>5 to 12 characters</span>
        </div>

        <div className={`d-flex align-items-center small ${isAllowedChars ? "text-success fw-medium" : "text-muted"}`}>
          <i className={`bi ${isAllowedChars ? "bi-check-circle-fill text-success" : "bi-circle text-secondary opacity-50"} me-2`}></i>
          <span>Letters, numbers, and underscore (_) only</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Modern dynamic requirement checklist for Password in Registration.
 */
export function PasswordChecklist({ value }) {
  if (!value || value.length === 0) return null;

  const isMinMet = value.length >= 5;
  const isMaxValid = value.length <= 16;
  const isLengthValid = isMinMet && isMaxValid;
  const hasAlpha = /[a-zA-Z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const hasSpecial = /[^a-zA-Z0-9\s]/.test(value);

  // Hide the UI checklist once all requirements are fulfilled
  const isAllSatisfied = isLengthValid && hasAlpha && hasDigit && hasSpecial;
  if (isAllSatisfied) return null;

  return (
    <div className="p-3 mt-2 bg-light bg-opacity-50 rounded-3 border border-light-subtle">
      <div className="fw-semibold text-secondary small mb-2 text-uppercase tracking-wider" style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>
        Password requirements
      </div>
      <div className="d-flex flex-column gap-1">
        <div className={`d-flex align-items-center small ${isLengthValid ? "text-success fw-medium" : "text-muted"}`}>
          <i className={`bi ${isLengthValid ? "bi-check-circle-fill text-success" : "bi-circle text-secondary opacity-50"} me-2`}></i>
          <span>At least 5 characters (up to 16)</span>
        </div>

        <div className={`d-flex align-items-center small ${hasAlpha ? "text-success fw-medium" : "text-muted"}`}>
          <i className={`bi ${hasAlpha ? "bi-check-circle-fill text-success" : "bi-circle text-secondary opacity-50"} me-2`}></i>
          <span>One letter</span>
        </div>

        <div className={`d-flex align-items-center small ${hasDigit ? "text-success fw-medium" : "text-muted"}`}>
          <i className={`bi ${hasDigit ? "bi-check-circle-fill text-success" : "bi-circle text-secondary opacity-50"} me-2`}></i>
          <span>One number</span>
        </div>

        <div className={`d-flex align-items-center small ${hasSpecial ? "text-success fw-medium" : "text-muted"}`}>
          <i className={`bi ${hasSpecial ? "bi-check-circle-fill text-success" : "bi-circle text-secondary opacity-50"} me-2`}></i>
          <span>One special character</span>
        </div>
      </div>
    </div>
  );
}
