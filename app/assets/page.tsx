// app/assets/page.tsx

"use client";

import * as React from "react";
import { appData } from "@/lib/sample-data";
import type { TechnicalData } from "@/types/app-data";

export default function AssetsPage() {
  // This page doesn't need any state, just the data.
  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Assets</h2>
          <p>Equipment specifications and technical information</p>
        </div>
        <button className="btn btn--primary">
          <i className="fas fa-plus"></i> Add Equipment
        </button>
      </div>

      <div className="search-filter-section">
        <input type="text" placeholder="Search equipment..." className="form-control" />
        <select className="form-control">
          <option value="">All Types</option>
          <option value="Centrifugal">Centrifugal</option>
          <option value="Submersible">Submersible</option>
          <option value="Motor">Motor</option>
        </select>
      </div>

      <div className="equipment-grid">
        {appData.technical_data.map((equipment: TechnicalData) => (
          <div key={equipment.pump_id} className="equipment-card">
            <div className="equipment-card-header">
              <h4>{equipment.pump_id}</h4>
              <div className="equipment-type">{equipment.pump_type}</div>
            </div>
            <div className="equipment-card-body">
              <div className="equipment-specs">
                <div className="spec-item">
                  <span className="spec-label">Manufacturer</span>
                  <span className="spec-value">{equipment.manufacturer}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Model</span>
                  <span className="spec-value">{equipment.model}</span>
                </div>
                {equipment.capacity_lps > 0 && (
                  <div className="spec-item">
                    <span className="spec-label">Capacity</span>
                    <span className="spec-value">{equipment.capacity_lps} LPS</span>
                  </div>
                )}
                {equipment.head_m > 0 && (
                  <div className="spec-item">
                    <span className="spec-label">Head</span>
                    <span className="spec-value">{equipment.head_m} m</span>
                  </div>
                )}
                <div className="spec-item">
                  <span className="spec-label">Power</span>
                  <span className="spec-value">{equipment.power_kw} kW</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Voltage</span>
                  <span className="spec-value">{equipment.voltage_v} V</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Year</span>
                  <span className="spec-value">{equipment.commissioning_year}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Location</span>
                  <span className="spec-value">{equipment.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}