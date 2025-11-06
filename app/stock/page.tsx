// app/stock/page.tsx

"use client";

import * as React from "react";
import { appData } from "@/lib/sample-data";
import type { SparePart, MaintenanceRecord } from "@/types/app-data";

export default function StockPage() {
  // --- The state for the tabs now LIVES in this page ---
  const [activeStockTab, setActiveStockTab] = React.useState("inventory");

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Stock & Maintenance</h2>
          <p>Spare parts inventory and maintenance records</p>
        </div>
        <button className="btn btn--primary">
          <i className="fas fa-plus"></i> Add Work Order
        </button>
      </div>

      <div className="stock-tabs">
        <button
          className={`tab-btn ${activeStockTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveStockTab("inventory")}
        >
          Inventory
        </button>
        <button
          className={`tab-btn ${activeStockTab === "maintenance" ? "active" : ""}`}
          onClick={() => setActiveStockTab("maintenance")}
        >
          Maintenance History
        </button>
        <button
          className={`tab-btn ${activeStockTab === "alerts" ? "active" : ""}`}
          onClick={() => setActiveStockTab("alerts")}
        >
          Stock Alerts
        </button>
      </div>

      {/* The conditional rendering for tabs works perfectly here */}
      {activeStockTab === "inventory" && (
        <div className="tab-content active">
          <div className="search-section">
            <input type="text" placeholder="Search spare parts..." className="form-control" />
          </div>
          <div className="stock-table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Part ID</th>
                  <th>Description</th>
                  <th>Model</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appData.spare_parts.map((part: SparePart) => (
                  <tr key={part.part_id}>
                    <td>{part.part_id}</td>
                    <td>{part.description}</td>
                    <td>{part.pump_model}</td>
                    <td className={part.status === "Low Stock" ? "low-stock" : ""}>
                      {part.quantity}
                    </td>
                    <td>{part.min_stock}</td>
                    <td>₹{part.unit_cost.toLocaleString()}</td>
                    <td>
                      <span className={`status ${part.status === "Low Stock" ? "status--error" : "status--success"}`}>
                        {part.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeStockTab === "maintenance" && (
        <div className="tab-content active">
          <div className="maintenance-records">
            {appData.maintenance_records.map((record: MaintenanceRecord) => (
              <div key={record.record_id} className="maintenance-record">
                <div className="record-header">
                  <span className="record-id">{record.record_id}</span>
                  <span className="record-date">{record.date}</span>
                </div>
                <div className="record-details">
                  <div className="record-detail-item">
                    <span className="record-detail-label">Pump ID</span>
                    <span className="record-detail-value">{record.pump_id}</span>
                  </div>
                  <div className="record-detail-item">
                    <span className="record-detail-label">Type</span>
                    <span className="record-detail-value">{record.type}</span>
                  </div>
                  <div className="record-detail-item">
                    <span className="record-detail-label">Cost</span>
                    <span className="record-detail-value">₹{record.cost.toLocaleString()}</span>
                  </div>
                  <div className="record-detail-item">
                    <span className="record-detail-label">Status</span>
                    <span className={`status ${record.status === "Completed" ? "status--success" : "status--info"}`}>
                      {record.status}
                    </span>
                  </div>
                </div>
                <p style={{ marginTop: "var(--space-12)", color: "var(--color-text-secondary)" }}>
                  {record.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStockTab === "alerts" && (
        <div className="tab-content active">
          <div className="alert-section">
            <h3>Stock Alerts</h3>
            <div>
              {appData.spare_parts.filter(part => part.status === "Low Stock").map((part) => (
                <div key={part.part_id} className="stock-alert">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{part.description} ({part.part_id}) is low on stock. Current: {part.quantity}, Min: {part.min_stock}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}