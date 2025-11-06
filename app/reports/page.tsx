// app/reports/page.tsx

"use client";

import * as React from "react";
import { appData } from "@/lib/sample-data";

export default function ReportsPage() {
  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Reports</h2>
          <p>Analytics and detailed reports</p>
        </div>
      </div>

      <div className="report-filters">
        <div className="filter-group">
          <label>Date Range:</label>
          <input type="date" className="form-control" />
          <input type="date" className="form-control" />
        </div>
        <div className="filter-group">
          <label>Equipment:</label>
          <select className="form-control">
            <option value="">All Equipment</option>
            {appData.technical_data.map(eq => (
              <option key={eq.pump_id} value={eq.pump_id}>{eq.pump_id}</option>
            ))}
          </select>
        </div>
        <button className="btn btn--primary">Generate Report</button>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <h3>Equipment Performance</h3>
          <div className="performance-metrics">
            <div className="performance-item">
              <span>Average Efficiency</span>
              <span className="performance-value">94.2%</span>
            </div>
            <div className="performance-item">
              <span>Total Operating Hours</span>
              <span className="performance-value">8,760 hrs</span>
            </div>
            <div className="performance-item">
              <span>Maintenance Frequency</span>
              <span className="performance-value">Monthly</span>
            </div>
          </div>
        </div>
      </div>

      <div className="export-section">
        <h3>Export Data</h3>
        <div className="export-buttons">
          <button className="btn btn--outline">
            <i className="fas fa-file-pdf"></i> Export PDF
          </button>
          <button className="btn btn--outline">
            <i className="fas fa-file-excel"></i> Export Excel
          </button>
          <button className="btn btn--outline">
            <i className="fas fa-file-csv"></i> Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}