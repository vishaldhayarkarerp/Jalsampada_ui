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
      <div className="module-header">
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




// "use client";

// import * as React from "react";
// import { appData } from "@/lib/sample-data";
// import type { TechnicalData, SparePart, MaintenanceRecord } from "@/types/app-data";
// import { ModeToggle } from "@/components/ModeToggle";

// export default function Home() {
//   const [activeModule, setActiveModule] = React.useState("dashboard");
//   const [activeStockTab, setActiveStockTab] = React.useState("inventory");

//   const activePumps = appData.operation_data.filter(op => op.status === "Running").length;
//   const totalPumps = 3;
//   const totalFlowRate = appData.operation_data
//     .filter(op => op.status === "Running")
//     .reduce((sum, op) => sum + op.flow_rate_lps, 0);
//   const lowStockItems = appData.spare_parts.filter(part => part.status === "Low Stock").length;
//   const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
//   return (
//     <div className={`app-container ${!isSidebarOpen ? "sidebar-collapsed" : ""}`}>
//       {/* Header */}
//       <header className="header">
//         <div className="header-content">
//           <div
//             className="logo-section"
//             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             style={{ cursor: 'pointer' }}
//           >
//             <i className="fas fa-water"></i>
//             <h1>JALSAMPADA</h1>
//           </div>
//           <div className="user-info">
//             <span>Welcome, Admin</span>
//             <i className="fas fa-user-circle"></i>
//             <ModeToggle />
//           </div>
//         </div>
//       </header>

//       {/* Sidebar Navigation */}
//       <nav className="sidebar">
//         <div className="nav-items">
//           <a
//             href="#"
//             className={`nav-item ${activeModule === "dashboard" ? "active" : ""}`}
//             onClick={(e) => { e.preventDefault(); console.log('Setting module to dashboard'); setActiveModule("dashboard"); }}
//           >
//             <i className="fas fa-tachometer-alt"></i>
//             <span>Dashboard</span>
//           </a>
//           <a
//             href="#"
//             className={`nav-item ${activeModule === "technical" ? "active" : ""}`}
//             onClick={(e) => { e.preventDefault(); console.log('Setting module to technical'); setActiveModule("technical"); }}
//           >
//             <i className="fas fa-cogs"></i>
//             <span>Assets</span>
//           </a>
//           <a
//             href="#"
//             className={`nav-item ${activeModule === "operations" ? "active" : ""}`}
//             onClick={(e) => { e.preventDefault(); console.log('Setting module to operations'); setActiveModule("operations"); }}
//           >
//             <i className="fas fa-chart-line"></i>
//             <span>Operations</span>
//           </a>
//           <a
//             href="#"
//             className={`nav-item ${activeModule === "stock" ? "active" : ""}`}
//             onClick={(e) => { e.preventDefault(); console.log('Setting module to stock'); setActiveModule("stock"); }}
//           >
//             <i className="fas fa-boxes"></i>
//             <span>Stock & Maintenance</span>
//           </a>
//           <a
//             href="#"
//             className={`nav-item ${activeModule === "reports" ? "active" : ""}`}
//             onClick={(e) => { e.preventDefault(); console.log('Setting module to reports'); setActiveModule("reports"); }}
//           >
//             <i className="fas fa-file-alt"></i>
//             <span>Reports</span>
//           </a>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="main-content">
//         {/* Dashboard Module */}
//         {activeModule === "dashboard" && (
//           <div className="module active">
//             <div className="module-header">
//               <div>
//                 <h2>Dashboard Overview</h2>
//                 <p>Real-time system status and key metrics</p>
//               </div>
//             </div>

//             <div className="dashboard-grid">
//               <div className="metric-card">
//                 <div className="metric-icon">
//                   <i className="fas fa-pump-medical"></i>
//                 </div>
//                 <div className="metric-content">
//                   <h3>Active Pumps</h3>
//                   <div className="metric-value">{activePumps}/{totalPumps}</div>
//                   <div className="metric-label">Currently Running</div>
//                 </div>
//               </div>

