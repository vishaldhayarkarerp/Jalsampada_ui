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
  Check
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
   1. Gate Type Definition
   ------------------------------------------------- */
interface Gate {
  name: string;        // Docname (ID)
  gate: string;        // Gate field
  lis_name?: string;   // LIS name
  stage?: string;      // Stage
  modified?: string;
}

type SortDirection = "asc" | "dsc";
interface SortConfig {
  key: keyof Gate;
  direction: SortDirection;
}

const SORT_OPTIONS: { label: string; key: keyof Gate }[] = [
  { label: "Last Updated On", key: "modified" },
  { label: "ID", key: "name" },
  { label: "Gate", key: "gate" },
  { label: "LIS", key: "lis_name" },
  { label: "Stage", key: "stage" },
];

type ViewMode = "grid" | "list";

export default function GatePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Gate";

  const [gates, setGates] = React.useState<Gate[]>([]);
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
     3. FETCH GATES
     ------------------------------------------------- */
  React.useEffect(() => {
    const fetchGates = async () => {
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
            "gate",
            "lis_name",
            "stage",
            "modified",
          ]),
          limit_page_length: "20",
          order_by: "modified desc",
        };

        if (debouncedSearch) {
          // Search by ID, Gate, or LIS
          params.or_filters = JSON.stringify({
            name: ["like", `%${debouncedSearch}%`],
            gate: ["like", `%${debouncedSearch}%`],
            lis_name: ["like", `%${debouncedSearch}%`],
          });
        }

        const resp = await axios.get(`${API_BASE_URL}/Gate`, {
          params,
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });

        const raw = resp.data?.data ?? [];
        const mapped: Gate[] = raw.map((r: any) => ({
          name: r.name,
          gate: r.gate ?? "—",
          lis_name: r.lis_name,
          stage: r.stage,
          modified: r.modified,
        }));

        setGates(mapped);
      } catch (err: any) {
        console.error("API error:", err);
        setError(err.response?.status === 403 ? "Unauthorized" : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };

    if (doctypeName === "Gate") fetchGates();
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized, debouncedSearch]);

  /* -------------------------------------------------
     4. SORTING LOGIC
     ------------------------------------------------- */
  const sortedGates = React.useMemo(() => {
    const sortableGates = [...gates];
    sortableGates.sort((a, b) => {
      const aValue = (a[sortConfig.key] || "") as string;
      const bValue = (b[sortConfig.key] || "") as string;
      const compare = aValue.localeCompare(bValue);
      return sortConfig.direction === "asc" ? compare : -compare;
    });
    return sortableGates;
  }, [gates, sortConfig]);

  const requestSort = (key: keyof Gate) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "dsc";
    }
    setSortConfig({ key, direction });
  };

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.key === sortConfig.key)?.label || "Sort By";

  const getFieldsForGate = (g: Gate): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    if (g.gate) fields.push({ label: "Gate", value: g.gate });
    if (g.lis_name) fields.push({ label: "LIS", value: g.lis_name });
    if (g.stage) fields.push({ label: "Stage", value: g.stage });
    return fields;
  };

  const title = "Gate";

  const handleCardClick = (id: string) => {
    router.push(`/lis-management/doctype/gate/${id}`);
  };

  /* -------------------------------------------------
     6. RENDERERS
     ------------------------------------------------- */
  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("name")}>
              ID
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("gate")}>
              Gate
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("lis_name")}>
              LIS
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("stage")}>
              Stage
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedGates.length ? (
            sortedGates.map((g) => (
              <tr
                key={g.name}
                onClick={() => handleCardClick(g.name)}
                style={{ cursor: "pointer" }}
              >
                <td>{g.name}</td>
                <td>{g.gate || "—"}</td>
                <td>{g.lis_name || "—"}</td>
                <td>{g.stage || "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: "32px" }}>
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
      {gates.length ? (
        gates.map((g) => (
          <RecordCard
            key={g.name}
            title={g.name}
            subtitle={g.gate}
            fields={getFieldsForGate(g)}
            onClick={() => handleCardClick(g.name)}
          />
        ))
      ) : (
        <p style={{ color: "var(--color-text-secondary)" }}>No records found.</p>
      )}
    </div>
  );

  if (loading && gates.length === 0)
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        Loading gates...
      </div>
    );
  if (error && gates.length === 0)
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
          <p>Gate mapping with LIS and stages</p>
        </div>
        <Link href="/lis-management/doctype/gate/new" passHref>
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
            placeholder="Search ID, Gate, or LIS..."
            className="form-control w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search Gates"
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

              <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1"></div>

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

      <div className="view-container" style={{ marginTop: "1.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}
