"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://103.219.1.138:4412//api/resource";

interface Expenditure {
  name: string; // Corresponds to 'id' in your request, which is 'name' in the source structure
  fiscal_year?: string;
  bill_number?: string;
  bill_amount?: number | string;
  tender_number?: string;
  lift_irrigation_scheme?: string;
}

type ViewMode = "grid" | "list";

export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  // --- Changed doctypeName to "Expenditure" ---
  const doctypeName = "Expenditure";

  const [records, setRecords] = React.useState<Expenditure[]>([]);
  const [view, setView] = React.useState<ViewMode>("grid");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
          // --- Updated fields for Expenditure doctype ---
          fields: JSON.stringify([
            "name",
            "fiscal_year",
            "bill_number",
            "bill_amount",
            "tender_number",
            "lift_irrigation_scheme",
          ]),
          limit_page_length: "20",
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
        // --- Updated mapping logic for Expenditure fields ---
        const mapped: Expenditure[] = raw.map((r: any) => ({
          name: r.name,
          fiscal_year: r.fiscal_year ?? "",
          bill_number: r.bill_number ?? "",
          bill_amount: r.bill_amount ?? "",
          tender_number: r.tender_number ?? "",
          lift_irrigation_scheme: r.lift_irrigation_scheme ?? "",
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

    // --- Execute fetchRecords for the correct doctype ---
    if (doctypeName === "Expenditure") fetchRecords();
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized]);

  const title = "Expenditure"; // --- Updated title ---

  const handleCardClick = (id: string) => {
    // --- Updated routing path ---
    router.push(`/tender/doctype/expenditure/${id}`);
  };

  // --- Updated fields for the RecordCard (Grid View) ---
  const getFieldsForRecord = (record: Expenditure): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    fields.push({ label: "Fiscal Year", value: record.fiscal_year || "-" });
    fields.push({ label: "Bill Number", value: record.bill_number || "-" });
    fields.push({ label: "Tender No.", value: record.tender_number || "-" });
    fields.push({ label: "Bill Amount", value: String(record.bill_amount ?? "-") });
    return fields;
  };

  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fiscal Year</th>
            <th>Bill Number</th>
            <th>Bill Amount</th>
            <th>Tender Number</th>
            <th>LIS Scheme</th>
          </tr>
        </thead>
        <tbody>
          {records.length ? (
            records.map((record) => (
              <tr
                key={record.name}
                onClick={() => handleCardClick(record.name)}
                style={{ cursor: "pointer" }}
              >
                <td>{record.name}</td>
                <td>{record.fiscal_year}</td>
                <td>{record.bill_number}</td>
                <td>{record.bill_amount}</td>
                <td>{record.tender_number}</td>
                <td>{record.lift_irrigation_scheme}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "32px" }}> {/* Increased colSpan */}
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
      {records.length ? (
        records.map((record) => (
          <RecordCard
            key={record.name}
            title={record.name} // ID
            subtitle={record.lift_irrigation_scheme} // Use LIS Scheme as subtitle
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
      <div
        className="module active"
        style={{ padding: "2rem", textAlign: "center" }}
      >
        <p>Loading {title}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="module active"
        style={{ padding: "2rem", textAlign: "center" }}
      >
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>Manage Expenditure records</p> {/* Updated description */}
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
            {view === "grid" ? (
              <i className="fas fa-list"></i>
            ) : (
              <i className="fas fa-th-large"></i>
            )}
          </button>
        </div>
      </div>

      <div className="view-container" style={{ marginTop: "1.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}