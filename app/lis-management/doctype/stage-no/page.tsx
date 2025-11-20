"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://192.168.1.30:4429//api/resource";

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
  const doctypeName = "Stage No"; // <-- CHANGED

  const [stages, setStages] = React.useState<StageNo[]>([]); // <-- CHANGED
  const [view, setView] = React.useState<ViewMode>("grid");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  /* -------------------------------------------------
  3. FETCH
  ------------------------------------------------- */
  React.useEffect(() => {
    const fetchStages = async () => { // <-- CHANGED
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
            "lis_name" // Fetch the fields
          ]),
          limit_page_length: "20",
          order_by: "creation desc"
        };

        const resp = await axios.get(`${API_BASE_URL}/${doctypeName}`, { // <-- CHANGED
          params,
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
          withCredentials: true,
        });

        const raw = resp.data?.data ?? [];
        const mapped: StageNo[] = raw.map((r: any) => ({
          name: r.name,
          stage_no: r.stage_no ?? r.name, // Use stage_no, fallback to name
          lis_name: r.lis_name ?? "—",
        }));

        setStages(mapped); // <-- CHANGED
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

    if (doctypeName === "Stage No") fetchStages(); // <-- CHANGED
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized]);

  const title = "Stage No"; // <-- CHANGED

  const handleCardClick = (id: string) => {
    router.push(`/lis-management/doctype/stage-no/${id}`); // <-- CHANGED
  };

  /* -------------------------------------------------
  4. CARD FIELDS
  ------------------------------------------------- */
  const getFieldsForStage = (stage: StageNo): RecordCardField[] => {
    // Show LIS Name as a field on the card
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
            <th>Stage No</th>
            <th>LIS Name</th>
            <th>ID (Name)</th>
          </tr>
        </thead>
        <tbody>
          {stages.length ? ( // <-- CHANGED
            stages.map((stage) => ( // <-- CHANGED
              <tr
                key={stage.name}
                onClick={() => handleCardClick(stage.name)}
                style={{ cursor: "pointer" }}
              >
                <td>{stage.stage_no}</td>
                <td>{stage.lis_name}</td>
                <td>{stage.name}</td>
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

  /* -------------------------------------------------
  6. GRID VIEW
  ------------------------------------------------- */
  const renderGridView = () => (
    <div className="equipment-grid">
      {stages.length ? ( // <-- CHANGED
        stages.map((stage) => ( // <-- CHANGED
          <RecordCard
            key={stage.name}
            title={stage.stage_no} // Show the stage number
            subtitle={stage.lis_name} // Show the LIS name
            fields={[]} // No extra fields, title/subtitle are enough
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
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>Manage Stage No master</p> {/* <-- CHANGED */}
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