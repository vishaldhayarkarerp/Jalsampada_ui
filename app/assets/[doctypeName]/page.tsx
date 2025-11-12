"use client";

import * as React from "react";
import { appData } from "@/lib/sample-data";
import type { TechnicalData } from "@/types/app-data";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
type ViewMode = "grid" | "list";
export default function DoctypePage() {
  const router = useRouter();

  const doctypeName = "asset";

  const [doctypeData, setDoctypeData] = React.useState<TechnicalData[]>([]);
  const [view, setView] = React.useState<ViewMode>("grid");
  React.useEffect(() => {
    if (doctypeName === "asset") {
      const storedData = localStorage.getItem("technical_data");

      if (storedData) {
        setDoctypeData(JSON.parse(storedData));
      } else {
        localStorage.setItem("technical_data", JSON.stringify(appData.technical_data));
        setDoctypeData(appData.technical_data);
      }
    }
  }, [doctypeName]);
  const title = React.useMemo(() => {
    if (!doctypeName) return "Loading...";
    return doctypeName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, [doctypeName]);

  const handleCardClick = (recordId: string) => {
    // This part is correct, it navigates to the form
    router.push(`/assets/${doctypeName}/${recordId}`);
  };

  const getFieldsForDoctype = (record: TechnicalData): RecordCardField[] => {
    if (doctypeName === "asset") {
      const fields: RecordCardField[] = [];
      fields.push({ label: "Manufacturer", value: record.manufacturer });
      fields.push({ label: "Model", value: record.model });
      if (record.capacity_lps > 0) {
        fields.push({ label: "Capacity", value: `${record.capacity_lps} LPS` });
      }
      if (record.head_m > 0) {
        fields.push({ label: "Head", value: `${record.head_m} m` });
      }
      fields.push({ label: "Power", value: `${record.power_kw} kW` });
      fields.push({ label: "Voltage", value: `${record.voltage_v} V` });
      fields.push({ label: "Year", value: record.commissioning_year });
      fields.push({ label: "Location", value: record.location });
      return fields;
    }
    return [];
  };
const renderListView = () => (
  // 1. Use the class from TPReportsPage
  <div className="stock-table-container"> 
    {/* 2. Use the class from TPReportsPage */}
    <table className="stock-table"> 
      <thead>
        <tr>
          <th>Pump ID</th>
          <th>Type</th>
          <th>Manufacturer</th>
          <th>Model</th>
          <th>Location</th>
          <th>Power</th>
        </tr>
      </thead>
      <tbody>
        {doctypeData.length > 0 ? (
          doctypeData.map((equipment) => (
            <tr
              key={equipment.pump_id}
              onClick={() => handleCardClick(equipment.pump_id)}
            >
              <td>{equipment.pump_id}</td>
              <td>{equipment.pump_type}</td>
              <td>{equipment.manufacturer}</td>
              <td>{equipment.model}</td>
              <td>{equipment.location}</td>
              <td>{equipment.power_kw} kW</td>
            </tr>
          ))
        ) : (
          <tr>
            {/* 6 columns in this table */}
            <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>
              No records found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

  // --- 4. A new helper function to render the Grid View Cards ---
  const renderGridView = () => (
    <div className="equipment-grid">
      {doctypeData.length > 0 ? (
        doctypeData.map((equipment) => (
          <RecordCard
            key={equipment.pump_id}
            title={equipment.pump_id}
            subtitle={equipment.pump_type}
            fields={getFieldsForDoctype(equipment)}
            onClick={() => handleCardClick(equipment.pump_id)}
          />
        ))
      ) : (
        <p style={{ color: "var(--color-text-secondary)" }}>
          No records found for "{title}".
        </p>
      )}
    </div>
  );  
return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>Equipment specifications and technical information</p>
        </div>
        <button className="btn btn--primary">
          <i className="fas fa-plus"></i> Add {title}
        </button>
      </div>

      {/* --- 5. Updated search/filter section --- */}
      <div
        className="search-filter-section"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder={`Search ${title}...`}
            className="form-control"
          />
          <select className="form-control">
            <option value="">All Types</option>
            <option value="Centrifugal">Centrifugal</option>
            <option value="Submersible">Submersible</option>
            <option value="Motor">Motor</option>
          </select>
        </div>

        {/* --- 6. The new SINGLE View Toggler Button --- */}
<div className="view-switcher" style={{ display: "flex" }}>
  <button
    className="btn btn--outline btn--sm" // Use your standard icon button style
    onClick={() => setView(prev => prev === "grid" ? "list" : "grid")}
    aria-label="Toggle View"
    title={view === "grid" ? "Show List View" : "Show Grid View"} // Tooltip for accessibility
  >
    {/* This icon now swaps based on the current view */}
    <i className={view === "grid" ? "fas fa-list" : "fas fa-th-large"}></i>
  </button>
</div>
      </div>

      {/* --- 7. Conditional Rendering: Show Grid or List --- */}
      <div className="view-container" style={{ marginTop: "1.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}