//               <div className="metric-card">
//                 <div className="metric-icon">
//                   <i className="fas fa-tint"></i>
//                 </div>
//                 <div className="metric-content">
//                   <h3>Flow Rate</h3>
//                   <div className="metric-value">{totalFlowRate.toFixed(1)}</div>
//                   <div className="metric-label">LPS Total</div>
//                 </div>
//               </div>

//               <div className="metric-card">
//                 <div className="metric-icon">
//                   <i className="fas fa-exclamation-triangle"></i>
//                 </div>
//                 <div className="metric-content">
//                   <h3>Low Stock</h3>
//                   <div className="metric-value">{lowStockItems}</div>
//                   <div className="metric-label">Items Below Min</div>
//                 </div>
//               </div>

//               <div className="metric-card">
//                 <div className="metric-icon">
//                   <i className="fas fa-wrench"></i>
//                 </div>
//                 <div className="metric-content">
//                   <h3>Last Maintenance</h3>
//                   <div className="metric-value">26</div>
//                   <div className="metric-label">Days Ago</div>
//                 </div>
//               </div>
//             </div>

//             <div className="dashboard-section">
//               <h3>Current System Status</h3>
//               <div className="system-overview">
//                 <img
//                   src="https://pplx-res.cloudinary.com/image/upload/v1754977422/pplx_project_search_images/c5d0eb2d735c04188f4c45999bb460121d8bdd59.png"
//                   alt="Water Pumping System Overview"
//                   className="system-image"
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Assets Module */}
//         {activeModule === "technical" && (
//           <div className="module active">
//             <div className="module-header">
//               <div>
//                 <h2>Assets</h2>
//                 <p>Equipment specifications and technical information</p>
//               </div>
//               <button className="btn btn--primary">
//                 <i className="fas fa-plus"></i> Add Equipment
//               </button>
//             </div>

//             <div className="search-filter-section">
//               <input type="text" placeholder="Search equipment..." className="form-control" />
//               <select className="form-control">
//                 <option value="">All Types</option>
//                 <option value="Centrifugal">Centrifugal</option>
//                 <option value="Submersible">Submersible</option>
//                 <option value="Motor">Motor</option>
//               </select>
//             </div>

//             <div className="equipment-grid">
//               {appData.technical_data.map((equipment: TechnicalData) => (
//                 <div key={equipment.pump_id} className="equipment-card">
//                   <div className="equipment-card-header">
//                     <h4>{equipment.pump_id}</h4>
//                     <div className="equipment-type">{equipment.pump_type}</div>
//                   </div>
//                   <div className="equipment-card-body">
//                     <div className="equipment-specs">
//                       <div className="spec-item">
//                         <span className="spec-label">Manufacturer</span>
//                         <span className="spec-value">{equipment.manufacturer}</span>
//                       </div>
//                       <div className="spec-item">
//                         <span className="spec-label">Model</span>
//                         <span className="spec-value">{equipment.model}</span>
//                       </div>
//                       {equipment.capacity_lps > 0 && (
//                         <div className="spec-item">
//                           <span className="spec-label">Capacity</span>
//                           <span className="spec-value">{equipment.capacity_lps} LPS</span>
//                         </div>
//                       )}
//                       {equipment.head_m > 0 && (
//                         <div className="spec-item">
//                           <span className="spec-label">Head</span>
//                           <span className="spec-value">{equipment.head_m} m</span>
//                         </div>
//                       )}
//                       <div className="spec-item">
//                         <span className="spec-label">Power</span>
//                         <span className="spec-value">{equipment.power_kw} kW</span>
//                       </div>
//                       <div className="spec-item">
//                         <span className="spec-label">Voltage</span>
//                         <span className="spec-value">{equipment.voltage_v} V</span>
//                       </div>
//                       <div className="spec-item">
//                         <span className="spec-label">Year</span>
//                         <span className="spec-value">{equipment.commissioning_year}</span>
//                       </div>
//                       <div className="spec-item">
//                         <span className="spec-label">Location</span>
//                         <span className="spec-value">{equipment.location}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Operations Module */}
//         {activeModule === "operations" && (
//           <div className="module active">
//             <div className="module-header">
//               <div>
//                 <h2>Operation Data</h2>
//                 <p>Real-time monitoring and operational parameters</p>
//               </div>
//             </div>

