"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { getApiMessages} from "@/lib/utils"; // 🟢 Added import for error handling

// 🟢 New Imports for Bulk Delete & Icons
import { useSelection } from "@/hooks/useSelection";
import { BulkActionBar } from "@/components/BulkActionBar";
import { bulkDeleteRPC } from "@/api/rpc";
import { toast } from "sonner";
import { Plus, List, LayoutGrid, Clock } from "lucide-react";
import { FrappeErrorDisplay } from "@/components/FrappeErrorDisplay";
import { TimeAgo } from "@/components/TimeAgo";

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
 1. Minimal LIS type
 ------------------------------------------------- */
interface LiftIrrigationScheme {
  name: string;
  lis_name: string;
  modified?: string;
}

/* -------------------------------------------------
 2. Component
 ------------------------------------------------- */
type ViewMode = "grid" | "list";

export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Lift Irrigation Scheme";

  const [schemes, setSchemes] = React.useState<LiftIrrigationScheme[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter schemes client-side for instant results
  const filteredSchemes = React.useMemo(() => {
    if (!searchTerm) return schemes;
    return schemes.filter(scheme =>
      scheme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.lis_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schemes, searchTerm]);

  // 🟢 1. Initialize Selection Hook
  const {
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    isAllSelected
  } = useSelection(filteredSchemes, "name");

  const [isDeleting, setIsDeleting] = React.useState(false);

  /* -------------------------------------------------
  3. FETCH
  ------------------------------------------------- */
  const fetchSchemes = React.useCallback(async () => {
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
          "lis_name",
          "modified"
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
      const mapped: LiftIrrigationScheme[] = raw.map((r: any) => ({
        name: r.name,
        lis_name: r.lis_name ?? r.name,
        modified: r.modified,
      }));

      setSchemes(mapped);
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
  }, [apiKey, apiSecret, isAuthenticated, isInitialized, doctypeName]);

  React.useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  // 🟢 2. Handle Bulk Delete (UPDATED with Server Message Parsing)
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (!window.confirm(`Are you sure you want to permanently delete ${count} records?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await bulkDeleteRPC(
        doctypeName,
        Array.from(selectedIds),
        API_BASE_URL,
        apiKey!,
        apiSecret!
      );

      // 🟢 Added: Check if the response contains server messages indicating errors
      if (response._server_messages) {
        // Parse the server messages to check for errors
        const serverMessages = JSON.parse(response._server_messages);
        const errorMessages = serverMessages.map((msgStr: string) => {
          const parsed = JSON.parse(msgStr);
          return parsed.message;
        });

        if (errorMessages.length > 0) {
          // Show error messages from server
          toast.error("Failed to delete records", { 
            description: <FrappeErrorDisplay messages={errorMessages} />,
            duration: Infinity
          });
          return; // Don't proceed with success handling
        }
      }

      toast.success(`Successfully deleted ${count} records.`);
      clearSelection();
      fetchSchemes(); // Refresh list
    } catch (err: any) {
      console.error("Bulk Delete Error:", err);
      
      // 🟢 Added: Consistent error handling using getApiMessages
      const messages = getApiMessages(
        null,
        err,
        "Records deleted successfully",
        "Failed to delete records"
      );
      
      toast.error(messages.message, { description: messages.description, duration: Infinity });
    } finally {
      setIsDeleting(false);
    }
  };

  const title = "Lift Irrigation Scheme";

  const handleCardClick = (id: string) => {
    router.push(`/lis-management/doctype/lift-irrigation-scheme/${encodeURIComponent(id)}`);
  };

  /* -------------------------------------------------
  4. CARD FIELDS
  ------------------------------------------------- */
  const getFieldsForScheme = (scheme: LiftIrrigationScheme): RecordCardField[] => {
    return [];
  };

  /* -------------------------------------------------
  5. LIST VIEW
  ------------------------------------------------- */
  const renderListView = () => (
  <div className="stock-table-container">
    <table className="stock-table">
      <thead>
        <tr>
          {/* 1. Checkbox */}
          <th style={{ width: "40px", textAlign: "center" }}>
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              style={{ cursor: "pointer", width: "16px", height: "16px" }}
            />
          </th>
          {/* 2. Primary Data */}
          <th>LIS Name</th>
          <th>ID</th>
          {/* 3. Timestamp (Far Right) */}
          <th className="text-right pr-4" style={{ width: "100px" }}>
            <Clock className="w-4 h-4 mr-1 float-right" />
            
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredSchemes.length ? (
          filteredSchemes.map((scheme) => {
            const isSelected = selectedIds.has(scheme.name);
            return (
              <tr
                key={scheme.name}
                onClick={() => handleCardClick(scheme.name)}
                style={{
                  cursor: "pointer",
                  backgroundColor: isSelected ? "var(--color-surface-selected, #f0f9ff)" : undefined
                }}
              >
                <td
                  style={{ textAlign: "center" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(scheme.name)}
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />
                </td>
                <td>{scheme.lis_name}</td>
                <td>{scheme.name}</td>
                {/* Right-aligned timestamp snippet */}
                <td className="text-right">
                  <TimeAgo date={scheme.modified} />
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            {/* Updated colSpan to 4 to cover all columns */}
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
      {filteredSchemes.length ? (
        filteredSchemes.map((scheme) => (
          <RecordCard
            key={scheme.name}
            title={scheme.lis_name}
            subtitle={scheme.name}
            fields={getFieldsForScheme(scheme)}
            onClick={() => handleCardClick(scheme.name)}
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
  
  if (error && schemes.length === 0) {
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
          <p>Manage Lift Irrigation Scheme master</p>
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
          <Link href="/lis-management/doctype/lift-irrigation-scheme/new" passHref>
            <button className="btn btn--primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add {title}
            </button>
          </Link>
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