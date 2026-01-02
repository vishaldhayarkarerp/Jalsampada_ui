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

interface Tender {
  name: string;              // id
  status?: string;           // from custom_tender_status
  tender_name?: string;      // from custom_prapan_suchi
}

type ViewMode = "grid" | "list";

export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Project";

  const [tenders, setTenders] = React.useState<Tender[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter tenders client-side for instant results
  const filteredTenders = React.useMemo(() => {
    if (!searchTerm) return tenders;
    return tenders.filter(tender =>
      tender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tender.tender_name && tender.tender_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tender.status && tender.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tenders, searchTerm]);

  React.useEffect(() => {
    const fetchTenders = async () => {
      if (!isInitialized) return;
      if (!isAuthenticated || !apiKey || !apiSecret) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = {
          // only fetch the 3 fields
          fields: JSON.stringify([
            "name",                  // id
            "custom_tender_status",  // status
            "custom_prapan_suchi",   // tender name
          ]),
          limit_page_length: 20,
          order_by: "creation desc",
        };

        const resp = await axios.get(`${API_BASE_URL}/${doctypeName}`, {
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
    };

    fetchTenders();
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized]);

  const title = "Tender";

  const handleCardClick = (id: string) => {
    router.push(`/tender/doctype/tender/${id}`);
  };

  const getFieldsForTender = (t: Tender): RecordCardField[] => {
    const fields: RecordCardField[] = [];

    fields.push({ label: "ID", value: t.name });
    if (t.status) fields.push({ label: "Status", value: t.status });
    if (t.tender_name)
      fields.push({ label: "Prapan Suchi", value: t.tender_name });

    return fields;
  };

  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Prapan Suchi</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredTenders.length ? (
            filteredTenders.map((t) => (
              <tr
                key={t.name}
                onClick={() => handleCardClick(t.name)}
                style={{ cursor: "pointer" }}
              >
                <td>{t.name}</td>
                <td>{t.tender_name}</td>
                <td>{t.status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: "32px" }}>
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
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>Manage tender records</p>
        </div>
        <button 
          className="btn btn--primary"
          onClick={() => router.push('/tender/doctype/tender/new')}
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
        <div style={{ display: "flex", gap: 8 }}>
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
