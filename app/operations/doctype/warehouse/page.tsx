// app/operations/doctype/warehouse/page.tsx
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
   Warehouse Type Definition
   ------------------------------------------------- */
interface Warehouse {
  name: string;
  is_group?: 0 | 1;
  parent_warehouse?: string;
  company?: string;
  warehouse_type?: string;
  account?: string;
  modified?: string;
}

type SortDirection = "asc" | "dsc";
interface SortConfig {
  key: keyof Warehouse;
  direction: SortDirection;
}

const SORT_OPTIONS: { label: string; key: keyof Warehouse }[] = [
  { label: "Last Updated On", key: "modified" },
  { label: "Warehouse ID", key: "name" },
  { label: "Company", key: "company" },
  { label: "Parent Warehouse", key: "parent_warehouse" },
  { label: "Warehouse Type", key: "warehouse_type" },
];

type ViewMode = "grid" | "list";

export default function WarehousePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Warehouse";

  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
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
     FETCH WAREHOUSES
     ------------------------------------------------- */
  React.useEffect(() => {
    const fetchWarehouses = async () => {
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
            "is_group",
            "parent_warehouse",
            "company",
            "warehouse_type",
            "account",
            "modified",
          ]),
          limit_page_length: "20",
          order_by: "modified desc",
        };

        if (debouncedSearch) {
          params.or_filters = JSON.stringify({
            name: ["like", `%${debouncedSearch}%`],
            company: ["like", `%${debouncedSearch}%`],
            parent_warehouse: ["like", `%${debouncedSearch}%`],
            warehouse_type: ["like", `%${debouncedSearch}%`],
            account: ["like", `%${debouncedSearch}%`],
          });
        }

        const resp = await axios.get(`${API_BASE_URL}/Warehouse`, {
          params,
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });

        const raw = resp.data?.data ?? [];
        const mapped: Warehouse[] = raw.map((r: any) => ({
          name: r.name,
          is_group: r.is_group,
          parent_warehouse: r.parent_warehouse,
          company: r.company,
          warehouse_type: r.warehouse_type,
          account: r.account,
          modified: r.modified,
        }));

        setWarehouses(mapped);
      } catch (err: any) {
        console.error("API error:", err);
        setError(err.response?.status === 403 ? "Unauthorized" : "Failed to fetch warehouses");
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, [apiKey, apiSecret, isAuthenticated, isInitialized, debouncedSearch]);

  /* -------------------------------------------------
     SORTING LOGIC
     ------------------------------------------------- */
  const sortedWarehouses = React.useMemo(() => {
    const sortable = [...warehouses];
    sortable.sort((a, b) => {
      const aValue = (a[sortConfig.key] || "") as string;
      const bValue = (b[sortConfig.key] || "") as string;
      const compare = aValue.localeCompare(bValue);
      return sortConfig.direction === "asc" ? compare : -compare;
    });
    return sortable;
  }, [warehouses, sortConfig]);

  const requestSort = (key: keyof Warehouse) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "dsc";
    }
    setSortConfig({ key, direction });
  };

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.key === sortConfig.key)?.label || "Sort By";

  const getFieldsForWarehouse = (w: Warehouse): RecordCardField[] => {
    return [
      { label: "Company", value: w.company || "—" },
      { label: "Parent", value: w.parent_warehouse || "—" },
      { label: "Type", value: w.warehouse_type || "—" },
      { label: "Account", value: w.account || "—" },
      {
        label: "Group",
        value: w.is_group ? "Yes" : "No",
      },
    ].filter((f) => f.value !== "—"); // optional: hide empty fields
  };

  const handleCardClick = (id: string) => {
    router.push(`/operations/doctype/warehouse/${id}`);
  };

  /* -------------------------------------------------
     RENDERERS
     ------------------------------------------------- */
  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("name")}>
              Warehouse ID
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("is_group")}>
              Is Group
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("parent_warehouse")}>
              Parent Warehouse
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("company")}>
              Company
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("warehouse_type")}>
              Type
            </th>
            <th>Account</th>
          </tr>
        </thead>
        <tbody>
          {sortedWarehouses.length ? (
            sortedWarehouses.map((w) => (
              <tr
                key={w.name}
                onClick={() => handleCardClick(w.name)}
                style={{ cursor: "pointer" }}
              >
                <td>{w.name}</td>
                <td>{w.is_group ? "Yes" : "No"}</td>
                <td>{w.parent_warehouse || "—"}</td>
                <td>{w.company || "—"}</td>
                <td>{w.warehouse_type || "—"}</td>
                <td>{w.account || "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "32px" }}>
                No warehouses found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderGridView = () => (
    <div className="equipment-grid">
      {warehouses.length ? (
        warehouses.map((w) => (
          <RecordCard
            key={w.name}
            title={w.name}
            subtitle={w.company || "No company"}
            fields={getFieldsForWarehouse(w)}
            onClick={() => handleCardClick(w.name)}
          />
        ))
      ) : (
        <p style={{ color: "var(--color-text-secondary)" }}>No warehouses found.</p>
      )}
    </div>
  );

  if (loading && warehouses.length === 0)
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        Loading warehouses...
      </div>
    );

  if (error && warehouses.length === 0)
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        {error}
      </div>
    );

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Warehouses</h2>
          <p>List of warehouses with company, parent, type and account</p>
        </div>
        <Link href="/operations/doctype/warehouse/new" passHref>
          <button className="btn btn--primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Warehouse
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
        {/* Search */}
        <div className="relative" style={{ flexGrow: 1, maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="Search ID, Company, Parent, Type..."
            className="form-control w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search Warehouses"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
        </div>

        {/* Sort & View Switcher */}
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

      <div className="view-container" style={{ marginTop: "1.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}