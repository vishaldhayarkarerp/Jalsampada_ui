"use client";

import { useState } from "react";
import { ArrowLeft, Download, QrCode, Clipboard, BarChart3, History, Settings, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// ------------------------------------------------------------------
// 1. SAMPLE DATA (Same as before)
// ------------------------------------------------------------------
const SAMPLE_MACHINE = {
  id: "123",
  machine_name: "CNC Lathe Pro-500 (Test Data)",
  machine_id: "MACH-2025-001",
  location: "Shop Floor A - Zone 3",
  health_status: "Healthy",
  machine_type: "CNC Lathe",
  model_number: "PRO-500X",
  manufacturer: "Haas Automation",
  installation_date: "2023-08-15",
  status: "Operational",
  next_maintenance_date: "2025-12-01",
  days_until_maintenance: 14,
  last_maintenance_date: "2025-06-15",
  latest_reading: {
    temperature: 42.5,
    vibration_level: 0.8,
    oil_pressure: 58,
  },
};
const SAMPLE_READINGS = [
  { id: 1, timestamp: "2025-11-17T10:30:00Z", temperature: 42.5, vibration_level: 0.8, oil_pressure: 58, is_anomaly: false },
  { id: 2, timestamp: "2025-11-17T09:15:00Z", temperature: 43.1, vibration_level: 1.2, oil_pressure: 57, is_anomaly: true },
  { id: 3, timestamp: "2025-11-17T08:00:00Z", temperature: 41.9, vibration_level: 0.7, oil_pressure: 59, is_anomaly: false },
  { id: 4, timestamp: "2025-11-16T22:30:00Z", temperature: 40.8, vibration_level: 0.6, oil_pressure: 60, is_anomaly: false },
  { id: 5, timestamp: "2025-11-16T18:00:00Z", temperature: 44.2, vibration_level: 1.5, oil_pressure: 55, is_anomaly: true },
  { id: 6, timestamp: "2025-11-16T14:20:00Z", temperature: 42.0, vibration_level: 0.9, oil_pressure: 58, is_anomaly: false },
  { id: 7, timestamp: "2025-11-16T10:00:00Z", temperature: 41.5, vibration_level: 0.8, oil_pressure: 59, is_anomaly: false },
  { id: 8, timestamp: "2025-11-15T23:45:00Z", temperature: 43.8, vibration_level: 1.1, oil_pressure: 56, is_anomaly: false },
  { id: 9, timestamp: "2025-11-15T19:30:00Z", temperature: 42.7, vibration_level: 0.9, oil_pressure: 57, is_anomaly: false },
  { id: 10, timestamp: "2025-11-15T15:00:00Z", temperature: 41.2, vibration_level: 0.7, oil_pressure: 60, is_anomaly: false },
];
const MAINTENANCE_HISTORY = [
  { date: "2025-06-15", type: "Preventive", status: "Completed", cost: "₹8,500" },
  { date: "2025-03-20", type: "Emergency (Bearing Replacement)", status: "Completed", cost: "₹32,000" },
  { date: "2024-12-10", type: "Preventive", status: "Completed", cost: "₹8,500" },
  { date: "2024-09-05", type: "Calibration", status: "Completed", cost: "₹5,200" },
];
const SPECIFICATIONS = [
  { label: "Machine Type", value: SAMPLE_MACHINE.machine_type },
  { label: "Model", value: SAMPLE_MACHINE.model_number },
  { label: "Manufacturer", value: SAMPLE_MACHINE.manufacturer },
  { label: "Installation Date", value: new Date(SAMPLE_MACHINE.installation_date).toLocaleDateString("en-IN") },
  { label: "Location", value: SAMPLE_MACHINE.location },
  { label: "Current Status", value: SAMPLE_MACHINE.status },
  { label: "Health Status", value: SAMPLE_MACHINE.health_status },
  { label: "Next Maintenance", value: SAMPLE_MACHINE.next_maintenance_date ? new Date(SAMPLE_MACHINE.next_maintenance_date).toLocaleDateString("en-IN") : "Not scheduled" },
];

// ------------------------------------------------------------------
// 2. PAGE COMPONENT (Using Tailwind for layout, CSS classes for theme)
// ------------------------------------------------------------------
export default function TestPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showQR, setShowQR] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);

  // Static handlers
  const handleDownloadReport = () => toast.success("Report downloaded!");
  const handleShowQR = () => setShowQR(true);
  const handleCreateWorkOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Work Order Created!");
    setShowWorkOrderModal(false);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "readings", label: `Readings (${SAMPLE_READINGS.length})`, icon: BarChart3 },
    { id: "maintenance", label: "Maintenance History", icon: History },
    { id: "specs", label: "Specifications", icon: Settings },
  ];

  const latestReading = SAMPLE_MACHINE.latest_reading;

  return (
    // Page container
    <div className="p-4 md:p-6 test-module-page">

      {/* Back Button */}
      <Link href="/" className="back-link">
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>

      {/* Header Section (Blue Gradient) */}
      <div className="test-module-header">
        <div className="flex flex-row items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{SAMPLE_MACHINE.machine_name}</h1>
            <p className="text-blue-100 text-lg mt-1">{SAMPLE_MACHINE.machine_id}</p>
            <p className="text-blue-100 text-sm mt-1">{SAMPLE_MACHINE.location}</p>
          </div>
          <div className="status-badge-healthy">
            {SAMPLE_MACHINE.health_status}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowWorkOrderModal(true)} className="btn-header-primary">
            <Clipboard size={18} /> Create Work Order
          </button>
          <button onClick={handleDownloadReport} className="btn-header-secondary">
            <Download size={18} /> Download Report
          </button>
          <button onClick={handleShowQR} className="btn-header-secondary">
            <QrCode size={18} /> Show QR Code
          </button>
        </div>
      </div>

      {/* --- TABS (IndustriSense Style) --- */}
      {/* This section now uses a dedicated CSS class */}
      <div className="test-module-tab-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`test-module-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      {/* --- END OF TABS --- */}


      {/* Tab Content Area (2-column grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* === Left Column === */}
        <div className="lg:col-span-2 space-y-6">

          {activeTab === "overview" && (
            <>
              {/* Current Status Card */}
              <div className="test-card">
                <h2 className="test-card-title">Current Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="test-info-box">
                    <p>Temperature</p>
                    <span className="text-4xl font-bold text-orange-600">{latestReading.temperature}°C</span>
                  </div>
                  <div className="test-info-box">
                    <p>Vibration Level</p>
                    <span className="text-4xl font-bold text-blue-600">{latestReading.vibration_level}</span><br>
                    </br>
                    <span className="text-xs text-green-600">(Normal)</span>
                  </div>
                  <div className="test-info-box">
                    <p>Oil Pressure</p>
                    <span className="text-4xl font-bold text-green-600">{latestReading.oil_pressure} PSI</span>
                  </div>
                </div>
              </div>

              {/* Recent Readings (Uses your stock-table) */}
              <div className="test-card">
                <h2 className="test-card-title">Recent Readings</h2>
                <div className="stock-table-container">
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Temp (°C)</th>
                        <th>Vibration</th>
                        <th>Pressure</th>
                        <th>Anomaly</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_READINGS.slice(0, 6).map((reading) => (
                        <tr key={reading.id}>
                          <td>{new Date(reading.timestamp).toLocaleString()}</td>
                          <td>{reading.temperature}</td>
                          <td>{reading.vibration_level}</td>
                          <td>{reading.oil_pressure}</td>
                          <td>
                            {reading.is_anomaly ? (
                              <span className="anomaly-yes">Yes</span>
                            ) : (
                              <span className="anomaly-no">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* === READINGS TAB === */}
          {activeTab === "readings" && (
            <div className="test-card">
              <h2 className="test-card-title">All Sensor Readings</h2>
              <div className="stock-table-container">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Temp (°C)</th>
                      <th>Vibration</th>
                      <th>Pressure</th>
                      <th>Anomaly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_READINGS.map((reading) => (
                      <tr key={reading.id}>
                        <td>{new Date(reading.timestamp).toLocaleString()}</td>
                        <td>{reading.temperature}</td>
                        <td>{reading.vibration_level}</td>
                        <td>{reading.oil_pressure}</td>
                        <td>
                          {reading.is_anomaly ? (
                            <span className="anomaly-yes">Yes</span>
                          ) : (
                            <span className="anomaly-no">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* === MAINTENANCE TAB === */}
          {activeTab === "maintenance" && (
            <div className="test-card">
              <h2 className="test-card-title">Maintenance History</h2>
              <div className="space-y-4">
                {MAINTENANCE_HISTORY.map((record, idx) => (
                  <div key={idx} className="test-info-box-row">
                    <div>
                      <p className="font-semibold text-lg">{record.type}</p>
                      <p className="text-md">{new Date(record.date).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{record.status}</p>
                      <p className="text-md">{record.cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* === SPECIFICATIONS TAB === */}
          {activeTab === "specs" && (
            <div className="test-card">
              <h2 className="test-card-title">Machine Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SPECIFICATIONS.map((spec, idx) => (
                  <div key={idx} className="test-info-box !text-left">
                    <p>{spec.label}</p>
                    <strong>{spec.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* === Right Column (Sidebar) === */}
        <div className="lg:col-span-1">
          <div className="test-card sticky top-20">
            <h3 className="test-card-title">Quick Info</h3>
            <div className="space-y-5">
              <div className="test-info-box !text-left">
                <p>Machine Type</p>
                <strong>{SAMPLE_MACHINE.machine_type}</strong>
              </div>
              <div className="test-info-box !text-left">
                <p>Operational Status</p>
                <strong className="text-green-600">{SAMPLE_MACHINE.status}</strong>
              </div>
              <div className="test-info-box !text-left">
                <p>Next Maintenance</p>
                <strong>{new Date(SAMPLE_MACHINE.next_maintenance_date).toLocaleDateString("en-IN")}</strong>
                <span className="text-sm text-orange-600 font-medium mt-1">in {SAMPLE_MACHINE.days_until_maintenance} days</span>
              </div>
              <div className="test-info-box !text-left">
                <p>Last Maintenance</p>
                <strong>{new Date(SAMPLE_MACHINE.last_maintenance_date).toLocaleDateString("en-IN")}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ... Modals (No changes needed) ... */}
      {/* (Copy/Paste the modal JSX from your original file here) */}
      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Machine QR Code</h3>
              <button onClick={() => setShowQR(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <div className="flex justify-center mb-6 bg-gray-50 dark:bg-gray-900 p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
              <div className="w-64 h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              </div>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400">Scan to view machine details instantly</p>
          </div>
        </div>
      )}

      {/* Work Order Modal */}
      {showWorkOrderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Work Order</h3>
              <button onClick={() => setShowWorkOrderModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateWorkOrder} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Title</label>
                <input name="title" required placeholder="e.g., Replace spindle bearing" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Description</label>
                <textarea name="description" required rows={4} placeholder="Describe the issue or task..." className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Priority</label>
                  <select name="priority" required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Scheduled Date</label>
                  <input name="scheduled_date" type="date" required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-md">
                Create Work Order
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}