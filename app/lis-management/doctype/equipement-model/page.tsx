"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://103.219.1.138:4412//api/resource";

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
 1. Minimal Model type
 ------------------------------------------------- */
interface EquipementModel {
  name: string;
  equipement_model: string;
}

/* -------------------------------------------------
 2. Component
 ------------------------------------------------- */
type ViewMode = "grid" | "list";

export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Equipement Model"; // <-- CHANGED

  const [models, setModels] = React.useState<EquipementModel[]>([]); // <-- CHANGED
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter models client-side for instant results
  const filteredModels = React.useMemo(() => {
    if (!searchTerm) return models;
    return models.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.equipement_model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [models, searchTerm]);

  /* -------------------------------------------------
  3. FETCH
  ------------------------------------------------- */
  React.useEffect(() => {
    const fetchModels = async () => { // <-- CHANGED
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
            "equipement_model" // Fetch the field
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
        const mapped: EquipementModel[] = raw.map((r: any) => ({
          name: r.name,
          equipement_model: r.equipement_model ?? r.name, // Use field, fallback to name
        }));

        setModels(mapped); // <-- CHANGED
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

    if (doctypeName === "Equipement Model") fetchModels(); // <-- CHANGED
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized]);

  const title = "Equipement Model"; // <-- CHANGED

  const handleCardClick = (id: string) => {
    router.push(`/lis-management/doctype/equipement-model/${id}`); // <-- CHANGED
  };

  /* -------------------------------------------------
  4. CARD FIELDS
  ------------------------------------------------- */
  const getFieldsForModel = (model: EquipementModel): RecordCardField[] => {
    return []; // Title/Subtitle is enough
  };

  /* -------------------------------------------------
  5. LIST VIEW
  ------------------------------------------------- */
  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Equipement Model</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {filteredModels.length ? (
            filteredModels.map((model) => (
              <tr
                key={model.name}
                onClick={() => handleCardClick(model.name)}
                style={{ cursor: "pointer" }}
              >
                <td>{model.equipement_model}</td>
                <td>{model.name}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} style={{ textAlign: "center", padding: "32px" }}>
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
      {filteredModels.length ? (
        filteredModels.map((model) => (
          <RecordCard
            key={model.name}
            title={model.equipement_model} // Show model
            subtitle={model.name} // Show ID
            fields={getFieldsForModel(model)}
            onClick={() => handleCardClick(model.name)}
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
  
  if (error && models.length === 0) {
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
          <p>Manage Equipement Model master</p> {/* <-- CHANGED */}
        </div>
        <button 
          className="btn btn--primary"
          onClick={() => router.push('/lis-management/doctype/equipement-model/new')}
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