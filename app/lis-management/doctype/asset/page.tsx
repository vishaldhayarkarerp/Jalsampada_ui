"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://103.219.1.138:4429/api/resource";

/* -------------------------------------------------
   1. Minimal Asset type
   ------------------------------------------------- */
interface Asset {
  name: string;
  location: string;
  custom_lis_name?: string;
  custom_stage_no?: string;
}

/* -------------------------------------------------
   2. Component
   ------------------------------------------------- */
type ViewMode = "grid" | "list";

export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Asset";

  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [view, setView] = React.useState<ViewMode>("grid");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  /* -------------------------------------------------
     3. FETCH – with field filtering
     ------------------------------------------------- */
  React.useEffect(() => {
    const fetchAssets = async () => {
      if (!isInitialized) return;
      if (!isAuthenticated || !apiKey || !apiSecret) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Only request the fields we need
        const params = {
          fields: JSON.stringify([
            "name",
            "location",
            "custom_lis_name",
            "custom_stage_no"
          ]),
          limit_page_length: "20",
          order_by: "creation desc"
        };

        const resp = await axios.get(`${API_BASE_URL}/Asset`, {
          params, // This adds ?fields=...&limit_page_length=...
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
          withCredentials: true,
        });

        const raw = resp.data?.data ?? [];
        const mapped: Asset[] = raw.map((r: any) => ({
          name: r.name,
          location: r.location ?? "—",
          custom_lis_name: r.custom_lis_name,
          custom_stage_no: r.custom_stage_no,
        }));

        setAssets(mapped);
      } catch (err: any) {
        console.error("API error:", err);
        setError(
          err.response?.status === 403
            ? "Unauthorized – check API key/secret"
            : "Failed to fetch assets"
        );
      } finally {
        setLoading(false);
      }
    };

    if (doctypeName === "Asset") fetchAssets();
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized]);

  const title = "Asset";

  const handleCardClick = (id: string) => {
    router.push(`/lis-management/doctype/asset/${id}`);
  };

  /* -------------------------------------------------
     4. CARD FIELDS
     ------------------------------------------------- */
  const getFieldsForAsset = (a: Asset): RecordCardField[] => {
    const fields: RecordCardField[] = [];

    if (a.custom_lis_name) fields.push({ label: "LIS", value: a.custom_lis_name });
    if (a.custom_stage_no) fields.push({ label: "Stage", value: a.custom_stage_no });
    fields.push({ label: "Location", value: a.location });

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
            <th>ID</th>
            <th>LIS</th>
            <th>Stage</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {assets.length ? (
            assets.map((a) => (
              <tr
                key={a.name}
                onClick={() => handleCardClick(a.name)}
                style={{ cursor: "pointer" }}
              >
                <td>{a.name}</td>
                <td>{a.custom_lis_name || "—"}</td>
                <td>{a.custom_stage_no || "—"}</td>
                <td>{a.location}</td>
              </tr>
            ))
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
      {assets.length ? (
        assets.map((a) => (
          <RecordCard
            key={a.name}
            title={a.name}
            subtitle={a.location}
            fields={getFieldsForAsset(a)}
            onClick={() => handleCardClick(a.name)}
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
        <p>Loading assets…</p>
      </div>
    );
  }

  if (error && assets.length === 0) {
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
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>Equipment locations and stages</p>
        </div>
        <button className="btn btn--primary">
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