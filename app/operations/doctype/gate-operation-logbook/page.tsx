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

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

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
   1. Gate Operation Logbook Type Definition
   ------------------------------------------------- */
interface GateOperationLogbook {
  name: string;
  lis_name?: string;
  stage?: string;
  gate_no?: string;
  gate_operation?: string;
  modified?: string;
}

type SortDirection = "asc" | "dsc";
interface SortConfig {
  key: keyof GateOperationLogbook;
  direction: SortDirection;
}

const SORT_OPTIONS: { label: string; key: keyof GateOperationLogbook }[] = [
  { label: "Last Updated On", key: "modified" },
  { label: "ID", key: "name" },
  { label: "LIS", key: "lis_name" },
  { label: "Stage", key: "stage" },
  { label: "Gate No", key: "gate_no" },
  { label: "Gate Operation", key: "gate_operation" },
];

type ViewMode = "grid" | "list";

export default function GateOperationLogbookPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Gate Operation Logbook";

  const [rows, setRows] = React.useState<GateOperationLogbook[]>([]);
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
     3. FETCH GATE OPERATION LOGBOOK
     ------------------------------------------------- */
  React.useEffect(() => {
    const fetchRows = async () => {
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
            "stage",
            "gate_no",
            "gate_operation",
            "modified",
          ]),
          limit_page_length: "20",
          order_by: "modified desc",
        };

        if (debouncedSearch) {
          params.or_filters = JSON.stringify({
            name: ["like", `%${debouncedSearch}%`],
            lis_name: ["like", `%${debouncedSearch}%`],
            stage: ["like", `%${debouncedSearch}%`],
            gate_no: ["like", `%${debouncedSearch}%`],
          });
        }

        const resp = await axios.get(
          `${API_BASE_URL}/${encodeURIComponent(doctypeName)}`,
          {
            params,
            headers: { Authorization: `token ${apiKey}:${apiSecret}` },
            withCredentials: true,
          }
        );

        const raw = resp.data?.data ?? [];
        const mapped: GateOperationLogbook[] = raw.map((r: any) => ({
          name: r.name,
          lis_name: r.lis_name,
          stage: r.stage,
          gate_no: r.gate_no,
          gate_operation: r.gate_operation,
          modified: r.modified,
        }));

        setRows(mapped);
      } catch (err: any) {
        console.error("API error:", err);
        setError(err.response?.status === 403 ? "Unauthorized" : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };

    if (doctypeName === "Gate Operation Logbook") fetchRows();
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized, debouncedSearch]);

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

  const requestSort = (key: keyof GateOperationLogbook) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "dsc";
    }
    setSortConfig({ key, direction });
  };

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.key === sortConfig.key)?.label || "Sort By";

  const getFieldsForRow = (row: GateOperationLogbook): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    if (row.lis_name) fields.push({ label: "LIS", value: row.lis_name });
    if (row.stage) fields.push({ label: "Stage", value: row.stage });
    if (row.gate_no) fields.push({ label: "Gate No", value: row.gate_no });
    if (row.gate_operation)
      fields.push({ label: "Gate Operation", value: row.gate_operation });
    return fields;
  };

  const title = "Gate Operation Logbook";

  const handleCardClick = (id: string) => {
    router.push(`/operations/doctype/gate-operation-logbook/${id}`);
  };

  /* -------------------------------------------------
     6. RENDERERS
     ------------------------------------------------- */

  const renderListView = () => (
    <div
      className="stock-table-container thin-scroll-x"
      style={{ overflowX: "auto" }}
    >
      <table
        className="stock-table"
        style={{ minWidth: "800px", whiteSpace: "nowrap" }}
      >
        <thead>
          <tr>
            <th
              style={{ cursor: "pointer", minWidth: 140 }}
              onClick={() => requestSort("name")}
            >
              ID
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 160 }}
              onClick={() => requestSort("lis_name")}
            >
              LIS
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 140 }}
              onClick={() => requestSort("stage")}
            >
              Stage
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 120 }}
              onClick={() => requestSort("gate_no")}
            >
              Gate No
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 180 }}
              onClick={() => requestSort("gate_operation")}
            >
              Gate Operation
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.length ? (
            sortedRows.map((row) => (
              <tr
                key={row.name}
                onClick={() => handleCardClick(row.name)}
                style={{ cursor: "pointer" }}
              >
                <td style={{ minWidth: 140 }}>{row.name}</td>
                <td style={{ minWidth: 160 }}>{row.lis_name || "—"}</td>
                <td style={{ minWidth: 140 }}>{row.stage || "—"}</td>
                <td style={{ minWidth: 120 }}>{row.gate_no || "—"}</td>
                <td style={{ minWidth: 180 }}>{row.gate_operation || "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: "32px" }}>
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
      {rows.length ? (
        rows.map((row) => (
          <RecordCard
            key={row.name}
            title={row.name}
            subtitle={row.lis_name || "—"}
            fields={getFieldsForRow(row)} // name in title, others as fields
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
        Loading gate operation logbook...
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
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>Gate operation history with LIS and stages</p>
        </div>
        <Link href="/operations/doctype/gate-operation-logbook/new" passHref>
          <button className="btn btn--primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </Link>
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
        {/* Left: Single Omni-Search */}
        <div className="relative" style={{ flexGrow: 1, maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="Search ID, LIS, Stage, or Gate No..."
            className="form-control w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search Gate Operation Logbook"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
        </div>

        {/* Right: Sort Pill + View Switcher */}
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
                aria-label={
                  sortConfig.direction === "asc"
                    ? "Sort Descending"
                    : "Sort Ascending"
                }
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
                aria-label="Open Sort Options"
              >
                {currentSortLabel}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </div>

            {isSortMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
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
