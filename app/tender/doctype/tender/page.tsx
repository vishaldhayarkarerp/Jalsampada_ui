"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { LinkField } from "@/components/LinkField";

// 🟢 New Imports for Bulk Delete
import { useSelection } from "@/hooks/useSelection";
import { BulkActionBar } from "@/components/BulkActionBar";
import { bulkDeleteRPC } from "@/api/rpc";
import { toast } from "sonner";
import { getApiMessages} from "@/lib/utils";
import { FrappeErrorDisplay } from "@/components/FrappeErrorDisplay"; // Assuming you have sonner installed (or use your preferred toast)
import { Plus, List, LayoutGrid, Clock } from "lucide-react"; // Optional: if you want to use Lucide icons for consistency
import { TimeAgo } from "@/components/TimeAgo";

const API_BASE_URL = "http://103.219.1.138:4412"; // 🟢 Changed: Removed /api/resource so RPC helper can append /api/method

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

interface Tender {
  name: string;              // id
  status?: string;           // from custom_tender_status
  tender_name?: string;      // from custom_prapan_suchi
  lis_name?: string;          // from custom_lis_name
  modified?: string;
}

interface LisOption {
  name: string;
}

type ViewMode = "grid" | "list";

export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Project"; // 🟢 This is the DocType used for API calls

  const [tenders, setTenders] = React.useState<Tender[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [lisOptions, setLisOptions] = React.useState<LisOption[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Form for filters
  const { control, watch } = useForm({
    defaultValues: {
      lis_name: ""
    }
  });

  const selectedLis = watch("lis_name");

  // Filter tenders client-side
  const filteredTenders = React.useMemo(() => {
    let filtered = tenders;
    
    // Apply search filter
    if (debouncedSearch) {
      filtered = filtered.filter(tender =>
        tender.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (tender.tender_name && tender.tender_name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (tender.status && tender.status.toLowerCase().includes(debouncedSearch.toLowerCase()))
      );
    }
    
    // Apply LIS filter
    if (selectedLis) {
      filtered = filtered.filter(tender => tender.lis_name === selectedLis);
    }
    
    return filtered;
  }, [tenders, debouncedSearch, selectedLis]);

  // 🟢 1. Initialize Selection Hook
  const { 
    selectedIds, 
    handleSelectOne, 
    handleSelectAll, 
    clearSelection, 
    isAllSelected 
  } = useSelection(filteredTenders, "name");

  const [isDeleting, setIsDeleting] = React.useState(false);

  // ── Load Filter Options ────────────────────────────────────────
  React.useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) return;

      try {
        // Fetch LIS options
        const lisResp = await axios.get(`${API_BASE_URL}/api/resource/Lift Irrigation Scheme`, {
          params: {
            fields: JSON.stringify(["name"]),
            limit_page_length: "100",
            order_by: "name asc",
          },
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
        });

        const lisData = lisResp.data?.data ?? [];
        setLisOptions([{ name: "" }, ...lisData]); // empty string = All
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };

    fetchFilterOptions();
  }, [isInitialized, isAuthenticated, apiKey, apiSecret]);

  // ── Fetch Data ────────────────────────────────────────────────
  const fetchTenders = React.useCallback(async () => {
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
          "custom_tender_status",
          "custom_prapan_suchi",
          "custom_lis_name",
          "modified",
        ]),
        limit_page_length: 20,
        order_by: "creation desc",
      };

      // 🟢 Note: Added /api/resource here since we changed API_BASE_URL to root
      const resp = await axios.get(`${API_BASE_URL}/api/resource/${doctypeName}`, {
        params,
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
        },
        withCredentials: true,
      });

      const raw = resp.data?.data ?? [];
      const mapped: Tender[] = raw.map((r: any) => ({
        name: r.name,
        status: r.custom_tender_status ?? "",
        tender_name: r.custom_prapan_suchi ?? "",
        lis_name: r.custom_lis_name ?? "",
        modified: r.modified,
      }));

      setTenders(mapped);
    } catch (err: any) {
      console.error("API error", err);
      setError(
        err.response?.status === 403
          ? "Unauthorized - check API key/secret"
          : `Failed to fetch ${doctypeName}`
      );
    } finally {
      setLoading(false);
    }
  }, [isInitialized, isAuthenticated, apiKey, apiSecret, doctypeName]);

  React.useEffect(() => {
    fetchTenders();
  }, [fetchTenders]);

  // 🟢 2. Handle Bulk Delete Action
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (!window.confirm(`Are you sure you want to permanently delete ${count} records?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Execute the RPC call
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
      
      // Clear selection and refresh list
      clearSelection();
      fetchTenders();

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

  const title = "Tender";

  const handleCardClick = (id: string) => {
    router.push(`/tender/doctype/tender/${encodeURIComponent(id)}`);
  };

  const getFieldsForTender = (t: Tender): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    fields.push({ label: "ID", value: t.name });
    if (t.status) fields.push({ label: "Status", value: t.status });
    if (t.tender_name) fields.push({ label: "Prapan Suchi", value: t.tender_name });
    if (t.lis_name) fields.push({ label: "LIS", value: t.lis_name });
    return fields;
  };

  // 🟢 3. Modified Grid View (Standard - No Selection for now)
  const renderGridView = () => (
    <div className="equipment-grid">
      {filteredTenders.length ? (
        filteredTenders.map((t) => (
          <RecordCard
            key={t.name}
            title={t.tender_name || t.name}
            subtitle={t.status}
            fields={getFieldsForTender(t)}
            onClick={() => handleCardClick(t.name)}
          />
        ))
      ) : (
        <p style={{ color: "var(--color-text-secondary)" }}>No records found.</p>
      )}
    </div>
  );

  // 🟢 4. Modified List View (Added Checkboxes)
  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            {/* Header Checkbox */}
            <th style={{ width: "40px", textAlign: "center" }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                style={{ cursor: "pointer", width: "16px", height: "16px" }}
              />
            </th>
            <th>ID</th>
            <th>Prapan Suchi</th>
            <th>LIS</th>
            <th>Status</th>
            <th className="text-right pr-4" style={{ width: "100px" }}>
              <Clock className="w-4 h-4 mr-1 float-right" />
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredTenders.length ? (
            filteredTenders.map((t) => {
              const isSelected = selectedIds.has(t.name);
              return (
                <tr
                  key={t.name}
                  onClick={() => handleCardClick(t.name)}
                  style={{ 
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--color-surface-selected, #f0f9ff)" : undefined 
                  }}
                >
                  {/* Row Checkbox */}
                  <td 
                    style={{ textAlign: "center" }} 
                    onClick={(e) => e.stopPropagation()} // 🔴 Prevent navigation
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(t.name)}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                  </td>
                  <td>{t.name}</td>
                  <td>{t.tender_name}</td>
                  <td>{t.lis_name}</td>
                  <td>{t.status}</td>
                  <td className="text-right pr-4">
                    <TimeAgo date={t.modified} />
                  </td>
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

  if (loading && !tenders.length) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading {title}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="module active">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>{title}</h2>
          <p>Manage tender records</p>
        </div>
        
        {/* 🟢 5. Switch between "Add New" and "Bulk Actions" */}
        {selectedIds.size > 0 ? (
          <BulkActionBar
            selectedCount={selectedIds.size}
            onClear={clearSelection}
            onDelete={handleBulkDelete}
            isDeleting={isDeleting}
          />
        ) : (
          <button 
            className="btn btn--primary"
            onClick={() => router.push('/tender/doctype/tender/new')}
          >
            <i className="fas fa-plus"></i> Add {title}
          </button>
        )}
      </div>

      <div
        className="search-filter-section"
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          marginTop: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: "1" }}>
          <div style={{ minWidth: "200px" }}>
            <input
              type="text"
              placeholder={`Search ${title}...`}
              className="form-control w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ minWidth: "200px", marginBottom: "0.2rem" }}>
            <Controller
              control={control}
              name="lis_name"
              render={({ field: { onChange, value } }) => {
                const mockField = {
                  name: "lis_name",
                  label: "",
                  type: "Link" as const,
                  linkTarget: "Lift Irrigation Scheme",
                  placeholder: "Select LIS",
                  required: false,
                  defaultValue: ""
                };

                return (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <LinkField
                      control={control}
                      field={{ ...mockField, defaultValue: value }}
                      error={null}
                      className="[&>label]:hidden vishal"
                    />
                  </div>
                );
              }}
            />
          </div>
        </div>
        <div className="view-switcher">
          <button
            className="btn btn--outline btn--sm"
            onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
            aria-label="Toggle view"
            title={view === "grid" ? "List view" : "Grid view"}
          >
            {view === "grid" ? <i className="fas fa-list" /> : <i className="fas fa-th-large" />}
          </button>
        </div>
      </div>

      <div className="view-container" style={{ marginTop: "0.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}