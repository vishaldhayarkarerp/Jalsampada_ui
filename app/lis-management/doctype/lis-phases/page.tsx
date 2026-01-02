"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const API_BASE_URL = "http://103.219.1.138:4412//api/resource";

interface LISPhase {
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
                r.lis_phase.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.lis_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [records, searchTerm]);

    React.useEffect(() => {
        const fetchData = async () => {
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
                        "lis_phase",
                        "lis_name"
                    ]),
                    order_by: "creation desc",
                    limit_page_length: 20
                };

                const resp = await axios.get(`${API_BASE_URL}/${doctypeName}`, {
                    params,
                    headers: {
                        Authorization: `token ${apiKey}:${apiSecret}`,
                    },
                    withCredentials: true,
                });

                const data = resp.data?.data ?? [];

                setRecords(
                    data.map((r: any) => ({
                        lis_phase: r.lis_phase,
                        lis_name: r.lis_name,
                    }))
                );
            } catch {
                setError("Failed to fetch LIS Phases");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiKey, apiSecret, isAuthenticated, isInitialized]);

    const handleCardClick = (lis_phase: string) => {
        router.push(`/lis-management/doctype/lis-phases/${lis_phase}`);
    };

    const getFields = (r: LISPhase): RecordCardField[] => [
        { label: "LIS Phase", value: r.lis_phase },
        { label: "LIS Scheme", value: r.lis_name },
        { label: "ID", value: r.lis_phase },
    ];

    const renderListView = () => (
        <div className="stock-table-container">
            <table className="stock-table">
                <thead>
                    <tr>
                        <th>LIS Phase</th>
                        <th>LIS Scheme</th>
                        <th>ID</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRecords.length ? (
                        filteredRecords.map((r) => (
                            <tr
                                key={r.lis_phase}
                                onClick={() => handleCardClick(r.lis_phase)}
                                style={{ cursor: "pointer" }}
                            >
                                <td>{r.lis_phase}</td>
                                <td>{r.lis_name}</td>
                                <td>{r.lis_phase}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={3} style={{ textAlign: "center", padding: "32px" }}>
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
                        key={r.lis_phase}
                        title={r.lis_phase} // ID as title
                        subtitle={r.lis_name}
                        fields={getFields(r)}
                        onClick={() => handleCardClick(r.lis_phase)}
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
            <div className="module-header">
                <div>
                    <h2>LIS Phases</h2>
                    <p>Manage LIS Phase</p>
                </div>
                <Link href="/lis-management/doctype/lis-phases/new">
                    <button className="btn btn--primary">
                        <i className="fas fa-plus"></i> Add LIS Phase
                    </button>
                </Link>
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
                    className="btn btn--outline btn--sm"
                    onClick={() => setView(view === "grid" ? "list" : "grid")}
                >
                    {view === "grid" ? <i className="fas fa-list"></i> : <i className="fas fa-th-large"></i>}
                </button>
            </div>

            <div className="view-container" style={{ marginTop: "0.5rem" }}>
                {view === "grid" ? renderGridView() : renderListView()}
            </div>
        </div>
    );
}
