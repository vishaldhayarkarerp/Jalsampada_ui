"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";

// 🟢 New Imports for Bulk Delete & Icons
import { useSelection } from "@/hooks/useSelection";
import { BulkActionBar } from "@/components/BulkActionBar";
import { bulkDeleteRPC } from "@/api/rpc";
import { toast } from "sonner";
import { Plus, List, LayoutGrid } from "lucide-react";

// 🟢 Changed: Point to Root URL (Required for RPC calls)
const API_BASE_URL = "http://103.219.1.138:4412";

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

/* -------------------------------------------------
 1. Minimal Stage No type
 ------------------------------------------------- */
interface StageNo {
  name: string;
  stage_no: string;
  lis_name?: string;
}

/* -------------------------------------------------
 2. Component
 ------------------------------------------------- */
type ViewMode = "grid" | "list";

export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Stage No";

  const [stages, setStages] = React.useState<StageNo[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter stages client-side for instant results
  const filteredStages = React.useMemo(() => {
    if (!searchTerm) return stages;
    return stages.filter(stage =>
      stage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stage.stage_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stage.lis_name && stage.lis_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stages, searchTerm]);

  // 🟢 1. Initialize Selection Hook
  const {
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    isAllSelected
  } = useSelection(filteredStages, "name");

  const [isDeleting, setIsDeleting] = React.useState(false);

  /* -------------------------------------------------
  3. FETCH
  ------------------------------------------------- */
  const fetchStages = React.useCallback(async () => {
    if (!isInitialized) return;
    if (!isAuthenticated || !apiKey || !apiSecret) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = {
        fields: JSON.stringify([
          "name",
          "stage_no",
          "lis_name"
        ]),
        limit_page_length: "20",
        order_by: "creation desc"
      };

      // 🟢 Append /api/resource manually
      const resp = await axios.get(`${API_BASE_URL}/api/resource/${doctypeName}`, {
        params,
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
        },
        withCredentials: true,
      });

      const raw = resp.data?.data ?? [];
      const mapped: StageNo[] = raw.map((r: any) => ({
        name: r.name,
        stage_no: r.stage_no ?? r.name,
        lis_name: r.lis_name ?? "—",
      }));

      setStages(mapped);
    } catch (err: any) {
      console.error("API error:", err);
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
    fetchStages();
  }, [fetchStages]);

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
      fetchStages(); // Refresh list
    } catch (err: any) {
      console.error("Bulk Delete Error:", err);
      toast.error("Failed to delete records", {
        description: err.response?.data?.exception || err.message
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const title = "Stage No";

  const handleCardClick = (id: string) => {
    router.push(`/lis-management/doctype/stage-no/${id}`);
  };

  /* -------------------------------------------------
  4. CARD FIELDS
  ------------------------------------------------- */
  const getFieldsForStage = (stage: StageNo): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    if (stage.lis_name) fields.push({ label: "LIS", value: stage.lis_name });
    return fields;
  };

  /* -------------------------------------------------
  5. LIST VIEW
  ------------------------------------------------- */
  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
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
            <th>Stage No</th>
            <th>LIS Name</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {filteredStages.length ? (
            filteredStages.map((stage) => {
              const isSelected = selectedIds.has(stage.name);
              return (
                <tr
                  key={stage.name}
                  onClick={() => handleCardClick(stage.name)}
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
                      onChange={() => handleSelectOne(stage.name)}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                  </td>
                  <td>{stage.stage_no}</td>
                  <td>{stage.lis_name}</td>
                  <td>{stage.name}</td>
                </tr>
              );
            })
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

  /* -------------------------------------------------
  6. GRID VIEW
  ------------------------------------------------- */
  const renderGridView = () => (
    <div className="equipment-grid">
      {filteredStages.length ? (
        filteredStages.map((stage) => (
          <RecordCard
            key={stage.name}
            title={stage.stage_no}
            subtitle={stage.lis_name}
            fields={getFieldsForStage(stage)}
            onClick={() => handleCardClick(stage.name)}
          />
        ))
      ) : (
        <p style={{ color: "var(--color-text-secondary)" }}>
          No records found.
        </p>
      )}
    </div>
  );

  /* -------------------------------------------------
  7. UI STATES
  ------------------------------------------------- */
  if (loading) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading {title}...</p>
      </div>
    );
  }
  
  if (error && stages.length === 0) {
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        <p style={{ color: "var(--color-error)" }}>{error}</p>
        <button className="btn btn--primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  /* -------------------------------------------------
  8. MAIN RENDER
  ------------------------------------------------- */
  return (
    <div className="module active">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>{title}</h2>
          <p>Manage Stage No master</p>
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
          <button 
            className="btn btn--primary flex items-center gap-2"
            onClick={() => router.push('/lis-management/doctype/stage-no/new')}
          >
            <Plus className="w-4 h-4" /> Add {title}
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
            aria-label="Toggle view"
            title={view === "grid" ? "List view" : "Grid view"}
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