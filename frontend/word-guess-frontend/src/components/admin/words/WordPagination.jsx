import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * WordPagination:
 * Clean pagination footer displaying record ranges, numbered page buttons,
 * previous/next controls, and page-size selector.
 */
export function WordPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}) {
  if (totalItems === 0) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, currentPage * pageSize);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="word-pagination-container" aria-label="Word dictionary pagination">
      {/* Range Info */}
      <div className="pagination-range-info">
        <span>
          Showing <strong className="num-tabular">{startIdx}</strong>–
          <strong className="num-tabular">{endIdx}</strong> of{" "}
          <strong className="num-tabular">{totalItems}</strong> words
        </span>
      </div>

      {/* Page Navigation */}
      <div className="pagination-controls-group">
        {/* Page Size Selector */}
        {onPageSizeChange && (
          <div className="page-size-selector">
            <label htmlFor="page-size-select" className="page-size-label">
              Rows:
            </label>
            <select
              id="page-size-select"
              className="page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={isLoading}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="pagination-nav" aria-label="Page navigation">
            {/* Previous Page */}
            <button
              type="button"
              className="btn-page-nav"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || isLoading}
              aria-label="Previous Page"
            >
              <ChevronLeft size={15} />
              <span>Prev</span>
            </button>

            {/* Numbered Page Buttons */}
            <div className="pagination-numbers-list">
              {pages.map((pageNum, idx) => {
                const prev = pages[idx - 1];
                const showEllipsis = prev && pageNum - prev > 1;

                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && <span className="pagination-ellipsis">…</span>}
                    <button
                      type="button"
                      className={`btn-page-number ${currentPage === pageNum ? "active" : ""}`}
                      onClick={() => onPageChange(pageNum)}
                      disabled={isLoading}
                      aria-current={currentPage === pageNum ? "page" : undefined}
                      aria-label={`Page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              className="btn-page-nav"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages || isLoading}
              aria-label="Next Page"
            >
              <span>Next</span>
              <ChevronRight size={15} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
