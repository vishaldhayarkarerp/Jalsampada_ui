"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://192.168.1.30:4429//api/resource";

/* -------------------------------------------------
 1. Minimal Capacity type
 ------------------------------------------------- */
interface EquipementCapacity {
  name: string;
  equipement_capacity: string;
}

/* -------------------------------------------------
 2. Component
 ------------------------------------------------- */
type ViewMode = "grid" | "list";

export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Equipement Capacity"; // <-- CHANGED

  const [capacities, setCapacities] = React.useState<EquipementCapacity[]>([]); // <-- CHANGED
  const [view, setView] = React.useState<ViewMode>("grid");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  /* -------------------------------------------------
  3. FETCH
  ------------------------------------------------- */
  React.useEffect(() => {
    const fetchCapacities = async () => { // <-- CHANGED
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
            "equipement_capacity" // Fetch the field
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
        const mapped: EquipementCapacity[] = raw.map((r: any) => ({
          name: r.name,
          equipement_capacity: r.equipement_capacity ?? r.name, // Use field, fallback to name
        }));

        setCapacities(mapped); // <-- CHANGED
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

    if (doctypeName === "Equipement Capacity") fetchCapacities(); // <-- CHANGED
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized]);

  const title = "Equipement Capacity"; // <-- CHANGED

  const handleCardClick = (id: string) => {
    router.push(`/lis-management/doctype/equipement-capacity/${id}`); // <-- CHANGED
  };

  /* -------------------------------------------------
  4. CARD FIELDS
  ------------------------------------------------- */
  const getFieldsForCapacity = (capacity: EquipementCapacity): RecordCardField[] => {
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
            <th>Equipement Capacity</th>
            <th>ID (Name)</th>
          </tr>
        </thead>
        <tbody>
          {capacities.length ? ( // <-- CHANGED
            capacities.map((capacity) => ( // <-- CHANGED
              <tr
                key={capacity.name}
                onClick={() => handleCardClick(capacity.name)}
                style={{ cursor: "pointer" }}
              >
                <td>{capacity.equipement_capacity}</td>
                <td>{capacity.name}</td>
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
      {capacities.length ? ( // <-- CHANGED
        capacities.map((capacity) => ( // <-- CHANGED
          <RecordCard
            key={capacity.name}
            title={capacity.equipement_capacity} // Show the capacity
            subtitle={capacity.name} // Show the ID
            fields={getFieldsForCapacity(capacity)}
            onClick={() => handleCardClick(capacity.name)}
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
  
  if (error && capacities.length === 0) {
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
          <p>Manage Equipement Capacity master</p> {/* <-- CHANGED */}
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