"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Search,
  Plus,
  List,
  LayoutGrid,
  ChevronDown,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Check,
} from "lucide-react";

// 🟢 New Imports for Bulk Delete
import { useSelection } from "@/hooks/useSelection";
import { BulkActionBar } from "@/components/BulkActionBar";
import { bulkDeleteRPC } from "@/api/rpc";
import { toast } from "sonner";

// 🟢 Changed: Point to Root URL
const API_BASE_URL = "http://103.219.1.138:4412";

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/* -------------------------------------------------
   1. Repair Work Requirement Type Definition
   ------------------------------------------------- */
interface RepairWorkRequirement {
  name: string;
  lis_name?: string;
  work_requirement_number?: string;
  stage?: string;
  prepared_by?: string;
  modified?: string;
}

type SortDirection = "asc" | "dsc";
interface SortConfig {
  key: keyof RepairWorkRequirement;
  direction: SortDirection;
}

const SORT_OPTIONS: { label: string; key: keyof RepairWorkRequirement }[] = [
  { label: "Last Updated On", key: "modified" },
  { label: "ID", key: "name" },
  { label: "Work Requirement No", key: "work_requirement_number" },
  { label: "LIS", key: "lis_name" },
  { label: "Stage", key: "stage" },
  { label: "Prepared By", key: "prepared_by" },
];

type ViewMode = "grid" | "list";

