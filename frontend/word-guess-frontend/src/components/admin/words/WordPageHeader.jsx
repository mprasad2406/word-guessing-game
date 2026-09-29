import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus, Shield } from "lucide-react";

/**
 * WordPageHeader:
 * Compact page heading with breadcrumb, title, subtitle, and primary "Add Word" action.
 */
export function WordPageHeader({ onAddWordClick }) {
  return (
    <header className="word-page-header" aria-label="Word Management Header">
      <div className="word-header-left">
        <nav className="word-breadcrumb" aria-label="Breadcrumb">
          <Link to="/admin" className="word-breadcrumb-link">
            <Shield size={13} />
            <span>Admin</span>
          </Link>
          <ChevronRight size={12} className="word-breadcrumb-separator" aria-hidden="true" />
          <span className="word-breadcrumb-current" aria-current="page">
            Word Management
          </span>
        </nav>
        <h1 className="word-page-title">Word Management</h1>
        <p className="word-page-subtitle">
          Manage your game dictionary, clues, difficulty levels and word availability.
        </p>
      </div>

      <div className="word-header-right">
        <button
          type="button"
          className="btn-add-word-primary"
          onClick={onAddWordClick}
          aria-label="Add New Word to Dictionary"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Word</span>
        </button>
      </div>
    </header>
  );
}
