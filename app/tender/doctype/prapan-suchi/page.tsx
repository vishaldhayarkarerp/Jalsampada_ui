"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://103.219.1.138:4412//api/resource";

interface PrapanSuchi {
  name: string;
  fiscal_year?: string;
  lis_name?: string;
  type?: string;
  amount?: number | string;
}

type ViewMode = "grid" | "list";

export default function DoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "Prapan Suchi";

  const [records, setRecords] = React.useState<PrapanSuchi[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
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
          fields: JSON.stringify([
            "name",
            "fiscal_year",
            "lis_name",
            "type",
            "amount",
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
        const mapped: PrapanSuchi[] = raw.map((r: any) => ({
          name: r.name,
          fiscal_year: r.fiscal_year ?? "",
          lis_name: r.lis_name ?? "",
          type: r.type ?? "",
          amount: r.amount ?? "",
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

    if (doctypeName === "Prapan Suchi") fetchRecords();
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized]);

  const title = "Prapan Suchi";

  const handleCardClick = (id: string) => {
    router.push(`/tender/doctype/prapan-suchi/${id}`);
  };

  const getFieldsForRecord = (record: PrapanSuchi): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    fields.push({ label: "Fiscal Year", value: record.fiscal_year || "-" });
    fields.push({ label: "LIS Name", value: record.lis_name || "-" });
    fields.push({ label: "Type", value: record.type || "-" });
    fields.push({ label: "Amount", value: String(record.amount ?? "-") });
    return fields;
  };

  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Fiscal Year</th>
            <th>LIS Name</th>
            <th>Type</th>
            <th>Amount</th>
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
                <td>{record.lis_name}</td>
                <td>{record.type}</td>
                <td>{record.amount}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: "32px" }}>
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
            title={record.name}
            subtitle={record.lis_name}
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
          <p>Manage Prapan Suchi records</p>
        </div>
        <button 
          className="btn btn--primary"
          onClick={() => router.push('/tender/doctype/prapan-suchi/new')}
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