export default function RepairWorkRequirementPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Repair Work Requirement";

  const [rows, setRows] = React.useState<RepairWorkRequirement[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: "modified",
    direction: "dsc",
  });

  const [isSortMenuOpen, setIsSortMenuOpen] = React.useState(false);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);

  // 🟢 1. Initialize Selection Hook
  const {
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    isAllSelected
  } = useSelection(rows, "name");

  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* -------------------------------------------------
     3. FETCH REPAIR WORK REQUIREMENTS
     ------------------------------------------------- */
  const fetchRows = React.useCallback(async () => {
    if (!isInitialized) return;
    if (!isAuthenticated || !apiKey || !apiSecret) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: any = {
        fields: JSON.stringify([
          "name",
          "lis_name",
          "work_requirement_number",
          "stage",
          "prepared_by",
          "modified",
        ]),
        limit_page_length: "20",
        order_by: "modified desc",
      };

      if (debouncedSearch) {
        params.or_filters = JSON.stringify([
          ["name", "like", `%${debouncedSearch}%`],
          ["lis_name", "like", `%${debouncedSearch}%`],
          ["work_requirement_number", "like", `%${debouncedSearch}%`],
          ["stage", "like", `%${debouncedSearch}%`],
          ["prepared_by", "like", `%${debouncedSearch}%`],
        ]);
      }

      // 🟢 Append /api/resource manually
      const resp = await axios.get(
        `${API_BASE_URL}/api/resource/${encodeURIComponent(doctypeName)}`,
        {
          params,
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        }
      );

      const raw = resp.data?.data ?? [];
      const mapped: RepairWorkRequirement[] = raw.map((r: any) => ({
        name: r.name,
        lis_name: r.lis_name,
        work_requirement_number: r.work_requirement_number,
        stage: r.stage,
        prepared_by: r.prepared_by,
        modified: r.modified,
      }));

      setRows(mapped);
    } catch (err: any) {
      console.error("API error:", err);
      setError(err.response?.status === 403 ? "Unauthorized" : "Failed to fetch records");
    } finally {
      setLoading(false);
    }
  }, [apiKey, apiSecret, isAuthenticated, isInitialized, debouncedSearch, doctypeName]);

  React.useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // 🟢 2. Handle Bulk Delete
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (!window.confirm(`Are you sure you want to permanently delete ${count} records?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await bulkDeleteRPC(
        doctypeName,
        Array.from(selectedIds),
        API_BASE_URL,
        apiKey!,
        apiSecret!
      );

      toast.success(`Successfully deleted ${count} records.`);
      clearSelection();
      fetchRows();
    } catch (err: any) {
      console.error("Bulk Delete Error:", err);
      toast.error("Failed to delete records", {
        description: err.response?.data?.exception || err.message,
        duration: Infinity
      });
    } finally {
      setIsDeleting(false);
    }
  };

  /* -------------------------------------------------
     4. SORTING LOGIC
     ------------------------------------------------- */
  const sortedRows = React.useMemo(() => {
    const sortable = [...rows];
    sortable.sort((a, b) => {
      const aValue = (a[sortConfig.key] || "") as string;
      const bValue = (b[sortConfig.key] || "") as string;
      const compare = aValue.localeCompare(bValue);
      return sortConfig.direction === "asc" ? compare : -compare;
    });
    return sortable;
  }, [rows, sortConfig]);

  const requestSort = (key: keyof RepairWorkRequirement) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "dsc";
    }
    setSortConfig({ key, direction });
  };

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.key === sortConfig.key)?.label || "Sort By";

  const getFieldsForRow = (row: RepairWorkRequirement): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    if (row.lis_name) fields.push({ label: "LIS", value: row.lis_name });
    if (row.work_requirement_number)
      fields.push({ label: "Work Req. No", value: row.work_requirement_number });
    if (row.stage) fields.push({ label: "Stage", value: row.stage });
    if (row.prepared_by)
      fields.push({ label: "Prepared By", value: row.prepared_by });
    return fields;
  };

  const title = "Repair Work Requirement";

  const handleCardClick = (id: string) => {
    router.push(`/operations/doctype/repair-work-requirement/${encodeURIComponent(id)}`);
  };

  /* -------------------------------------------------
     6. RENDERERS
     ------------------------------------------------- */

  const renderListView = () => (
    <div className="stock-table-container thin-scroll-x" style={{ overflowX: "auto" }}>
      <table className="stock-table" style={{ minWidth: "900px", whiteSpace: "nowrap" }}>
        <thead>
          <tr>
            {/* 🟢 Header Checkbox */}
            <th style={{ width: "40px", textAlign: "center" }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                style={{ cursor: "pointer", width: "16px", height: "16px" }}
              />
            </th>
            <th style={{ cursor: "pointer", minWidth: 140 }} onClick={() => requestSort("name")}>
              ID
            </th>
            <th style={{ cursor: "pointer", minWidth: 180 }} onClick={() => requestSort("lis_name")}>
              LIS Name
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 200 }}
              onClick={() => requestSort("work_requirement_number")}
            >
              Work Requirement No
            </th>
            <th style={{ cursor: "pointer", minWidth: 160 }} onClick={() => requestSort("stage")}>
              Stage
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 200 }}
              onClick={() => requestSort("prepared_by")}
            >
              Prepared By
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.length ? (
            sortedRows.map((row) => {
              const isSelected = selectedIds.has(row.name);
              return (
                <tr
                  key={row.name}
                  onClick={() => handleCardClick(row.name)}
                  style={{ 
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--color-surface-selected, #f0f9ff)" : undefined
                  }}
                >
                  {/* 🟢 Row Checkbox */}
                  <td 
                    style={{ textAlign: "center" }} 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(row.name)}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                  </td>
                  <td style={{ minWidth: 140 }}>{row.name}</td>
                  <td style={{ minWidth: 180 }}>{row.lis_name || "—"}</td>
                  <td style={{ minWidth: 200 }}>{row.work_requirement_number || "—"}</td>
                  <td style={{ minWidth: 160 }}>{row.stage || "—"}</td>
                  <td style={{ minWidth: 200 }}>{row.prepared_by || "—"}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "32px" }}>
                No repair work requirements found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderGridView = () => (
    <div className="equipment-grid">
      {rows.length ? (
        rows.map((row) => (
          <RecordCard
            key={row.name}
            title={row.name}
            subtitle={row.work_requirement_number || "—"}
            fields={getFieldsForRow(row)}
            onClick={() => handleCardClick(row.name)}
          />
        ))
      ) : (
        <p style={{ color: "var(--color-text-secondary)" }}>No records found.</p>
      )}
    </div>
  );

  if (loading && rows.length === 0)
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        Loading repair work requirements...
      </div>
    );

  if (error && rows.length === 0)
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        {error}
      </div>
    );

  return (
    <div className="module active">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>{title}</h2>
          <p>Overview of all repair work requirements</p>
        </div>
        
        {/* 🟢 3. Header Action Switch */}
        {selectedIds.size > 0 ? (
          <BulkActionBar
            selectedCount={selectedIds.size}
            onClear={clearSelection}
            onDelete={handleBulkDelete}
            isDeleting={isDeleting}
          />
        ) : (
          <Link href="/operations/doctype/repair-work-requirement/new" passHref>
            <button className="btn btn--primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Requirement
            </button>
          </Link>
        )}
      </div>

      {/* --- FILTER BAR --- */}
      <div
        className="search-filter-section"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "1rem",
          gap: "8px",
        }}
      >
        {/* Left: Search */}
        <div className="relative" style={{ flexGrow: 1, maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="Search ID, Work Req. No, LIS, Stage, Prepared By..."
            className="form-control w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search Repair Work Requirements"
          />
          
        </div>

        {/* Right: Sort + View Switcher */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Sort Pill */}
          <div className="relative" ref={sortMenuRef}>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button
                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() =>
                  setSortConfig((prev) => ({
                    ...prev,
                    direction: prev.direction === "asc" ? "dsc" : "asc",
                  }))
                }
                title={`Sort ${sortConfig.direction === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortConfig.direction === "asc" ? (
                  <ArrowDownWideNarrow className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <ArrowUpNarrowWide className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>

              <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1" />

              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              >
                {currentSortLabel}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </div>

            {isSortMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sort By
                  </div>
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        sortConfig.key === option.key
                          ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 font-medium"
                          : "text-gray-700 dark:text-gray-200"
                      }`}
                      onClick={() => {
                        setSortConfig((prev) => ({ ...prev, key: option.key }));
                        setIsSortMenuOpen(false);
                      }}
                    >
                      {option.label}
                      {sortConfig.key === option.key && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Switcher */}
          <button
            className="btn btn--outline btn--sm flex items-center justify-center"
            onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
            aria-label={view === "grid" ? "Switch to List View" : "Switch to Grid View"}
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