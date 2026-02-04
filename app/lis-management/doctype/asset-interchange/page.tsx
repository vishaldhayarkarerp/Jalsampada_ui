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
import { Plus, List, LayoutGrid } from "lucide-react";

const API_BASE_URL = "http://103.219.1.138:4412";

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
interface AssetInterchange {
  name: string;
  docstatus?: string;
  lis_name?: string;
  posting_date?: string;
  stage?: string;
  select_asset?: string;
}

type ViewMode = "grid" | "list";

export default function AssetInterchangeListPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Asset Interchange";

  const [records, setRecords] = React.useState<AssetInterchange[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const title = "Asset Interchange";

  /* ── Search ─────────────────────────────────── */
  const filteredRecords = React.useMemo(() => {
    if (!debouncedSearch) return records;
    return records.filter((r) =>
      r.name.toLowerCase().includes(debouncedSearch.toLowerCase())
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
        `${API_BASE_URL}/api/resource/${doctypeName}`,
        {
          params: {
            fields: JSON.stringify([
              "name",
              "docstatus",
              "lis_name",
              "posting_date",
              "stage",
              "select_asset",
            ]),
            limit_page_length: 20,
            order_by: "creation desc",
          },
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
          withCredentials: true,
        }
      );

      const raw = resp.data?.data ?? [];

      // ✅ STATUS LOGIC ADDED HERE
      const mapped: AssetInterchange[] = raw.map((r: any) => {
        let statusText = "";
        if (r.docstatus === 0) statusText = "Draft";
        else if (r.docstatus === 1) statusText = "Submitted";
        else if (r.docstatus === 2) statusText = "Cancelled";

        return {
          name: r.name,
          docstatus: statusText,
          lis_name: r.lis_name ?? "",
          posting_date: r.posting_date ?? "",
          stage: r.stage ?? "",
          select_asset: r.select_asset ?? "",
        };
      });

      setRecords(mapped);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(
        err.response?.status === 403
          ? "Unauthorized – check API key/secret"
          : `Failed to fetch ${doctypeName}`
      );
    } finally {
      setLoading(false);
    }
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized]);

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
        doctypeName,
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

  const handleCardClick = (id: string) => {
    router.push(
      `/lis-management/doctype/asset-interchange/${encodeURIComponent(id)}`
    );
  };

  const getFieldsForRecord = (
    record: AssetInterchange
  ): RecordCardField[] => [
    { label: "Status", value: record.docstatus || "-" },
    { label: "LIS Name", value: record.lis_name || "-" },
    { label: "Posting Date", value: record.posting_date || "-" },
    { label: "Stage", value: record.stage || "-" },
    {
      label: "Which Asset to Interchange",
      value: record.select_asset || "-",
    },
  ];

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
            <th>Status</th>
            <th>LIS Name</th>
            <th>Posting Date</th>
            <th>Stage</th>
            <th>Which Asset to Interchange</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map((r) => {
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
                <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(r.name)}
                  />
                </td>
                <td>{r.name}</td>
                <td>{r.docstatus}</td>
                <td>{r.lis_name}</td>
                <td>{r.posting_date}</td>
                <td>{r.stage}</td>
                <td>{r.select_asset}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderGridView = () => (
    <div className="equipment-grid">
      {filteredRecords.map((r) => (
        <RecordCard
          key={r.name}
          title={r.name}
          fields={getFieldsForRecord(r)}
          onClick={() => handleCardClick(r.name)}
        />
      ))}
    </div>
  );

  if (loading) return <p style={{ padding: "2rem" }}>Loading Asset Interchange...</p>;
  if (error) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Asset Interchange</h2>
          <p>Manage Asset Interchange Records</p>
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
              router.push("/lis-management/doctype/asset-interchange/new")
            }
          >
            <Plus className="w-4 h-4" /> Add Asset Interchange
          </button>
        )}
      </div>

      <div
        className="search-filter-section"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder={`Search ${title}...`}
            className="form-control"
            style={{ width: 240 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="view-switcher">
          <button
            className="btn btn--outline btn--sm flex items-center justify-center"
            onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
          >
            {view === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="view-container">
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}