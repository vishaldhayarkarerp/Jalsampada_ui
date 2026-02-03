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
import { getApiMessages } from "@/lib/utils";
import { FrappeErrorDisplay } from "@/components/FrappeErrorDisplay";
import { Plus, List, LayoutGrid } from "lucide-react";

// 🟢 Point to Root URL (Required for RPC calls)
const API_BASE_URL = "http://103.219.3.169:2223";

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

interface Contractor {
  name: string;
  contractor_name: string;
  supplier_group: string;
  supplier_type: string;
  email_address: string;
  phone: string;
  city: string;
}

type ViewMode = "grid" | "list";

export default function ContractorListPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Contractor";

  const [records, setRecords] = React.useState<Contractor[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter records client-side for instant results
  const filteredRecords = React.useMemo(() => {
    if (!debouncedSearch) return records;
    const lowerSearch = debouncedSearch.toLowerCase();
    return records.filter(
      (record) =>
        record.name.toLowerCase().includes(lowerSearch) ||
        (record.contractor_name &&
          record.contractor_name.toLowerCase().includes(lowerSearch)) ||
        (record.email_address &&
          record.email_address.toLowerCase().includes(lowerSearch))
    );
  }, [records, debouncedSearch]);

  // 🟢 1. Initialize Selection Hook
  const {
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    isAllSelected,
  } = useSelection(filteredRecords, "name");

  const [isDeleting, setIsDeleting] = React.useState(false);

  /* -------------------------------------------------
  3. FETCH
  ------------------------------------------------- */
  const fetchRecords = React.useCallback(async () => {
    if (!isInitialized) return;
    if (!isAuthenticated || !apiKey || !apiSecret) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch key fields for display
      const params = {
        fields: JSON.stringify([
          "name",
          "contractor_name",
          "supplier_group",
          "supplier_type",
          "email_address",
          "phone",
          "city",
        ]),
        limit_page_length: "50",
        order_by: "creation desc",
      };

      const resp = await axios.get(
        `${API_BASE_URL}/api/resource/${doctypeName}`,
        {
          params,
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
          withCredentials: true,
        }
      );

      const raw = resp.data?.data ?? [];
      setRecords(raw);
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
    fetchRecords();
  }, [fetchRecords]);

  // 🟢 2. Handle Bulk Delete
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${count} records?`
      )
    ) {
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

      // Debug: Log the actual response to understand its structure
      console.log("Bulk Delete Response:", response);

      // Check if the response contains server messages indicating errors
      // For bulk delete, error messages are directly in response._server_messages
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

      // If no error messages, proceed with success
      toast.success(`Successfully deleted ${count} records.`);
      clearSelection();
      fetchRecords(); // Refresh list
    } catch (err: any) {
      console.error("Bulk Delete Error:", err);

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

  const title = "Contractor";

  const handleCardClick = (id: string) => {
    router.push(`/tender/doctype/contractor/${encodeURIComponent(id)}`);
  };

  const getFieldsForRecord = (record: Contractor): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    fields.push({ label: "Name", value: record.contractor_name });
    fields.push({ label: "Group", value: record.supplier_group });
    fields.push({ label: "Phone", value: record.phone });
    fields.push({ label: "City", value: record.city });
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
            <th>ID</th>
            <th>Contractor Name</th>
            <th>Group</th>
            <th>Email</th>
            <th>Phone</th>
            <th>City</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.length ? (
            filteredRecords.map((record) => {
              const isSelected = selectedIds.has(record.name);
              return (
                <tr
                  key={record.name}
                  onClick={() => handleCardClick(record.name)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: isSelected
                      ? "var(--color-surface-selected, #f0f9ff)"
                      : undefined,
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
                      onChange={() => handleSelectOne(record.name)}
                      style={{
                        cursor: "pointer",
                        width: "16px",
                        height: "16px",
                      }}
                    />
                  </td>
                  <td>{record.name}</td>
                  <td>{record.contractor_name}</td>
                  <td>{record.supplier_group}</td>
                  <td>{record.email_address}</td>
                  <td>{record.phone}</td>
                  <td>{record.city}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
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
      {filteredRecords.length ? (
        filteredRecords.map((record) => (
          <RecordCard
            key={record.name}
            title={record.contractor_name || record.name}
            fields={getFieldsForRecord(record)}
            onClick={() => handleCardClick(record.name)}
          />
        ))
      ) : (
        <p style={{ color: "var(--color-text-secondary)" }}>No records found.</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div
        className="module active"
        style={{ padding: "2rem", textAlign: "center" }}
      >
        <p>Loading {title}...</p>
      </div>
    );
  }

  return (
    <div className="module active">
      <div
        className="module-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2>{title}</h2>
          <p>Manage Contractor records</p>
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
            onClick={() => router.push("/tender/doctype/contractor/new")}
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
            {view === "grid" ? (
              <List className="w-4 h-4" />
            ) : (
              <LayoutGrid className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="view-container" style={{ marginTop: "0.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}