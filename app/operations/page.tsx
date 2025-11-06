// app/operations/page.tsx

"use client";

import * as React from "react";
import { appData } from "@/lib/sample-data";

export default function OperationsPage() {
  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Operation Data</h2>
          <p>Real-time monitoring and operational parameters</p>
        </div>
      </div>

      <div className="operations-grid">
        <div className="card pump-status-card">
          <div className="card__header">
            <h3>Pump Status</h3>
          </div>
          <div className="card__body">
            <div>
              {appData.operation_data.map((op) => (
                <div
                  key={op.pump_id}
                  className={`pump-status-item ${op.status.toLowerCase()}`}
                >
                  <span className="pump-id">{op.pump_id}</span>
                  <span className={`status ${op.status.toLowerCase()}`}>
                    {op.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card readings-card">
          <div className="card__header">
            <h3>Current Readings</h3>
            <button className="btn btn--sm btn--secondary">Add Reading</button>
          </div>
          <div className="card__body">
            <div className="operational-trends">
              {appData.operation_data.filter(op => op.status === "Running").map((op) => (
                <div key={op.pump_id} style={{ marginBottom: "var(--space-16)" }}>
                  <h4 style={{ marginBottom: "var(--space-8)" }}>{op.pump_id}</h4>
                  <div className="performance-metrics">
                    <div className="performance-item">
                      <span>Flow Rate</span>
                      <span className="performance-value">{op.flow_rate_lps} LPS</span>
                    </div>
                    <div className="performance-item">
                      <span>Current</span>
                      <span className="performance-value">{op.current_a} A</span>
                    </div>
                    <div className="performance-item">
                      <span>Temperature</span>
                      <span className="performance-value">{op.temperature_c}°C</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}