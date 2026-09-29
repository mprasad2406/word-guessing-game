import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { wordService } from "../../services/wordService";
import { WordPageHeader } from "../../components/admin/words/WordPageHeader";
import { WordSummaryStrip } from "../../components/admin/words/WordSummaryStrip";
import { WordFilterToolbar } from "../../components/admin/words/WordFilterToolbar";
import { WordTable } from "../../components/admin/words/WordTable";
import { WordPagination } from "../../components/admin/words/WordPagination";
import { WordModal } from "../../components/admin/words/WordModal";
import { WordDeleteModal } from "../../components/admin/words/WordDeleteModal";
import { WordDetailsDrawer } from "../../components/admin/words/WordDetailsDrawer";
import "./WordManagement.css";

const DIFFICULTY_RANK = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

/**
 * WordManagementPage:
 * Visually intuitive dictionary management interface with interactive
 * statistics quick-filters, 4-column scannable table, slide-over details drawer,
 * debounced search, URL state sync, optimistic immediate feedback, and Undo actions.
 */
export function WordManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract filter state from URL search params
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";
  const difficulty = searchParams.get("difficulty") || "ALL";
  const sortBy = searchParams.get("sort") || "alphabetical_asc";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  // Full dataset loaded from API
  const [allWords, setAllWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Summary counts
  const [summaryStats, setSummaryStats] = useState({ total: 0, active: 0, inactive: 0 });

  // Word Details Drawer state
  const [selectedDrawerWord, setSelectedDrawerWord] = useState(null);

  // Add / Edit Modal state
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [isSavingWord, setIsSavingWord] = useState(false);

  // Deactivate / Delete Modal state
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    word: null,
    isPermanent: false,
  });
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  // Helper to sync URL search params
  const updateParams = useCallback(
    (newParams) => {
      const updated = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, val]) => {
        if (
          val === null ||
          val === undefined ||
          val === "" ||
          (key === "page" && val === 1) ||
          (key === "pageSize" && val === 20) ||
          (key === "status" && val === "ALL") ||
          (key === "difficulty" && val === "ALL") ||
          (key === "sort" && val === "alphabetical_asc")
        ) {
          updated.delete(key);
        } else {
          updated.set(key, String(val));
        }
      });
      setSearchParams(updated, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Fetch words dataset from server
  const loadWordsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await wordService.fetchAllWords();
      const items = Array.isArray(data?.items) ? data.items : [];

      setAllWords(items);

      // Compute overview counts
      const total = items.length;
      const active = items.filter((w) => w.is_active).length;
      const inactive = total - active;

      setSummaryStats({ total, active, inactive });
    } catch (err) {
      console.error("Failed to load words dictionary:", err);
      setError(err?.message || "Failed to load words from server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWordsData();
  }, [loadWordsData]);

  // Filter and sort full dataset
  const filteredAndSortedWords = useMemo(() => {
    let result = [...allWords];

    // 1. Status Filter
    if (status === "ACTIVE") {
      result = result.filter((w) => w.is_active);
    } else if (status === "INACTIVE") {
      result = result.filter((w) => !w.is_active);
    }

    // 2. Difficulty Filter
    if (difficulty !== "ALL") {
      result = result.filter(
        (w) => String(w.difficulty).toUpperCase() === difficulty
      );
    }

    // 3. Search Filter (by word or clue)
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter((w) => {
        const wordMatch = (w.word || "").toLowerCase().includes(query);
        const hintMatch = (w.hint || "").toLowerCase().includes(query);
        return wordMatch || hintMatch;
      });
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === "alphabetical_asc") {
        return (a.word || "").localeCompare(b.word || "");
      }
      if (sortBy === "alphabetical_desc") {
        return (b.word || "").localeCompare(a.word || "");
      }
      if (sortBy === "difficulty") {
        const rankA = DIFFICULTY_RANK[a.difficulty] || 0;
        const rankB = DIFFICULTY_RANK[b.difficulty] || 0;
        return rankA - rankB;
      }
      if (sortBy === "newest") {
        return (b.id || 0) - (a.id || 0);
      }
      if (sortBy === "oldest") {
        return (a.id || 0) - (b.id || 0);
      }
      return (a.word || "").localeCompare(b.word || "");
    });

    return result;
  }, [allWords, status, difficulty, search, sortBy]);

  // Total matching count after filters
  const totalMatching = filteredAndSortedWords.length;
  const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));

  // Current page records slice
  const paginatedWords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedWords.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedWords, currentPage, pageSize]);

  // Filter change handlers
  const handleSearchChange = (val) => {
    updateParams({ search: val, page: 1 });
  };

  const handleStatusChange = (newStatus) => {
    updateParams({ status: newStatus, page: 1 });
  };

  const handleDifficultyChange = (newDiff) => {
    updateParams({ difficulty: newDiff, page: 1 });
  };

  const handleSortChange = (newSort) => {
    updateParams({ sort: newSort, page: 1 });
  };

  const handleTableColumnSort = (field) => {
    if (field === "word") {
      updateParams({
        sort: sortBy === "alphabetical_asc" ? "alphabetical_desc" : "alphabetical_asc",
        page: 1,
      });
    } else if (field === "difficulty") {
      updateParams({ sort: "difficulty", page: 1 });
    }
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
  };

  const handlePageSizeChange = (newSize) => {
    updateParams({ pageSize: newSize, page: 1 });
  };

  // Add / Edit Handlers
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
        const updated = await wordService.updateWord(wordId, payload);
        setAllWords((prev) => prev.map((w) => (w.id === wordId ? { ...w, ...updated } : w)));
        if (selectedDrawerWord?.id === wordId) {
          setSelectedDrawerWord((prev) => ({ ...prev, ...updated }));
        }
        toast.success(`Word "${payload.word.toUpperCase()}" updated successfully!`);
      } else {
        const created = await wordService.createWord(payload);
        setAllWords((prev) => [created, ...prev]);
        setSummaryStats((prev) => ({
          total: prev.total + 1,
          active: created.is_active ? prev.active + 1 : prev.active,
          inactive: !created.is_active ? prev.inactive + 1 : prev.inactive,
        }));
        toast.success(`Word "${payload.word.toUpperCase()}" added to dictionary!`);
      }
      return true;
    } catch (err) {
      const errMsg = err?.message || "Failed to save word.";
      toast.error(errMsg);
      return false;
    } finally {
      setIsSavingWord(false);
    }
  };

  // Optimistic Toggle Active / Inactive with Undo feedback
  const handleToggleActive = async (word) => {
    const newStatus = !word.is_active;

    // Immediate optimistic update
    setAllWords((prev) =>
      prev.map((w) => (w.id === word.id ? { ...w, is_active: newStatus } : w))
    );
    setSummaryStats((prev) => ({
      ...prev,
      active: newStatus ? prev.active + 1 : Math.max(0, prev.active - 1),
      inactive: newStatus ? Math.max(0, prev.inactive - 1) : prev.inactive + 1,
    }));
    if (selectedDrawerWord?.id === word.id) {
      setSelectedDrawerWord((prev) => ({ ...prev, is_active: newStatus }));
    }

    try {
      await wordService.updateWord(word.id, { is_active: newStatus });
      const actionLabel = newStatus ? "activated" : "deactivated";

      toast.info(
        ({ closeToast }) => (
          <div className="d-flex align-items-center justify-content-between gap-3">
            <span>
              Word <strong>"{word.word.toUpperCase()}"</strong> {actionLabel}.
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-light py-0 px-2 fw-semibold"
              onClick={async () => {
                closeToast();
                await handleToggleActive({ ...word, is_active: newStatus });
              }}
            >
              Undo
            </button>
          </div>
        ),
        { autoClose: 4500 }
      );
    } catch (err) {
      // Revert on failure
      setAllWords((prev) =>
        prev.map((w) => (w.id === word.id ? { ...w, is_active: word.is_active } : w))
      );
      setSummaryStats((prev) => ({
        ...prev,
        active: word.is_active ? prev.active + 1 : Math.max(0, prev.active - 1),
        inactive: word.is_active ? Math.max(0, prev.inactive - 1) : prev.inactive + 1,
      }));
      toast.error(err?.message || "Failed to update word status.");
    }
  };

  // Permanent Delete
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
        const deletedWord = allWords.find((w) => w.id === wordId);
        setAllWords((prev) => prev.filter((w) => w.id !== wordId));
        setSummaryStats((prev) => ({
          total: Math.max(0, prev.total - 1),
          active: deletedWord?.is_active ? Math.max(0, prev.active - 1) : prev.active,
          inactive: !deletedWord?.is_active ? Math.max(0, prev.inactive - 1) : prev.inactive,
        }));
        if (selectedDrawerWord?.id === wordId) {
          setSelectedDrawerWord(null);
        }
        toast.success("Word permanently removed from dictionary.");
      }
      return true;
    } catch (err) {
      const errMsg = err?.message || "Operation failed.";
      toast.error(errMsg);
      return false;
    } finally {
      setIsProcessingDelete(false);
    }
  };

  // Drawer handlers
  const handleOpenDrawer = (word) => {
    setSelectedDrawerWord(word);
  };

  const handleCloseDrawer = () => {
    setSelectedDrawerWord(null);
  };

  const isFiltered =
    Boolean(search.trim()) || status !== "ALL" || difficulty !== "ALL" || sortBy !== "alphabetical_asc";

  return (
    <div className="word-management-container" role="main" aria-label="Word Management Dashboard">
      {/* 1. Page Header */}
      <WordPageHeader onAddWordClick={handleCreateNewWord} />

      {/* 2. Interactive Statistics Indicators (Click to quick filter) */}
      <WordSummaryStrip
        summary={summaryStats}
        isLoading={isLoading}
        statusFilter={status}
        onStatusFilterChange={handleStatusChange}
      />

      {/* 3. Search, Filter & Sort Toolbar */}
      <WordFilterToolbar
        searchTerm={search}
        onSearchChange={handleSearchChange}
        statusFilter={status}
        onStatusChange={handleStatusChange}
        difficultyFilter={difficulty}
        onDifficultyChange={handleDifficultyChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        totalMatching={totalMatching}
        isLoading={isLoading}
      />

      {/* 4. Error Banner */}
      {error && (
        <div className="form-error-banner" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* 5. 4-Column Words Data Table */}
      <WordTable
        words={paginatedWords}
        isLoading={isLoading}
        isFiltered={isFiltered}
        sortField={sortBy.includes("alphabetical") ? "word" : sortBy}
        sortDirection={sortBy === "alphabetical_desc" ? "desc" : "asc"}
        onSort={handleTableColumnSort}
        onClearFilters={handleClearFilters}
        onAddWord={handleCreateNewWord}
        onOpenDrawer={handleOpenDrawer}
        onEditWord={handleEditWord}
        onToggleActive={handleToggleActive}
        onDeleteWord={handleOpenPermanentDelete}
      />

      {/* 6. Pagination Footer (Left result count, Right controls) */}
      {!isLoading && (
        <WordPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalMatching}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      )}

      {/* 7. Slide-Over Word Details Drawer with Usage Stats */}
      <WordDetailsDrawer
        isOpen={Boolean(selectedDrawerWord)}
        onClose={handleCloseDrawer}
        word={selectedDrawerWord}
        onEdit={handleEditWord}
        onToggleActive={handleToggleActive}
        onDelete={handleOpenPermanentDelete}
      />

      {/* 8. Add / Edit Word Modal */}
      <WordModal
        isOpen={isWordModalOpen}
        onClose={() => setIsWordModalOpen(false)}
        onSave={handleSaveWord}
        editingWord={editingWord}
        isSaving={isSavingWord}
      />

      {/* 9. Permanent Delete Confirmation Modal */}
      <WordDeleteModal
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
