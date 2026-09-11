import React from "react";

/**
 * Renders the chronological history of submitted guesses for the active session.
 */
export function GuessHistory({ guesses = [] }) {
  if (!guesses || guesses.length === 0) {
    return (
      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-clock-history text-secondary"></i>
            <span>Previous Guesses</span>
          </h5>
        </div>
        <div className="card-body text-center py-4 text-muted">
          <i className="bi bi-question-circle fs-3 text-secondary opacity-50 d-block mb-2"></i>
          <p className="small mb-0">No guesses submitted yet. Take your first shot above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 rounded-3 mb-4">
      <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
          <i className="bi bi-clock-history text-secondary"></i>
          <span>Previous Guesses</span>
        </h5>
        <span className="badge bg-secondary opacity-75">
          {guesses.length} attempt{guesses.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="card-body pt-0 px-4 pb-4">
        <div className="list-group list-group-flush">
          {guesses.map((item, index) => {
            const isCorrect = item.is_correct;
            const attemptNum = item.attempt_number || index + 1;

            return (
              <div
                key={attemptNum}
                className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-bottom"
              >
                <div className="d-flex align-items-center gap-3">
                  <span className="badge bg-light text-secondary border rounded-pill px-2">
                    #{attemptNum}
                  </span>
                  <span className="font-monospace fw-bold fs-6 text-uppercase letter-spacing-1">
                    {item.guess}
                  </span>
                </div>
                <div>
                  {isCorrect ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1">
                      <i className="bi bi-check-circle-fill me-1"></i> Correct
                    </span>
                  ) : (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1">
                      <i className="bi bi-x-circle-fill me-1"></i> Incorrect
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
