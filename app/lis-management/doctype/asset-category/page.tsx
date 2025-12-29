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


interface AssetCategory {
  name: string;

}

type ViewMode = "grid" | "list";

export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Asset Category"; // <-- CHANGED

  const [categories, setCategories] = React.useState<AssetCategory[]>([]); // <-- CHANGED
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter categories client-side for instant results
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  React.useEffect(() => {
    const fetchCategories = async () => { // <-- CHANGED
      if (!isInitialized) return;
      if (!isAuthenticated || !apiKey || !apiSecret) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // --- TODO: Update these fields to match your DocType ---
        const params: any = {
          fields: JSON.stringify([
            "name",
            // "parent_asset_category",
            // "description"
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
        // --- TODO: Update this mapping ---
        const mapped: AssetCategory[] = raw.map((r: any) => ({
          name: r.name,
          // parent_asset_category: r.parent_asset_category ?? "—",
        }));

        setCategories(mapped); // <-- CHANGED
      } catch (err: any) {
        console.error("API error:", err);
        setError(
          err.response?.status === 403
            ? "Unauthorized – check API key/secret"
            : `Failed to fetch ${doctypeName}` // <-- CHANGED
        );
      } finally {
        setLoading(false);
      }
    };

    if (doctypeName === "Asset Category") fetchCategories(); // <-- CHANGED
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized]);

  const title = "Asset Category"; // <-- CHANGED

  const handleCardClick = (id: string) => {
    // <-- CHANGED
    router.push(`/lis-management/doctype/asset-category/${id}`);
  };

  /* -------------------------------------------------
  4. CARD FIELDS
  ------------------------------------------------- */
  // --- TODO: Update this function ---
  const getFieldsForCategory = (cat: AssetCategory): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    // if (cat.parent_asset_category) fields.push({ label: "Parent", value: cat.parent_asset_category });
    fields.push({ label: "ID", value: cat.name });
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
            <th>Name</th>
            {/* --- TODO: Add list columns --- */}
            {/* <th>Parent Category</th> */}
          </tr>
        </thead>
        <tbody>
          {filteredCategories.length ? (
            filteredCategories.map((cat) => (
              <tr
                key={cat.name}
                onClick={() => handleCardClick(cat.name)}
                style={{ cursor: "pointer" }}
              >
                <td>{cat.name}</td>
                {/* <td>{cat.parent_asset_category || "—"}</td> */}
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
      {filteredCategories.length ? (
        filteredCategories.map((cat) => (
          <RecordCard
            key={cat.name}
            title={cat.name}
            // subtitle={cat.parent_asset_category} // <-- TODO
            fields={getFieldsForCategory(cat)}
            onClick={() => handleCardClick(cat.name)}
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
        <p>Loading {title}...</p> {/* <-- CHANGED */}
      </div>
    );
  }
  // (Error states are already dynamic)

  /* -------------------------------------------------
  8. MAIN RENDER
  ------------------------------------------------- */
  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>Manage categories for assets</p> {/* <-- CHANGED */}
        </div>
        <button 
          className="btn btn--primary"
          onClick={() => router.push('/lis-management/doctype/asset-category/new')}
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