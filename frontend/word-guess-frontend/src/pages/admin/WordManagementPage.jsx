import React, { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { wordService } from "../../services/wordService";
import { WordPageHeader } from "../../components/admin/words/WordPageHeader";
import { WordSummaryStrip } from "../../components/admin/words/WordSummaryStrip";
import { WordFilterToolbar } from "../../components/admin/words/WordFilterToolbar";
import { WordTable } from "../../components/admin/words/WordTable";
import { WordPagination } from "../../components/admin/words/WordPagination";
import { WordModal } from "../../components/admin/words/WordModal";
import { WordDeleteModal } from "../../components/admin/words/WordDeleteModal";
import "./WordManagement.css";

const DIFFICULTY_RANK = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

/**
 * WordManagementPage:
 * Comprehensive Word Management Dashboard with full-dataset search,
 * multi-column sorting, filter controls, pagination, and administrative CRUD.
 */
export function WordManagementPage() {
  // Full dataset loaded from API
  const [allWords, setAllWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");

  // Sorting
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Summary metrics state
  const [summaryStats, setSummaryStats] = useState({ total: 0, active: 0, inactive: 0 });

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

  // Filter and sort the full dataset
  const filteredAndSortedWords = useMemo(() => {
    let result = [...allWords];

    // 1. Status Filter
    if (statusFilter === "ACTIVE") {
      result = result.filter((w) => w.is_active);
    } else if (statusFilter === "INACTIVE") {
      result = result.filter((w) => !w.is_active);
    }

    // 2. Difficulty Filter
    if (difficultyFilter !== "ALL") {
      result = result.filter(
        (w) => String(w.difficulty).toUpperCase() === difficultyFilter
      );
    }

    // 3. Search Filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter((w) => {
        const wordMatch = (w.word || "").toLowerCase().includes(query);
        const hintMatch = (w.hint || "").toLowerCase().includes(query);
        return wordMatch || hintMatch;
      });
    }

    // 4. Column Sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === "word") {
        comparison = (a.word || "").localeCompare(b.word || "");
      } else if (sortField === "difficulty") {
        const rankA = DIFFICULTY_RANK[a.difficulty] || 0;
        const rankB = DIFFICULTY_RANK[b.difficulty] || 0;
        comparison = rankA - rankB;
      } else if (sortField === "hint") {
        comparison = (a.hint || "").localeCompare(b.hint || "");
      } else {
        // default by internal ID
        const idA = a.id ?? 0;
        const idB = b.id ?? 0;
        comparison = idA - idB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [allWords, statusFilter, difficultyFilter, searchTerm, sortField, sortDirection]);

  // Total matching count after filters
  const totalMatching = filteredAndSortedWords.length;

  // Total pages
  const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize));

  // Current page records slice
  const paginatedWords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedWords.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedWords, currentPage, pageSize]);

  // Reset current page if out of bounds after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Handler: Column Sort Click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Handler: Search Change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handler: Status Filter Change
  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  // Handler: Difficulty Filter Change
  const handleDifficultyChange = (newDifficulty) => {
    setDifficultyFilter(newDifficulty);
    setCurrentPage(1);
  };

  // Handler: Clear All Filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDifficultyFilter("ALL");
    setCurrentPage(1);
  };

  // Handler: Page Size Change
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Handler: Add Word
  const handleCreateNewWord = () => {
    setEditingWord(null);
    setIsWordModalOpen(true);
  };

  // Handler: Edit Word
  const handleEditWord = (word) => {
    setEditingWord(word);
    setIsWordModalOpen(true);
  };

  // Handler: Save (Create or Update) Word
  const handleSaveWord = async (payload, wordId) => {
    setIsSavingWord(true);
    try {
      if (wordId) {
        await wordService.updateWord(wordId, payload);
        toast.success(`Word "${payload.word.toUpperCase()}" updated successfully!`);
      } else {
        await wordService.createWord(payload);
        toast.success(`Word "${payload.word.toUpperCase()}" added to dictionary!`);
      }
      await loadWordsData();
      return true;
    } catch (err) {
      const errMsg = err?.message || "Failed to save word.";
      toast.error(errMsg);
      return false;
    } finally {
      setIsSavingWord(false);
    }
  };

  // Handler: Toggle Active / Inactive
  const handleToggleActive = async (word) => {
    if (word.is_active) {
      // Prompt deactivation modal
      setDeleteModalState({
        isOpen: true,
        word,
        isPermanent: false,
      });
    } else {
      // Re-activate immediately
      try {
        await wordService.updateWord(word.id, { is_active: true });
        toast.success(`Word "${word.word.toUpperCase()}" activated for gameplay!`);
        await loadWordsData();
      } catch (err) {
        toast.error(err?.message || "Failed to activate word.");
      }
    }
  };

  // Handler: Open Permanent Delete Modal
  const handleOpenPermanentDelete = (word) => {
    setDeleteModalState({
      isOpen: true,
      word,
      isPermanent: true,
    });
  };

  // Handler: Confirm Deactivation or Permanent Deletion
  const handleConfirmDeleteAction = async (wordId, securityKey) => {
    setIsProcessingDelete(true);
    try {
      if (deleteModalState.isPermanent) {
        await wordService.permanentDeleteWord(wordId, securityKey);
        toast.success("Word permanently removed from dictionary.");
      } else {
        await wordService.deactivateWord(wordId);
        toast.success("Word deactivated successfully.");
      }
      await loadWordsData();
      return true;
    } catch (err) {
      const errMsg = err?.message || "Operation failed.";
      toast.error(errMsg);
      return false;
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const isFiltered =
    Boolean(searchTerm) || statusFilter !== "ALL" || difficultyFilter !== "ALL";

  return (
    <div className="word-management-container" role="main" aria-label="Word Management Dashboard">
      {/* 1. Page Header */}
      <WordPageHeader onAddWordClick={handleCreateNewWord} />

      {/* 2. Compact Horizontal Dictionary Summary Strip */}
      <WordSummaryStrip summary={summaryStats} isLoading={isLoading} />

      {/* 3. Search & Filter Toolbar */}
      <WordFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={handleDifficultyChange}
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

      {/* 5. 4-Column Words Data Table with Sorting */}
      <WordTable
        words={paginatedWords}
        isLoading={isLoading}
        isFiltered={isFiltered}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onClearFilters={handleClearFilters}
        onAddWord={handleCreateNewWord}
        onEditWord={handleEditWord}
        onToggleActive={handleToggleActive}
        onDeleteWord={handleOpenPermanentDelete}
      />

      {/* 6. Pagination Footer */}
      {!isLoading && (
        <WordPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalMatching}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      )}

      {/* 7. Add / Edit Word Modal */}
      <WordModal
        isOpen={isWordModalOpen}
        onClose={() => setIsWordModalOpen(false)}
        onSave={handleSaveWord}
        editingWord={editingWord}
        isSaving={isSavingWord}
      />

      {/* 8. Deactivate / Permanent Delete Confirmation Modal */}
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
