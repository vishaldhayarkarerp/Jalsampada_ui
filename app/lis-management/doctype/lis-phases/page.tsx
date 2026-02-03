"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

// 🟢 New Imports for Bulk Delete & Icons
import { useSelection } from "@/hooks/useSelection";
import { BulkActionBar } from "@/components/BulkActionBar";
import { bulkDeleteRPC } from "@/api/rpc";
import { toast } from "sonner";
import { getApiMessages} from "@/lib/utils";
import { FrappeErrorDisplay } from "@/components/FrappeErrorDisplay";
import { TimeAgo } from "@/components/TimeAgo";
import { Plus, List, LayoutGrid, Clock, Loader2 } from "lucide-react";

// 🟢 Changed: Point to Root URL (Required for RPC calls)
const API_BASE_URL = "http://103.219.1.138:4412";

// 🟢 CONFIG: Settings for Frappe-like pagination
const INITIAL_PAGE_SIZE = 25;
const LOAD_MORE_SIZE = 10;

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

interface LISPhase {
    name: string; // 🟢 Added name (ID) for deletion
    lis_phase: string;
    lis_name: string;
    modified?: string;
}

type ViewMode = "grid" | "list";

export default function DoctypePage() {
    const router = useRouter();
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

    const doctypeName = "LIS Phases";

    const [records, setRecords] = React.useState<LISPhase[]>([]);
    const [view, setView] = React.useState<ViewMode>("list");
    
    // 🟢 Loading & Pagination States
    const [loading, setLoading] = React.useState(true);       // Full page load
    const [isLoadingMore, setIsLoadingMore] = React.useState(false); // Button load
    const [hasMore, setHasMore] = React.useState(true);       // Are there more records?
    const [totalCount, setTotalCount] = React.useState(0);    // 🟢 NEW: Total count of records
    const [error, setError] = React.useState<string | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");
    const debouncedSearch = useDebounce(searchTerm, 300);

    const filteredRecords = React.useMemo(() => {
        if (!debouncedSearch) return records;
        return records.filter(
            (r) =>
                r.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                r.lis_phase.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                r.lis_name.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [records, debouncedSearch]);
    
    // 🟢 Use filtered records for display but original records for pagination count
    const displayRecords = filteredRecords;

    // 🟢 1. Initialize Selection Hook
    const {
        selectedIds,
        handleSelectOne,
        handleSelectAll,
        clearSelection,
        isAllSelected
    } = useSelection(displayRecords, "name");

    const [isDeleting, setIsDeleting] = React.useState(false);

    // ── 🟢 Fetch Logic (Refactored for Pagination and Total Count) ───────────────────
    const fetchData = React.useCallback(
        async (start = 0, isReset = false) => {
            if (!isInitialized) return;
            if (!isAuthenticated || !apiKey || !apiSecret) {
                setLoading(false);
                return;
            }

            try {
                if (isReset) {
                    setLoading(true);
                    setError(null);
                } else {
                    setIsLoadingMore(true);
                }

                const limit = isReset ? INITIAL_PAGE_SIZE : LOAD_MORE_SIZE;
                const filters: any[] = [];
                if (debouncedSearch) filters.push(["LIS Phases", "name", "like", `%${debouncedSearch}%`]);

                const commonHeaders = { Authorization: `token ${apiKey}:${apiSecret}` };
                
                // Parallel requests for Data and Total Count
                const [dataResp, countResp] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/resource/${doctypeName}`, {
                        params: {
                            fields: JSON.stringify(["name", "lis_phase", "lis_name", "modified"]),
                            limit_start: start,
                            limit_page_length: limit,
                            order_by: "creation desc",
                            filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
                        },
                        headers: commonHeaders,
                        withCredentials: true,
                    }),
                    // Only fetch count during initial load or filter change
                    isReset ? axios.get(`${API_BASE_URL}/api/method/frappe.client.get_count`, {
                        params: { doctype: doctypeName, filters: filters.length > 0 ? JSON.stringify(filters) : undefined },
                        headers: commonHeaders,
                    }) : Promise.resolve(null)
                ]);

                const data = dataResp.data?.data ?? [];

                if (isReset) {
                    setRecords(
                        data.map((r: any) => ({
                            name: r.name,
                            lis_phase: r.lis_phase,
                            lis_name: r.lis_name,
                            modified: r.modified,
                        }))
                    );
                    if (countResp) setTotalCount(countResp.data.message);
                } else {
                    setRecords((prev) => [...prev, ...data.map((r: any) => ({
                        name: r.name,
                        lis_phase: r.lis_phase,
                        lis_name: r.lis_name,
                        modified: r.modified,
                    }))]);
                }

                setHasMore(data.length === limit);

            } catch (err: any) {
                console.error("Fetch error:", err);
                if (isReset) setError("Failed to fetch LIS Phases");
            } finally {
                setLoading(false);
                setIsLoadingMore(false);
            }
        },
        [apiKey, apiSecret, isAuthenticated, isInitialized, debouncedSearch, doctypeName]
    );

    React.useEffect(() => {
        fetchData(0, true);
    }, [fetchData]);

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            fetchData(records.length, false);
        }
    };

    // 🟢 2. Handle Bulk Delete
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
            fetchData(0, true);
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

    const handleCardClick = (id: string) => {
        router.push(`/lis-management/doctype/lis-phases/${encodeURIComponent(id)}`);
    };

    const getFields = (r: LISPhase): RecordCardField[] => [
        { label: "LIS Phase", value: r.lis_phase },
        { label: "LIS Scheme", value: r.lis_name },
        { label: "ID", value: r.name },
    ];

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
                        <th>LIS Phase</th>
                        <th>LIS Scheme</th>
                        <th>ID</th>
                        <th className="text-right pr-4" style={{ width: "120px" }}>
                            <div className="flex items-center justify-end gap-1 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                 {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                                   <><span>{displayRecords.length}</span><span className="opacity-50"> /</span><span className="text-gray-900 dark:text-gray-200 font-bold">{totalCount}</span></>
                                 )}
                              </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {displayRecords.length ? (
                        displayRecords.map((r) => {
                            const isSelected = selectedIds.has(r.name);
                            return (
                                <tr
                                    key={r.name}
                                    onClick={() => handleCardClick(r.name)}
                                    style={{
                                        cursor: "pointer",
                                        backgroundColor: isSelected ? "var(--color-surface-selected, #f0f9ff)" : undefined
                                    }}
                                >
                                    {/* Row Checkbox */}
                                    <td
                                        style={{ textAlign: "center" }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectOne(r.name)}
                                            style={{ cursor: "pointer", width: "16px", height: "16px" }}
                                        />
                                    </td>
                                    <td>{r.lis_phase}</td>
                                    <td>{r.lis_name}</td>
                                    <td>{r.name}</td>
                                    <td className="text-right pr-4">
                                        <TimeAgo date={r.modified} />
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: "32px" }}>
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
            {displayRecords.length ? (
                displayRecords.map((r) => (
                    <RecordCard
                        key={r.name}
                        title={r.lis_phase}
                        subtitle={r.lis_name}
                        fields={getFields(r)}
                        onClick={() => handleCardClick(r.name)}
                    />
                ))
            ) : (
                <p>No records found</p>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
                <p>Loading LIS Phases...</p>
            </div>
        );
    }

    if (error && records.length === 0) {
        return (
            <div className="module active" style={{ padding: "2rem" }}>
                <p style={{ color: "var(--color-error)" }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="module active">
            <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>LIS Phases</h2>
                    <p>Manage LIS Phase</p>
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
                    <Link href="/lis-management/doctype/lis-phases/new">
                        <button className="btn btn--primary flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add LIS Phase
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
                <input
                    type="text"
                    placeholder="Search ID, LIS Phase, or LIS Scheme..."
                    className="form-control"
                    style={{ width: 300 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <button
                    className="btn btn--outline btn--sm flex items-center justify-center"
                    onClick={() => setView(view === "grid" ? "list" : "grid")}
                    aria-label="Toggle view"
                    title={view === "grid" ? "List view" : "Grid view"}
                >
                    {view === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                </button>
            </div>

            <div className="view-container" style={{ marginTop: "0.5rem", paddingBottom: "2rem" }}>
                {view === "grid" ? renderGridView() : renderListView()}
                {hasMore && displayRecords.length > 0 && (
                    <div className="mt-6 flex justify-end">
                        <button onClick={handleLoadMore} disabled={isLoadingMore} className="btn btn--secondary flex items-center gap-2 px-6 py-2" style={{ minWidth: "140px" }}>
                            {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : "Load More"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}