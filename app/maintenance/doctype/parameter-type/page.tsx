"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";
import { useSelection } from "@/hooks/useSelection";
import { BulkActionBar } from "@/components/BulkActionBar";
import { bulkDeleteRPC } from "@/api/rpc";
import { toast } from "sonner";
import { getApiMessages } from "@/lib/utils";
import { FrappeErrorDisplay } from "@/components/FrappeErrorDisplay";
import {
  Plus,
  List,
  LayoutGrid,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronDown,
  Check,
} from "lucide-react";

/* ─────────────────────────────────────────────── */
const API_BASE_URL = "http://103.219.3.169:2223";
const DOCTYPE = "Parameter Type";

/* ── Debounce Hook ─────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/* ── Types ────────────────────────────────────── */
interface ParameterType {
  name: string;
  parameter_type?: string;
}

type ViewMode = "grid" | "list";

type SortDirection = "asc" | "desc";
interface SortConfig {
  key: "name" | "creation" | "modified";
  direction: SortDirection;
}

const SORT_OPTIONS = [
  { label: "Last Updated On", key: "modified" },
  { label: "ID", key: "name" },
  { label: "Created On", key: "creation" },
] as const;

/* ─────────────────────────────────────────────── */
export default function ParameterTypeListPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const title = "Parameter Type";

  const [records, setRecords] = React.useState<ParameterType[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: "modified",
    direction: "desc",
  });

  const [isSortMenuOpen, setIsSortMenuOpen] = React.useState(false);

  /* ── Search ─────────────────────────────────── */
  const filteredRecords = React.useMemo(() => {
    if (!debouncedSearch) return records;
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        r.parameter_type
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase())
    );
  }, [records, debouncedSearch]);

  /* ── Selection ───────────────────────────────── */
  const {
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    isAllSelected,
  } = useSelection(filteredRecords, "name");

  const [isDeleting, setIsDeleting] = React.useState(false);

  /* ── Fetch Records ───────────────────────────── */
  const fetchRecords = React.useCallback(async () => {
    if (!isInitialized) return;
    if (!isAuthenticated || !apiKey || !apiSecret) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const resp = await axios.get(
        `${API_BASE_URL}/api/resource/${DOCTYPE}`,
        {
          params: {
            fields: JSON.stringify(["name", "parameter_type"]),
            order_by: `${sortConfig.key} ${sortConfig.direction}`,
            limit_page_length: 20,
          },
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
          withCredentials: true,
        }
      );

      const raw = resp.data?.data ?? [];
      const mapped: ParameterType[] = raw.map((r: any) => ({
        name: r.name,
        parameter_type: r.parameter_type ?? "",
      }));

      setRecords(mapped);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(
        err.response?.status === 403
          ? "Unauthorized – check API key/secret"
          : `Failed to fetch ${DOCTYPE}`
      );
    } finally {
      setLoading(false);
    }
  }, [
    apiKey,
    apiSecret,
    isAuthenticated,
    isInitialized,
    sortConfig,
  ]);

  React.useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  /* ── Bulk Delete ─────────────────────────────── */
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (!window.confirm(`Delete ${count} records permanently?`)) return;

    setIsDeleting(true);
    try {
      const response = await bulkDeleteRPC(
        DOCTYPE,
        Array.from(selectedIds),
        API_BASE_URL,
        apiKey!,
        apiSecret!
      );

      if (response._server_messages) {
        const msgs = JSON.parse(response._server_messages).map((m: string) =>
          JSON.parse(m).message
        );

        if (msgs.length) {
          toast.error("Delete failed", {
            description: <FrappeErrorDisplay messages={msgs} />,
            duration: Infinity,
          });
          return;
        }
      }

      toast.success(`Deleted ${count} records`);
      clearSelection();
      fetchRecords();
    } catch (err: any) {
      const messages = getApiMessages(
        null,
        err,
        "Records deleted successfully",
        "Failed to delete records"
      );
      toast.error(messages.message, {
        description: messages.description,
        duration: Infinity,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Helpers ─────────────────────────────────── */
  const handleCardClick = (id: string) => {
    router.push(
      `/maintenance/doctype/parameter-type/${encodeURIComponent(id)}`
    );
  };

  const getFieldsForRecord = (
    record: ParameterType
  ): RecordCardField[] => [
      {
        label: "Parameter Type",
        value: record.parameter_type || "-",
      },
    ];

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.key === sortConfig.key)?.label ??
    "Sort By";

  /* ── Views ───────────────────────────────────── */
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
            <th>ID</th>
            <th>Parameter Type</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.length ? (
            filteredRecords.map((r) => {
              const isSelected = selectedIds.has(r.name);
              return (
                <tr
                  key={r.name}
                  onClick={() => handleCardClick(r.name)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: isSelected
                      ? "var(--color-surface-selected, #f0f9ff)"
                      : undefined,
                  }}
                >
                  <td
                    onClick={(e) => e.stopPropagation()}
                    style={{ textAlign: "center" }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(r.name)}
                    />
                  </td>
                  <td>{r.name}</td>
                  <td>{r.parameter_type}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: 32 }}>
                No records found
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
        filteredRecords.map((r) => (
          <RecordCard
            key={r.name}
            title={r.name}
            fields={getFieldsForRecord(r)}
            onClick={() => handleCardClick(r.name)}
          />
        ))
      ) : (
        <p>No records found</p>
      )}
    </div>
  );

  if (loading)
    return <p style={{ padding: "2rem" }}>Loading {title}...</p>;
  if (error)
    return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  /* ── Render ─────────────────────────────────── */
  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>Manage {title}</p>
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
            onClick={() =>
              router.push("/maintenance/doctype/parameter-type/new")
            }
          >
            <Plus className="w-4 h-4" /> Add {title}
          </button>
        )}
      </div>

      <div
        className="search-filter-section"
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginTop: "1rem",
        }}
      >
        <input
          type="text"
          placeholder={`Search ${title}...`}
          className="form-control"
          style={{ width: 240 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="relative ml-auto">
          <div className="flex items-center rounded-lg border p-1">
            <button
              className="p-2"
              onClick={() =>
                setSortConfig((prev) => ({
                  ...prev,
                  direction: prev.direction === "asc" ? "desc" : "asc",
                }))
              }
            >
              {sortConfig.direction === "asc" ? (
                <ArrowDownWideNarrow className="w-4 h-4" />
              ) : (
                <ArrowUpNarrowWide className="w-4 h-4" />
              )}
            </button>

            <button
              className="flex items-center gap-2 px-3"
              onClick={() => setIsSortMenuOpen((v) => !v)}
            >
              {currentSortLabel}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {isSortMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow border z-50">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className="w-full px-4 py-2 flex justify-between hover:bg-gray-100"
                  onClick={() => {
                    setSortConfig((prev) => ({
                      ...prev,
                      key: opt.key,
                    }));
                    setIsSortMenuOpen(false);
                  }}
                >
                  {opt.label}
                  {sortConfig.key === opt.key && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn btn--outline btn--sm"
          onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
        >
          {view === "grid" ? (
            <List className="w-4 h-4" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="view-container" style={{ marginTop: "0.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}