//             <div className="operations-grid">
//               <div className="card pump-status-card">
//                 <div className="card__header">
//                   <h3>Pump Status</h3>
//                 </div>
//                 <div className="card__body">
//                   <div>
//                     {appData.operation_data.map((op) => (
//                       <div
//                         key={op.pump_id}
//                         className={`pump-status-item ${op.status.toLowerCase()}`}
//                       >
//                         <span className="pump-id">{op.pump_id}</span>
//                         <span className={`status ${op.status.toLowerCase()}`}>
//                           {op.status}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="card readings-card">
//                 <div className="card__header">
//                   <h3>Current Readings</h3>
//                   <button className="btn btn--sm btn--secondary">Add Reading</button>
//                 </div>
//                 <div className="card__body">
//                   <div className="operational-trends">
//                     {appData.operation_data.filter(op => op.status === "Running").map((op) => (
//                       <div key={op.pump_id} style={{ marginBottom: "var(--space-16)" }}>
//                         <h4 style={{ marginBottom: "var(--space-8)" }}>{op.pump_id}</h4>
//                         <div className="performance-metrics">
//                           <div className="performance-item">
//                             <span>Flow Rate</span>
//                             <span className="performance-value">{op.flow_rate_lps} LPS</span>
//                           </div>
//                           <div className="performance-item">
//                             <span>Current</span>
//                             <span className="performance-value">{op.current_a} A</span>
//                           </div>
//                           <div className="performance-item">
//                             <span>Temperature</span>
//                             <span className="performance-value">{op.temperature_c}°C</span>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Stock & Maintenance Module */}
//         {activeModule === "stock" && (
//           <div className="module active">
//             <div className="module-header">
//               <div>
//                 <h2>Stock & Maintenance</h2>
//                 <p>Spare parts inventory and maintenance records</p>
//               </div>
//               <button className="btn btn--primary">
//                 <i className="fas fa-plus"></i> Add Work Order
//               </button>
//             </div>

//             <div className="stock-tabs">
//               <button
//                 className={`tab-btn ${activeStockTab === "inventory" ? "active" : ""}`}
//                 onClick={() => setActiveStockTab("inventory")}
//               >
//                 Inventory
//               </button>
//               <button
//                 className={`tab-btn ${activeStockTab === "maintenance" ? "active" : ""}`}
//                 onClick={() => setActiveStockTab("maintenance")}
//               >
//                 Maintenance History
//               </button>
//               <button
//                 className={`tab-btn ${activeStockTab === "alerts" ? "active" : ""}`}
//                 onClick={() => setActiveStockTab("alerts")}
//               >
//                 Stock Alerts
//               </button>
//             </div>

