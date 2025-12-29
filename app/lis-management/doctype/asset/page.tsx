"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { LinkField } from "@/components/LinkField";
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

// ── Debounce Hook ────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ── Types ────────────────────────────────────────────────────────
interface Asset {
  name: string;
  location: string;
  custom_lis_name?: string;
  custom_stage_no?: string;
  asset_category?: string;
  status?: string;
  modified?: string;
}

interface AssetCategoryOption {
  name: string;
}

type SortDirection = "asc" | "desc";
interface SortConfig {
  key: keyof Asset;
  direction: SortDirection;
}

const SORT_OPTIONS: { label: string; key: keyof Asset }[] = [
  { label: "Last Updated On", key: "modified" },
  { label: "ID", key: "name" },
  { label: "Status", key: "status" },
  { label: "Asset Category", key: "asset_category" },
  { label: "Location", key: "location" },
  { label: "LIS", key: "custom_lis_name" },
];

type ViewMode = "grid" | "list";

// ── Main Component ───────────────────────────────────────────────
export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Asset";

  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: "modified",
    direction: "desc",
  });

  const [categories, setCategories] = React.useState<AssetCategoryOption[]>([]);

  const [isSortMenuOpen, setIsSortMenuOpen] = React.useState(false);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);

  // Form for category filter
  const { control, watch } = useForm({
    defaultValues: {
      asset_category: ""
    }
  });
  
  const selectedCategory = watch("asset_category");

  // Close sort menu on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Load Asset Categories ────────────────────────────────────────
  React.useEffect(() => {
    const fetchCategories = async () => {
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) return;

      try {
        const resp = await axios.get(`${API_BASE_URL}/Asset Category`, {
          params: {
            fields: JSON.stringify(["name"]),
            limit_page_length: "100",
            order_by: "name asc",
          },
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
        });

        const data = resp.data?.data ?? [];
        setCategories([{ name: "" }, ...data]); // empty string = All
      } catch (err) {
        console.error("Failed to load asset categories:", err);
      }
    };

    fetchCategories();
  }, [isInitialized, isAuthenticated, apiKey, apiSecret]);

  // ── Fetch Assets ─────────────────────────────────────────────────
  React.useEffect(() => {
    const fetchAssets = async () => {
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
            "location",
            "custom_lis_name",
            "custom_stage_no",
            "asset_category",
            "status",
            "modified",
          ]),
          limit_page_length: "20",
          order_by: `${sortConfig.key} ${sortConfig.direction}`,
        };

        // Build filters array (Frappe style)
        const filters: any[] = [];

        if (debouncedSearch) {
          filters.push(["Asset", "name", "like", `%${debouncedSearch}%`]);
        }

        if (selectedCategory) {
          filters.push(["Asset", "asset_category", "=", selectedCategory]);
        }

        if (filters.length > 0) {
          params.filters = JSON.stringify(filters);
        }

        const resp = await axios.get(`${API_BASE_URL}/Asset`, {
          params,
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });

        const raw = resp.data?.data ?? [];
        const mapped: Asset[] = raw.map((r: any) => ({
          name: r.name,
          location: r.location ?? "—",
          custom_lis_name: r.custom_lis_name,
          custom_stage_no: r.custom_stage_no,
          asset_category: r.asset_category,
          status: r.status,
          modified: r.modified,
        }));

        setAssets(mapped);
      } catch (err: any) {
        console.error("API error:", err);
        setError(err.response?.status === 403 ? "Unauthorized" : "Failed to fetch assets");
      } finally {
        setLoading(false);
      }
    };

    if (doctypeName === "Asset") fetchAssets();
  }, [
    doctypeName,
    apiKey,
    apiSecret,
    isAuthenticated,
    isInitialized,
    debouncedSearch,
    selectedCategory,
    sortConfig.key,
    sortConfig.direction,
  ]);

  // ── Sorting Logic (client-side) ──────────────────────────────────
  const sortedAssets = React.useMemo(() => {
    const sortableAssets = [...assets];
    sortableAssets.sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      const compare = aValue.localeCompare(bValue, undefined, { numeric: true });
      return sortConfig.direction === "asc" ? compare : -compare;
    });
    return sortableAssets;
  }, [assets, sortConfig]);

  const requestSort = (key: keyof Asset) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const currentSortLabel = SORT_OPTIONS.find((opt) => opt.key === sortConfig.key)?.label || "Sort By";

  const getFieldsForAsset = (a: Asset): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    if (a.status) fields.push({ label: "Status", value: a.status });
    if (a.asset_category) fields.push({ label: "Category", value: a.asset_category });
    if (a.custom_lis_name) fields.push({ label: "LIS", value: a.custom_lis_name });
    if (a.custom_stage_no) fields.push({ label: "Stage", value: a.custom_stage_no });
    fields.push({ label: "Location", value: a.location });
    return fields;
  };

  const handleCardClick = (id: string) => {
    router.push(`/lis-management/doctype/asset/${id}`);
  };

  // ── Renderers ────────────────────────────────────────────────────
  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("name")}>ID</th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("status")}>Status</th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("asset_category")}>Category</th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("custom_lis_name")}>LIS</th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("custom_stage_no")}>Stage</th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("location")}>Location</th>
          </tr>
        </thead>
        <tbody>
          {sortedAssets.length ? (
            sortedAssets.map((a) => (
              <tr key={a.name} onClick={() => handleCardClick(a.name)} style={{ cursor: "pointer" }}>
                <td>{a.name}</td>
                <td>{a.status || "—"}</td>
                <td>{a.asset_category || "—"}</td>
                <td>{a.custom_lis_name || "—"}</td>
                <td>{a.custom_stage_no || "—"}</td>
                <td>{a.location}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "32px" }}>
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
      {assets.length ? (
        assets.map((a) => (
          <RecordCard
            key={a.name}
            title={a.name}
            subtitle={a.location}
            fields={getFieldsForAsset(a)}
            onClick={() => handleCardClick(a.name)}
          />
        ))
      ) : (
        <p style={{ color: "var(--color-text-secondary)" }}>No records found.</p>
      )}
    </div>
  );

  if (loading && assets.length === 0) {
    return <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>Loading assets...</div>;
  }
  if (error && assets.length === 0) {
    return <div className="module active" style={{ padding: "2rem" }}>{error}</div>;
  }

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Asset</h2>
          <p>Equipment locations and stages</p>
        </div>
        <Link href="/lis-management/doctype/asset/new" passHref>
          <button className="btn btn--primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </Link>
      </div>

      {/* FILTER BAR */}
      <div
        className="search-filter-section"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
          marginTop: "1rem",
        }}
      >
        {/* Filters Container */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: "1" }}>
          {/* Search */}
          <div style={{ minWidth: "200px" }}>
            <input
              type="text"
              placeholder="Search Asset ID..."
              className="form-control w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search Assets"
            />
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: "200px" }}>
            <Controller
              control={control}
              name="asset_category"
              render={({ field: { onChange, value } }) => {
                // Create a mock field object for LinkField
                const mockField = {
                  name: "asset_category",
                  label: "",
                  type: "Link" as const,
                  linkTarget: "Asset Category",
                  placeholder: "Select Category",
                  required: false,
                  defaultValue: ""
                };
                
                return (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <LinkField
                      control={control}
                      field={{ ...mockField, defaultValue: value }}
                      error={null}
                    />
                  </div>
                );
              }}
            />
          </div>
        </div>

        {/* Sort + View Toggle */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            marginLeft: "auto",
          }}
        >
          {/* Sort Pill */}
          <div className="relative" ref={sortMenuRef}>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button
                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() =>
                  setSortConfig((prev) => ({
                    ...prev,
                    direction: prev.direction === "asc" ? "desc" : "asc",
                  }))
                }
                title={`Sort ${sortConfig.direction === "asc" ? "Descending" : "Ascending"}`}
                aria-label={sortConfig.direction === "asc" ? "Sort Descending" : "Sort Ascending"}
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
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort By</div>
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
                      {sortConfig.key === option.key && <Check className="w-4 h-4 text-blue-600" />}
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

      {/* Selected Category Link */}
      {selectedCategory && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.875rem" }}>
          Viewing category:{" "}
          <Link
            href={`/lis-management/doctype/asset-category/${encodeURIComponent(selectedCategory)}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            {selectedCategory} →
          </Link>
        </div>
      )}

      {/* Content */}
      <div className="view-container" style={{ marginTop: "1.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}