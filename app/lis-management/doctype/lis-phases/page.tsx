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
import { Plus, List, LayoutGrid } from "lucide-react";

// 🟢 Changed: Point to Root URL (Required for RPC calls)
const API_BASE_URL = "http://103.219.1.138:4412";

interface LISPhase {
    name: string; // 🟢 Added name (ID) for deletion
    lis_phase: string;
    lis_name: string;
}

type ViewMode = "grid" | "list";

export default function DoctypePage() {
    const router = useRouter();
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

    const doctypeName = "LIS Phases";

    const [records, setRecords] = React.useState<LISPhase[]>([]);
    const [view, setView] = React.useState<ViewMode>("list");
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");

    const filteredRecords = React.useMemo(() => {
        if (!searchTerm) return records;
        return records.filter(
            (r) =>
                r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.lis_phase.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.lis_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [records, searchTerm]);

    // 🟢 1. Initialize Selection Hook
    const {
        selectedIds,
        handleSelectOne,
        handleSelectAll,
        clearSelection,
        isAllSelected
    } = useSelection(filteredRecords, "name");

    const [isDeleting, setIsDeleting] = React.useState(false);

    // ── Fetch Logic ────────────────────────────────────────────────
    const fetchData = React.useCallback(async () => {
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
                    "name", // 🟢 Ensure we fetch the ID
                    "lis_phase",
                    "lis_name"
                ]),
                order_by: "creation desc",
                limit_page_length: 20
            };

            // 🟢 Append /api/resource manually
            const resp = await axios.get(`${API_BASE_URL}/api/resource/${doctypeName}`, {
                params,
                headers: {
                    Authorization: `token ${apiKey}:${apiSecret}`,
                },
                withCredentials: true,
            });

            const data = resp.data?.data ?? [];

            setRecords(
                data.map((r: any) => ({
                    name: r.name,
                    lis_phase: r.lis_phase,
                    lis_name: r.lis_name,
                }))
            );
        } catch (err: any) {
            console.error("Fetch error:", err);
            setError("Failed to fetch LIS Phases");
        } finally {
            setLoading(false);
        }
    }, [apiKey, apiSecret, isAuthenticated, isInitialized]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            fetchData(); // Refresh list
        } catch (err: any) {
            console.error("Bulk Delete Error:", err);
            toast.error("Failed to delete records", {
                description: err.response?.data?.exception || err.message
            });
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
                                            onChange={() => handleSelectOne(r.name)}
                                            style={{ cursor: "pointer", width: "16px", height: "16px" }}
                                        />
                                    </td>
                                    <td>{r.lis_phase}</td>
                                    <td>{r.lis_name}</td>
                                    <td>{r.name}</td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={4} style={{ textAlign: "center", padding: "32px" }}>
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

            <div className="view-container" style={{ marginTop: "0.5rem" }}>
                {view === "grid" ? renderGridView() : renderListView()}
            </div>
        </div>
    );
}