//             {activeStockTab === "inventory" && (
//               <div className="tab-content active">
//                 <div className="search-section">
//                   <input type="text" placeholder="Search spare parts..." className="form-control" />
//                 </div>
//                 <div className="stock-table-container">
//                   <table className="stock-table">
//                     <thead>
//                       <tr>
//                         <th>Part ID</th>
//                         <th>Description</th>
//                         <th>Model</th>
//                         <th>Stock</th>
//                         <th>Min Stock</th>
//                         <th>Cost</th>
//                         <th>Status</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {appData.spare_parts.map((part: SparePart) => (
//                         <tr key={part.part_id}>
//                           <td>{part.part_id}</td>
//                           <td>{part.description}</td>
//                           <td>{part.pump_model}</td>
//                           <td className={part.status === "Low Stock" ? "low-stock" : ""}>
//                             {part.quantity}
//                           </td>
//                           <td>{part.min_stock}</td>
//                           <td>₹{part.unit_cost.toLocaleString()}</td>
//                           <td>
//                             <span className={`status ${part.status === "Low Stock" ? "status--error" : "status--success"}`}>
//                               {part.status}
//                             </span>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {activeStockTab === "maintenance" && (
//               <div className="tab-content active">
//                 <div className="maintenance-records">
//                   {appData.maintenance_records.map((record: MaintenanceRecord) => (
//                     <div key={record.record_id} className="maintenance-record">
//                       <div className="record-header">
//                         <span className="record-id">{record.record_id}</span>
//                         <span className="record-date">{record.date}</span>
//                       </div>
//                       <div className="record-details">
//                         <div className="record-detail-item">
//                           <span className="record-detail-label">Pump ID</span>
//                           <span className="record-detail-value">{record.pump_id}</span>
//                         </div>
//                         <div className="record-detail-item">
//                           <span className="record-detail-label">Type</span>
//                           <span className="record-detail-value">{record.type}</span>
//                         </div>
//                         <div className="record-detail-item">
//                           <span className="record-detail-label">Cost</span>
//                           <span className="record-detail-value">₹{record.cost.toLocaleString()}</span>
//                         </div>
//                         <div className="record-detail-item">
//                           <span className="record-detail-label">Status</span>
//                           <span className={`status ${record.status === "Completed" ? "status--success" : "status--info"}`}>
//                             {record.status}
//                           </span>
//                         </div>
//                       </div>
//                       <p style={{ marginTop: "var(--space-12)", color: "var(--color-text-secondary)" }}>
//                         {record.description}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {activeStockTab === "alerts" && (
//               <div className="tab-content active">
//                 <div className="alert-section">
//                   <h3>Stock Alerts</h3>
//                   <div>
//                     {appData.spare_parts.filter(part => part.status === "Low Stock").map((part) => (
//                       <div key={part.part_id} className="stock-alert">
//                         <i className="fas fa-exclamation-triangle"></i>
//                         <span>{part.description} ({part.part_id}) is low on stock. Current: {part.quantity}, Min: {part.min_stock}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Reports Module */}
//         {activeModule === "reports" && (
//           <div className="module active">
//             <div className="module-header">
//               <div>
//                 <h2>Reports</h2>
//                 <p>Analytics and detailed reports</p>
//               </div>
//             </div>

//             <div className="report-filters">
//               <div className="filter-group">
//                 <label>Date Range:</label>
//                 <input type="date" className="form-control" />
//                 <input type="date" className="form-control" />
//               </div>
//               <div className="filter-group">
//                 <label>Equipment:</label>
//                 <select className="form-control">
//                   <option value="">All Equipment</option>
//                   {appData.technical_data.map(eq => (
//                     <option key={eq.pump_id} value={eq.pump_id}>{eq.pump_id}</option>
//                   ))}
//                 </select>
//               </div>
//               <button className="btn btn--primary">Generate Report</button>
//             </div>

//             <div className="reports-grid">
//               <div className="report-card">
//                 <h3>Equipment Performance</h3>
//                 <div className="performance-metrics">
//                   <div className="performance-item">
//                     <span>Average Efficiency</span>
//                     <span className="performance-value">94.2%</span>
//                   </div>
//                   <div className="performance-item">
//                     <span>Total Operating Hours</span>
//                     <span className="performance-value">8,760 hrs</span>
//                   </div>
//                   <div className="performance-item">
//                     <span>Maintenance Frequency</span>
//                     <span className="performance-value">Monthly</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="export-section">
//               <h3>Export Data</h3>
//               <div className="export-buttons">
//                 <button className="btn btn--outline">
//                   <i className="fas fa-file-pdf"></i> Export PDF
//                 </button>
//                 <button className="btn btn--outline">
//                   <i className="fas fa-file-excel"></i> Export Excel
//                 </button>
//                 <button className="btn btn--outline">
//                   <i className="fas fa-file-csv"></i> Export CSV
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </main>

//       <footer className="footer">
//         <p>&copy; 2025 JALSAMPADA. All rights reserved.</p>
//       </footer>
//     </div>
//   );
// }
