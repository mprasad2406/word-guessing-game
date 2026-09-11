import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { ConfirmDeleteModal } from "../../components/admin/ConfirmDeleteModal";
import { WordModal } from "../../components/admin/WordModal";
import { PageLoader } from "../../components/common/PageLoader";
import { wordService } from "../../services/wordService";

export function WordManagementPage() {
  const [wordData, setWordData] = useState({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
    pages: 1,
  });

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [isSavingWord, setIsSavingWord] = useState(false);

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    word: null,
    isPermanent: false,
  });
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const loadWords = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const isActiveParam =
        activeFilter === "ALL" ? null : activeFilter === "ACTIVE";
      const difficultyParam =
        difficultyFilter === "ALL" ? null : difficultyFilter;

      const data = await wordService.listWords({
        isActive: isActiveParam,
        difficulty: difficultyParam,
        page: currentPage,
        pageSize: 20,
      });

      setWordData(data);
    } catch (err) {
      console.error("Failed to load words:", err);
      setError(err?.message || "Failed to load words from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, [activeFilter, difficultyFilter, currentPage]);

  const handleCreateNewWord = () => {
    setEditingWord(null);
    setIsWordModalOpen(true);
  };

  const handleEditWord = (word) => {
    setEditingWord(word);
    setIsWordModalOpen(true);
  };

  const handleSaveWord = async (payload, wordId) => {
    setIsSavingWord(true);
    try {
      if (wordId) {
        await wordService.updateWord(wordId, payload);
        toast.success(`Word '${payload.word}' updated successfully!`);
      } else {
        await wordService.createWord(payload);
        toast.success(`Word '${payload.word}' created successfully!`);
      }
      await loadWords();
      return true;
    } catch (err) {
      const errMsg = err?.message || "Failed to save word.";
      toast.error(errMsg);
      return false;
    } finally {
      setIsSavingWord(false);
    }
  };

  const handleToggleActive = async (word) => {
    if (word.is_active) {
      // Open modal to confirm deactivation
      setDeleteModalState({
        isOpen: true,
        word,
        isPermanent: false,
      });
    } else {
      // Re-activate word immediately
      try {
        await wordService.updateWord(word.id, { is_active: true });
        toast.success(`Word '${word.word}' activated!`);
        await loadWords();
      } catch (err) {
        toast.error(err?.message || "Failed to activate word.");
      }
    }
  };

  const handleOpenPermanentDelete = (word) => {
    setDeleteModalState({
      isOpen: true,
      word,
      isPermanent: true,
    });
  };

  const handleConfirmDeleteAction = async (wordId, securityKey) => {
    setIsProcessingDelete(true);
    try {
      if (deleteModalState.isPermanent) {
        await wordService.permanentDeleteWord(wordId, securityKey);
        toast.success("Word permanently removed from dictionary!");
      } else {
        await wordService.deactivateWord(wordId);
        toast.success("Word deactivated successfully.");
      }
      await loadWords();
      return true;
    } catch (err) {
      const errMsg = err?.message || "Operation failed.";
      toast.error(errMsg);
      return false;
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case "EASY":
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Easy</span>;
      case "HARD":
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Hard</span>;
      case "MEDIUM":
      default:
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle">Medium</span>;
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Page Header */}
      <AdminPageHeader
        title="Word Management"
        subtitle="Manage vocabulary words, hints, difficulty levels, and availability for gameplay sessions."
        breadcrumbItem="Words"
        actions={
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={handleCreateNewWord}
          >
            <i className="bi bi-plus-circle"></i>
            <span>Add Word</span>
          </button>
        }
      />

      {/* Filter Controls */}
      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            {/* Status Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2">
              <span className="small text-muted fw-semibold">Status:</span>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${activeFilter === "ALL" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setActiveFilter("ALL");
                    setCurrentPage(1);
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn ${activeFilter === "ACTIVE" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setActiveFilter("ACTIVE");
                    setCurrentPage(1);
                  }}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`btn ${activeFilter === "INACTIVE" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setActiveFilter("INACTIVE");
                    setCurrentPage(1);
                  }}
                >
                  Inactive
                </button>
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2">
              <span className="small text-muted fw-semibold">Difficulty:</span>
              <div className="btn-group btn-group-sm" role="group">
                {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    className={`btn ${difficultyFilter === diff ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => {
                      setDifficultyFilter(diff);
                      setCurrentPage(1);
                    }}
                  >
                    {diff === "ALL" ? "All" : diff.charAt(0) + diff.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Word Table */}
      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <PageLoader text="Loading words dictionary..." />
          </div>
        ) : wordData.items.length === 0 ? (
          <div className="text-center py-5 px-3">
            <i className="bi bi-book fs-1 text-secondary opacity-50 d-block mb-3"></i>
            <h5 className="fw-semibold text-secondary">No words found</h5>
            <p className="text-muted small mb-4">
              No words match the selected filter criteria. Try changing filters or add a new word.
            </p>
            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={handleCreateNewWord}
            >
              <i className="bi bi-plus-circle me-2"></i>Add First Word
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th scope="col" className="ps-4">ID</th>
                  <th scope="col">Word</th>
                  <th scope="col">Length</th>
                  <th scope="col">Difficulty</th>
                  <th scope="col">Hint / Clue</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wordData.items.map((word) => (
                  <tr key={word.id} className={!word.is_active ? "opacity-75 bg-light" : ""}>
                    <td className="ps-4 font-monospace text-muted small">#{word.id}</td>
                    <td>
                      <span className="font-monospace fw-bold text-uppercase fs-6 text-dark">
                        {word.word}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {word.word.length} letters
                      </span>
                    </td>
                    <td>{getDifficultyBadge(word.difficulty)}</td>
                    <td>
                      {word.hint ? (
                        <span className="small text-secondary text-truncate d-inline-block" style={{ maxWidth: "250px" }} title={word.hint}>
                          {word.hint}
                        </span>
                      ) : (
                        <span className="text-muted small fst-italic">None</span>
                      )}
                    </td>
                    <td>
                      {word.is_active ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          <i className="bi bi-check-circle-fill me-1"></i> Active
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                          <i className="bi bi-pause-circle-fill me-1"></i> Inactive
                        </span>
                      )}
                    </td>
                    <td className="text-end pe-4">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Edit word details"
                          onClick={() => handleEditWord(word)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className={`btn ${word.is_active ? "btn-outline-warning" : "btn-outline-success"}`}
                          title={word.is_active ? "Deactivate word" : "Activate word"}
                          onClick={() => handleToggleActive(word)}
                        >
                          <i className={`bi ${word.is_active ? "bi-pause-fill" : "bi-play-fill"}`}></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Permanently delete word"
                          onClick={() => handleOpenPermanentDelete(word)}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && wordData.pages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="small text-muted">
              Showing page <strong>{wordData.page}</strong> of <strong>{wordData.pages}</strong> ({wordData.total} words total)
            </div>

            <nav aria-label="Words pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>

                {Array.from({ length: wordData.pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === wordData.pages || Math.abs(p - currentPage) <= 2)
                  .map((pageNum, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && pageNum - prev > 1;

                    return (
                      <React.Fragment key={pageNum}>
                        {showEllipsis && (
                          <li className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        )}
                        <li className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      </React.Fragment>
                    );
                  })}

                <li className={`page-item ${currentPage === wordData.pages ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.min(wordData.pages, p + 1))}
                    disabled={currentPage === wordData.pages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Word Create/Edit Modal */}
      <WordModal
        isOpen={isWordModalOpen}
        onClose={() => setIsWordModalOpen(false)}
        onSave={handleSaveWord}
        editingWord={editingWord}
        isSaving={isSavingWord}
      />

      {/* Deactivate / Permanent Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, word: null, isPermanent: false })}
        onConfirm={handleConfirmDeleteAction}
        word={deleteModalState.word}
        isPermanent={deleteModalState.isPermanent}
        isProcessing={isProcessingDelete}
      />
    </div>
  );
}
