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
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/* -------------------------------------------------
   1. Rating Type Definition
   ------------------------------------------------- */
interface RatingRow {
  name: string;
  rating?: number | string; // depending on your DocType fieldtype
  modified?: string;
}

type SortDirection = "asc" | "dsc";
interface SortConfig {
  key: keyof RatingRow;
  direction: SortDirection;
}

const SORT_OPTIONS: { label: string; key: keyof RatingRow }[] = [
  { label: "Last Updated On", key: "modified" },
  { label: "ID", key: "name" },
  { label: "Rating", key: "rating" },
];

type ViewMode = "grid" | "list";

export default function RatingPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const doctypeName = "Rating";

  const [rows, setRows] = React.useState<RatingRow[]>([]);
  const [view, setView] = React.useState<ViewMode>("list"); // default LIST
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
     3. FETCH RATINGS (only name, rating, modified)
     ------------------------------------------------- */
  React.useEffect(() => {
    const fetchEntries = async () => {
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
            "rating",
            "modified",
          ]),
          limit_page_length: "20",
          order_by: "modified desc",
        };

        if (debouncedSearch) {
          params.or_filters = JSON.stringify({
            name: ["like", `%${debouncedSearch}%`],
            rating: ["like", `%${debouncedSearch}%`],
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
        const mapped: RatingRow[] = raw.map((r: any) => ({
          name: r.name,
          rating: r.rating,
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

    fetchEntries();
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized, debouncedSearch]);

  /* -------------------------------------------------
     4. SORTING LOGIC
     ------------------------------------------------- */
  const sortedRows = React.useMemo(() => {
    const sortable = [...rows];
    sortable.sort((a, b) => {
      const aValue = String(a[sortConfig.key] ?? "");
      const bValue = String(b[sortConfig.key] ?? "");
      const compare = aValue.localeCompare(bValue);
      return sortConfig.direction === "asc" ? compare : -compare;
    });
    return sortable;
  }, [rows, sortConfig]);

  const requestSort = (key: keyof RatingRow) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "dsc";
    }
    setSortConfig({ key, direction });
  };

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.key === sortConfig.key)?.label || "Sort By";

  const getFieldsForRow = (row: RatingRow): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    if (row.rating !== undefined && row.rating !== null)
      fields.push({ label: "Rating", value: String(row.rating) });
    if (row.modified)
      fields.push({ label: "Last Updated", value: row.modified });
    return fields;
  };

  const title = "Rating";

  const handleCardClick = (id: string) => {
    router.push(`/lis-management/doctype/rating/${id}`);
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
        style={{ minWidth: "600px", whiteSpace: "nowrap" }}
      >
        <thead>
          <tr>
            <th
              style={{ cursor: "pointer", minWidth: 160 }}
              onClick={() => requestSort("name")}
            >
              ID
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 160 }}
              onClick={() => requestSort("rating")}
            >
              Rating
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 200 }}
              onClick={() => requestSort("modified")}
            >
              Last Updated
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
                <td style={{ minWidth: 160 }}>{row.name}</td>
                <td style={{ minWidth: 160 }}>{row.rating ?? "—"}</td>
                <td style={{ minWidth: 200 }}>{row.modified ?? "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: "32px" }}>
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
            subtitle={row.rating !== undefined && row.rating !== null ? `Rating: ${row.rating}` : "—"}
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
        Loading ratings...
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
          <p>Ratings list</p>
        </div>
        <Link href="/lis-management/doctype/rating/new" passHref>
          <button className="btn btn--primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add {title}
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
            placeholder="Search ID or Rating..."
            className="form-control w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search Rating"
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
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg:white dark:hover:bg-gray-700 rounded-md transition-colors"
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

      <div className="view-container" style={{ marginTop: "1.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}
