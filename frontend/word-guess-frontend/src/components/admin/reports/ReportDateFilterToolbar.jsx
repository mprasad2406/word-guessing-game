import React from "react";
import { Filter, Calendar, X, Check } from "lucide-react";
import { formatReportDate } from "../../../utils/dateUtils";

export function ReportDateFilterToolbar({
  filterPreset,
  onPresetChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  onApplyCustomFilter,
  onResetFilter,
  activeFilterDescription,
}) {
  const presets = [
    { id: "ALL", label: "All Time" },
    { id: "TODAY", label: "Today" },
    { id: "7D", label: "Last 7 Days" },
    { id: "30D", label: "Last 30 Days" },
    { id: "CUSTOM", label: "Custom Range" },
  ];

  return (
    <div className="reports-filter-toolbar">
      <div className="reports-filter-left">
        {/* Preset Selector */}
        <div className="reports-preset-group" role="radiogroup" aria-label="Date presets">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={filterPreset === p.id}
              className={`reports-preset-btn ${filterPreset === p.id ? "is-active" : ""}`}
              onClick={() => onPresetChange(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs (if CUSTOM is active) */}
        {filterPreset === "CUSTOM" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onApplyCustomFilter();
            }}
            className="reports-custom-inputs"
          >
            <input
              type="date"
              className="report-date-input"
              value={customStartDate || ""}
              onChange={(e) => onCustomStartDateChange(e.target.value)}
              aria-label="Start date"
              placeholder="From"
            />
            <span className="text-muted small">to</span>
            <input
              type="date"
              className="report-date-input"
              value={customEndDate || ""}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              aria-label="End date"
              placeholder="To"
            />
            <button
              type="submit"
              className="btn btn-sm btn-primary py-1 px-2"
              title="Apply date range"
              aria-label="Apply date range"
            >
              <Check size={13} />
            </button>
          </form>
        )}
      </div>

      <div className="reports-filter-right">
        {activeFilterDescription && (
          <span className="reports-active-filter-badge" title="Active date filter">
            <Calendar size={12} />
            <span>{activeFilterDescription}</span>
          </span>
        )}

        {filterPreset !== "ALL" && (
          <button
            type="button"
            className="btn-filter-reset"
            onClick={onResetFilter}
            aria-label="Reset date filters"
            title="Reset filters to default"
          >
            <X size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
