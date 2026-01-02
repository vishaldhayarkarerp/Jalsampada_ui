// app/page.tsx

"use client";

import * as React from "react";
import { appData } from "@/lib/sample-data";
// We only need the types used by the Dashboard
// import type { TechnicalData, SparePart, MaintenanceRecord } from "@/types/app-data";

export default function Home() {
  // All state related to navigation and sidebar is GONE.
  // We only keep the data calculations needed for THIS page (the Dashboard).
  const activePumps = appData.operation_data.filter(op => op.status === "Running").length;
  const totalPumps = 3;
  const totalFlowRate = appData.operation_data
    .filter(op => op.status === "Running")
    .reduce((sum, op) => sum + op.flow_rate_lps, 0);
  const lowStockItems = appData.spare_parts.filter(part => part.status === "Low Stock").length;

  return (
    // We only return the single module for the Dashboard.
    // The <main> tag is already in layout.tsx.
    <div className="module active">
      <div className="module-header mb-8">
        <div>
          <h2>Dashboard Overview</h2>
          <p>Real-time system status and key metrics</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <i className="fas fa-pump-medical"></i>
          </div>
          <div className="metric-content">
            <h3>Active Pumps</h3>
            <div className="metric-value">{activePumps}/{totalPumps}</div>
            <div className="metric-label">Currently Running</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <i className="fas fa-tint"></i>
          </div>
          <div className="metric-content">
            <h3>Flow Rate</h3>
            <div className="metric-value">{totalFlowRate.toFixed(1)}</div>
            <div className="metric-label">LPS Total</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="metric-content">
            <h3>Low Stock</h3>
            <div className="metric-value">{lowStockItems}</div>
            <div className="metric-label">Items Below Min</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <i className="fas fa-wrench"></i>
          </div>
          <div className="metric-content">
            <h3>Last Maintenance</h3>
            <div className="metric-value">26</div>
            <div className="metric-label">Days Ago</div>
          </div>
        </div>
      </div>

      {/* <div className="dashboard-section">
        <h3>Current System Status</h3>
        <div className="system-overview">
          <img
            src="https://pplx-res.cloudinary.com/image/upload/v1754977422/pplx_project_search_images/c5d0eb2d735c04188f4c45999bb460121d8bdd59.png"
            alt="Water Pumping System Overview"
            className="system-image"
          />
        </div>
      </div> */}
    </div>
  );
}
