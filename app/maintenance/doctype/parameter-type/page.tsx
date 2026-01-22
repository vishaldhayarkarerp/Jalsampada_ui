"use client";

import * as React from "react";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { BulkActionBar } from "@/components/BulkActionBar";
import { Plus, List, LayoutGrid, ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, Check } from "lucide-react";
import { useRouter } from "next/navigation";

/* -------------------------------------------------
   Types
------------------------------------------------- */
interface ParameterChecklist {
  name: string;
  monitoring_type?: string;
  asset_category?: string;
}

type ViewMode = "grid" | "list";

interface Asset {
    name: string;
    created_on: string,
    most_used: string,
    status?: string;
    modified?: string;
}

type SortDirection = "asc" | "desc";
interface SortConfig {
    key: keyof Asset;
    direction: SortDirection;
}

/* -------------------------------------------------
   MOCK DATA (UI ONLY)
------------------------------------------------- */
const MOCK_RECORDS: ParameterChecklist[] = [
  {
    name: "PC-0001",
  },
  {
    name: "PC-0002",
  },
  {
    name: "PC-0003",
  },
];

const SORT_OPTIONS: { label: string; key: keyof Asset }[] = [
    { label: "Last Updated On", key: "modified" },
    { label: "ID", key: "name" },
    { label: "Created On", key: "created_on" },
    { label: "Most Used", key: "most_used" },
];

export default function DoctypePage() {
    const router = useRouter()
  const title = "Parameter Type";

  const [records, setRecords] =
    React.useState<ParameterChecklist[]>(MOCK_RECORDS);

  const [view, setView] = React.useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = React.useState(false);
    const [isSortMenuOpen, setIsSortMenuOpen] = React.useState(false);
        const sortMenuRef = React.useRef<HTMLDivElement>(null);
        const [sortConfig, setSortConfig] = React.useState<SortConfig>({
            key: "modified",
            direction: "desc",
        });

  /* -------------------------------------------------
     Derived state
  ------------------------------------------------- */
  const filteredRecords = React.useMemo(() => {
    if (!searchTerm) return records;
    return records.filter((r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const isAllSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.has(r.name));

  /* -------------------------------------------------
     Selection handlers (UI only)
  ------------------------------------------------- */
  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.name)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  /* -------------------------------------------------
     Bulk delete (UI only)
  ------------------------------------------------- */
  const handleBulkDelete = async () => {
    setIsDeleting(true);

    setTimeout(() => {
      setRecords((prev) =>
        prev.filter((r) => !selectedIds.has(r.name))
      );
      clearSelection();
      setIsDeleting(false);
      console.log("Bulk delete completed (UI only)");
    }, 500);
  };

  /* -------------------------------------------------
     Navigation placeholders
  ------------------------------------------------- */
  const handleCardClick = (id: string) => {
    console.log("Navigate to record:", id);
  };

  const handleAddNew = () => {
    console.log("Navigate to create new", title);
  };

  /* -------------------------------------------------
     Helpers
  ------------------------------------------------- */
 const currentSortLabel = SORT_OPTIONS.find((opt) => opt.key === sortConfig.key)?.label || "Sort By";

  const getFieldsForRecord = (
    record: ParameterChecklist
  ): RecordCardField[] => [
    { label: "Monitoring Type", value: record.monitoring_type || "-" },
    { label: "Asset Category", value: record.asset_category || "-" },
  ];

  /* -------------------------------------------------
     Views
  ------------------------------------------------- */
  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th style={{ width: 40, textAlign: "center" }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
            </th>
            <th style={{ width: "100%" }}>ID</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.length ? (
            filteredRecords.map((record) => {
              const isSelected = selectedIds.has(record.name);
              return (
                <tr
                  key={record.name}
                  onClick={() => handleCardClick(record.name)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: isSelected
                      ? "#f0f9ff"
                      : undefined,
                  }}
                >
                  <td
                    style={{ textAlign: "center" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(record.name)}
                    />
                  </td>
                  <td>{record.name}</td>
                  <td>{record.monitoring_type}</td>
                  <td>{record.asset_category}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderGridView = () => (
    <div className="equipment-grid">
      {filteredRecords.length ? (
        filteredRecords.map((record) => (
          <RecordCard
            key={record.name}
            title={record.name}
            fields={getFieldsForRecord(record)}
            onClick={() => handleCardClick(record.name)}
          />
        ))
      ) : (
        <p>No records found.</p>
      )}
    </div>
  );

  /* -------------------------------------------------
     Render
  ------------------------------------------------- */
  return (
    <div className="module active">
      <div
        className="module-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2>{title}</h2>
          <p>Manage Parameter Checklist</p>
        </div>

        {selectedIds.size > 0 ? (
          <BulkActionBar
            selectedCount={selectedIds.size}
            onClear={clearSelection}
            onDelete={handleBulkDelete}
            isDeleting={isDeleting}
          />
        ) : (
          <button
            className="btn btn--primary flex items-center gap-2"
              onClick={() => router.push('/maintenance/doctype/parameter-type/new')}
          >
            <Plus className="w-4 h-4" /> Add {title}
          </button>
        )}
      </div>

       <div
                className="search-filter-section"
                style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center"
                }}
            >
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: "1" }}>
                    <div style={{ minWidth: "200px" }}>
                        <input
                            type="text"
                            placeholder="Search ID"
                            className="form-control w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search Assets"
                        />
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginLeft: "auto" }}>
                    <div className="relative">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                            <button
                                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                                onClick={() =>
                                    setSortConfig((prev: any) => ({
                                        ...prev,
                                        direction: prev.direction === "asc" ? "desc" : "asc",
                                    }))
                                }
                            >
                                {sortConfig.direction === "asc" ? (
                                    <ArrowDownWideNarrow className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                ) : (
                                    <ArrowUpNarrowWide className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                )}
                            </button>
                            <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1"></div>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                            >
                                {currentSortLabel}
                                <ChevronDown className="w-3 h-3 opacity-70" />
                            </button>
                        </div>
                        {isSortMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                                <div className="py-1">
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort By</div>
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.key}
                                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${sortConfig.key === option.key
                                                ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 font-medium"
                                                : "text-gray-700 dark:text-gray-200"
                                                }`}
                                            onClick={() => {
                                                setSortConfig((prev) => ({ ...prev, key: option.key }));
                                                setIsSortMenuOpen(false);
                                            }}
                                        >
                                            {option.label}
                                            {sortConfig.key === option.key && <Check className="w-4 h-4 text-blue-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        className="btn btn--outline btn--sm flex items-center justify-center"
                        onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
                    >
                        {view === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                    </button>
                </div>
            </div>

      <div className="view-container" style={{ marginTop: "0.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}