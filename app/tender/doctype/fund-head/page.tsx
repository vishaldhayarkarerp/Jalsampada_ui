"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";

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

interface FundHead {
  name: string;
}

type ViewMode = "grid" | "list";

export default function FundHeadPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Fund Head";

  const [records, setRecords] = React.useState<FundHead[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter records client-side for instant results
  const filteredRecords = React.useMemo(() => {
    if (!searchTerm) return records;
    return records.filter(record =>
      record.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  React.useEffect(() => {
    const fetchRecords = async () => {
      if (!isInitialized) return;
      if (!isAuthenticated || !apiKey || !apiSecret) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = {
          fields: JSON.stringify(["name"]),
          limit_page_length: "20",
          order_by: "creation desc"
        };

        const resp = await axios.get(`${API_BASE_URL}/${doctypeName}`, {
          params,
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
          withCredentials: true,
        });

        const raw = resp.data?.data ?? [];
        const mapped: FundHead[] = raw.map((r: any) => ({
          name: r.name,
        }));

        setRecords(mapped);
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
    };

    fetchRecords();
  }, [apiKey, apiSecret, isAuthenticated, isInitialized]);

  const title = "Fund Head";

  const handleCardClick = (id: string) => {
    router.push(`/tender/doctype/fund-head/${id}`);
  };

  const getFieldsForRecord = (record: FundHead): RecordCardField[] => {
    return [{ label: "ID", value: record.name }];
    // You can also use: return [{ label: "Name", value: record.name }];
  };

  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.length ? (
            filteredRecords.map((record) => (
              <tr
                key={record.name}
                onClick={() => handleCardClick(record.name)}
                style={{ cursor: "pointer" }}
              >
                <td>{record.name}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={1} style={{ textAlign: "center", padding: "32px" }}>
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
            title={record.name}
            fields={getFieldsForRecord(record)}
            onClick={() => handleCardClick(record.name)}
          />
        ))
      ) : (
        <p style={{ color: "var(--color-text-secondary)" }}>
          No records found.
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading {title}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-error)" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>Manage Fund Head records</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => router.push("/tender/doctype/fund-head/new")}
        >
          <i className="fas fa-plus"></i> Add {title}
        </button>
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
            className="btn btn--outline btn--sm"
            onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
            aria-label="Toggle view"
            title={view === "grid" ? "List view" : "Grid view"}
          >
            {view === "grid" ? <i className="fas fa-list"></i> : <i className="fas fa-th-large"></i>}
          </button>
        </div>
      </div>

      <div className="view-container" style={{ marginTop: "1.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}