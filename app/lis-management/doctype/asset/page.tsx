"use client";

import * as React from "react";
import { appData } from "@/lib/sample-data";
import type { TechnicalData } from "@/types/app-data";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";

export default function DoctypePage() {
  const router = useRouter();

  const doctypeName = "asset";

  const [doctypeData, setDoctypeData] = React.useState<TechnicalData[]>([]);

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

  const handleCardClick = (id: string) => {
    // This part is correct, it navigates to the form
    router.push(`/lis-management/doctype/${doctypeName}/${id}`);
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

      <div className="search-filter-section">
        <input type="text" placeholder={`Search ${title}...`} className="form-control" />
        <select className="form-control">
          <option value="">All Types</option>
          <option value="Centrifugal">Centrifugal</option>
          <option value="Submersible">Submersible</option>
          <option value="Motor">Motor</option>
        </select>
      </div>

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
    </div>
  );
}