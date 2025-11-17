"use client";

import { useState } from "react";
import { useParams } from "next/navigation"; // ADDED: To get the dynamic ID
import { ArrowLeft, Download, QrCode, Clipboard, BarChart3, History, Settings, X, Pencil } from "lucide-react"; // ADDED: Pencil icon
import Link from "next/link";
import { toast } from "sonner";

// ------------------------------------------------------------------
// 1. SAMPLE DATA (Remains Static)
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
// 2. PAGE COMPONENT (Now the Asset Detail Page)
// ------------------------------------------------------------------
export default function AssetDetailPage() {
  const params = useParams();
  // Extract the asset ID (docname) from the URL parameter
  const docname = params.id as string;

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

      {/* Back Button - Updated to point to the Asset List Page */}
      <Link href="/lis-management/doctype/asset" className="back-link">
        <ArrowLeft size={20} /> Back to Asset List
      </Link>

      {/* Header Section (Blue Gradient) */}
      <div className="test-module-header">
        <div className="flex flex-row items-start justify-between gap-4 mb-6">
          <div>
            {/* Displaying the real document name from the URL in the subtitle */}
            <h1 className="text-3xl font-bold">{SAMPLE_MACHINE.machine_name}</h1>
            <p className="text-blue-100 text-lg mt-1">ID: {docname}</p>
            <p className="text-blue-100 text-sm mt-1">{SAMPLE_MACHINE.location}</p>
          </div>
          <div className="status-badge-healthy">
            {SAMPLE_MACHINE.health_status}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">

          {/* ------------------------------------------------------------------ */}
          {/* ADDED: EDIT BUTTON LINK */}
          {/* This links to your new Edit Form page: /lis-management/doctype/asset/edit/[id] */}
          {/* ------------------------------------------------------------------ */}
          <Link href={`/lis-management/doctype/asset/edit/${docname}`}>
            <button className="btn-header-primary bg-green-600 hover:bg-green-700">
              <Pencil size={18} /> Edit Asset
            </button>
          </Link>

          {/* Original Create Work Order button, moved to secondary style */}
          <button onClick={() => setShowWorkOrderModal(true)} className="btn-header-secondary">
            <Clipboard size={18} /> Create Work Order
          </button>

          {/* Other action buttons */}
          <button onClick={handleDownloadReport} className="btn-header-secondary">
            <Download size={18} /> Download Report
          </button>
          <button onClick={handleShowQR} className="btn-header-secondary">
            <QrCode size={18} /> Show QR Code
          </button>
        </div>
      </div>

      {/* --- TABS (No changes) --- */}
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


      {/* Tab Content Area (No changes) */}
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
                    <span className="text-4xl font-bold text-blue-600">{latestReading.vibration_level}</span><br></br>
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
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold  bg-red-100 text-red-800 ">Yes</span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold  bg-green-100 text-green-800 ">No</span>
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
                      <p className="font-medium text-lg">{record.type}</p>
                      <p className="text-md">{new Date(record.date).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{record.status}</p>
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


// "use client";

// import * as React from "react";
// import axios from "axios";
// import { useParams, useRouter } from "next/navigation";
// import {
//   DynamicForm,
//   TabbedLayout,
//   FormField,
// } from "@/components/DynamicFormComponent";
// import { useAuth } from "@/context/AuthContext";
// import { toast } from "sonner";

// const API_BASE_URL = "http://103.219.1.138:4429/api/resource";

// /* -------------------------------------------------
//    1. Asset type – mirrors the API exactly
//    ------------------------------------------------- */
// interface AssetData {
//   name: string;
//   naming_series?: string;
//   asset_name?: string;
//   asset_category?: string;
//   custom_asset_no?: string;
//   location?: string;
//   custom_lis_name?: string;
//   custom_stage_no?: string;
//   custom_serial_number?: string;
//   status?: string;
//   company?: string;
//   asset_owner?: string;
//   asset_owner_company?: string;
//   is_existing_asset?: 0 | 1;
//   is_composite_asset?: 0 | 1;
//   is_composite_component?: 0 | 1;
//   purchase_date?: string;
//   gross_purchase_amount?: number;
//   asset_quantity?: number;
//   calculate_depreciation?: 0 | 1;
//   opening_accumulated_depreciation?: number;
//   opening_number_of_booked_depreciations?: number;
//   is_fully_depreciated?: 0 | 1;
//   depreciation_method?: string;
//   value_after_depreciation?: number;
//   maintenance_required?: 0 | 1;
//   custom_previous_hours?: number;
//   custom_condition?: string;
//   docstatus: 0 | 1 | 2;
//   modified: string;
//   additional_asset_cost?: number;
//   total_asset_cost?: number;

//   // Insurance fields (may be missing)
//   policy_number?: string;
//   insurance_start_date?: string;
//   insurer?: string;
//   insurance_end_date?: string;
//   insured_value?: number;
//   comprehensive_insurance?: 0 | 1;

//   // Other-info fields (may be missing)
//   custodian?: string;
//   department?: string;
//   custom_equipement_make?: string;
//   custom_equipement_model?: string;
//   installation_date?: string;
//   custom_equipement_capacity?: string;
//   last_repair_date?: string;
//   custom_equipement_rating?: string;

//   // Child tables
//   finance_books?: Array<{
//     finance_book?: string;
//     depreciation_method?: string;
//     rate?: number;
//   }>;
//   custom_drawing_attachment?: Array<{
//     name_of_document?: string;
//     attachment?: string | File; // Can be a string (URL) or a new File
//   }>;
//   custom_asset_specifications?: Array<{
//     specification_type: string;
//     details: string;
//   }>;
// }

// /**
//  * --- NEW HELPER FUNCTION ---
//  * Uploads a single file to Frappe's 'upload_file' method
//  * and returns the server URL.
//  */
// async function uploadFile(
//   file: File,
//   apiKey: string,
//   apiSecret: string,
//   methodUrl: string
// ): Promise<string> {
//   const formData = new FormData();
//   formData.append("file", file, file.name);
//   formData.append("is_private", "0"); // 0 = Public, 1 = Private

//   try {
//     // Note: The base URL for this MUST be the root, not /api/resource
//     const resp = await axios.post(
//       `${methodUrl.replace("/api/resource", "")}/api/method/upload_file`,
//       formData,
//       {
//         headers: {
//           Authorization: `token ${apiKey}:${apiSecret}`,
//         },
//         withCredentials: true,
//       }
//     );

//     if (resp.data && resp.data.message) {
//       return resp.data.message.file_url; // This is the /files/filename.jpg URL
//     } else {
//       throw new Error("Invalid response from file upload");
//     }
//   } catch (err) {
//     console.error("File upload failed:", err);
//     throw err;
//   }
// }

// /* -------------------------------------------------
//    2. Page component
//    ------------------------------------------------- */
// export default function RecordDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

//   const docname = params.id as string;
//   const doctypeName = "Asset";

//   const [asset, setAsset] = React.useState<AssetData | null>(null);
//   const [loading, setLoading] = React.useState(true);
//   const [error, setError] = React.useState<string | null>(null);
//   const [isSaving, setIsSaving] = React.useState(false);

//   /* -------------------------------------------------
//      3. FETCH ASSET
//      ------------------------------------------------- */
//   React.useEffect(() => {
//     const fetchAsset = async () => {
//       if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret || !docname) {
//         setLoading(false);
//         return;
//       }

//       try {
//         setLoading(true);
//         setError(null);

//         const resp = await axios.get(`${API_BASE_URL}/${doctypeName}/${docname}`, {
//           headers: {
//             Authorization: `token ${apiKey}:${apiSecret}`,
//             "Content-Type": "application/json",
//           },
//           withCredentials: true,
//           maxBodyLength: Infinity,
//           maxContentLength: Infinity,
//         });

//         setAsset(resp.data.data);
//         // console.log("setAsset is called");
//       } catch (err: any) {
//         console.error("API Error:", err);
//         setError(
//           err.response?.status === 404
//             ? "Asset not found"
//             : err.response?.status === 403
//               ? "Unauthorized"
//               : "Failed to load asset"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAsset();
//   }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

//   /* -------------------------------------------------
//      4. Build tabs **once** when asset is ready
//      ------------------------------------------------- */
//   const formTabs: TabbedLayout[] = React.useMemo(() => {
//     if (!asset) return [];

//     const bool = (v?: 0 | 1) => v === 1;

//     const fields = (list: FormField[]): FormField[] =>
//       list.map((f) => ({
//         ...f,
//         defaultValue:
//           f.name in asset
//             ? // @ts-ignore – asset has the key
//             asset[f.name as keyof AssetData]
//             : f.defaultValue,
//       }));

//     return [
//       {
//         name: "Details",
//         fields: fields([
//           {
//             name: "naming_series",
//             label: "Series",
//             type: "Select",
//             options: [{ label: "ACC-ASS-.YYYY.-", value: "ACC-ASS-.YYYY.-" }],
//           },
//           { name: "status", label: "Status", type: "Read Only" },
//           { name: "asset_name", label: "Asset Name", type: "Text", required: true },
//           { name: "company", label: "Company", type: "Link", required: true, linkTarget: "Company" },
//           { name: "asset_category", label: "Asset Category", type: "Link", linkTarget: "Asset Category" },
//           {
//             name: "asset_owner",
//             label: "Asset Owner",
//             type: "Select",
//             options: [{ label: "Company", value: "Company" }],
//           },
//           { name: "custom_asset_no", label: "Asset No", type: "Data" },
//           { name: "asset_owner_company", label: "Asset Owner Company", type: "Link", linkTarget: "Company" },
//           { name: "location", label: "Location", type: "Link", required: true, linkTarget: "Location" },
//           { name: "is_existing_asset", label: "Is Existing Asset", type: "Check" },
//           { name: "custom_lis_name", label: "Lift Irrigation Scheme", type: "Link", linkTarget: "Lift Irrigation Scheme" },
//           { name: "is_composite_asset", label: "Is Composite Asset", type: "Check" },
//           { name: "custom_stage_no", label: "Stage No.", type: "Link", linkTarget: "Stage No" },
//           { name: "is_composite_component", label: "Is Composite Component", type: "Check" },
//           { name: "custom_serial_number", label: "Serial Number", type: "Data" },
//           { name: "section_purchase", label: "Purchase Details", type: "Section Break" },
//           { name: "purchase_date", label: "Purchase Date", type: "Date" },
//           { name: "gross_purchase_amount", label: "Net Purchase Amount", type: "Currency", required: true },
//           { name: "asset_quantity", label: "Asset Quantity", type: "Int", min: 1 },
//           { name: "additional_asset_cost", label: "Additional Asset Cost", type: "Currency" },
//           { name: "total_asset_cost", label: "Total Asset Cost", type: "Read Only" },
//         ]),
//       },

//       {
//         name: "Insurance",
//         fields: fields([
//           { name: "policy_number", label: "Policy number", type: "Data" },
//           { name: "insurance_start_date", label: "Insurance Start Date", type: "Date" },
//           { name: "insurer", label: "Insurer", type: "Data" },
//           { name: "insurance_end_date", label: "Insurance End Date", type: "Date" },
//           { name: "insured_value", label: "Insured value", type: "Currency" },
//           { name: "comprehensive_insurance", label: "Comprehensive Insurance", type: "Check" },
//         ]),
//       },

//       {
//         name: "Other Info",
//         fields: fields([
//           { name: "custodian", label: "Custodian", type: "Link", linkTarget: "Employee" },
//           { name: "department", label: "Department", type: "Link", linkTarget: "Department" },
//           { name: "custom_equipement_make", label: "Equipement Make", type: "Link", linkTarget: "Equipement Make" },
//           { name: "maintenance_required", label: "Maintenance Required", type: "Check" },
//           { name: "custom_equipement_model", label: "Equipement Model", type: "Link", linkTarget: "Equipement Model" },
//           { name: "installation_date", label: "Installation Date", type: "Date" },
//           { name: "custom_equipement_capacity", label: "Equipement Capacity", type: "Link", linkTarget: "Equipement Capacity" },
//           { name: "last_repair_date", label: "Last Repair Date", type: "Date" },
//           { name: "custom_equipement_rating", label: "Equipement Rating", type: "Link", linkTarget: "Rating" },
//           { name: "custom_previous_hours", label: "Previous Running Hours", type: "Float" },
//           {
//             name: "custom_condition",
//             label: "Condition",
//             type: "Select",
//             options: [{ label: "Working", value: "Working" }],
//           },
//           { name: "section_specifications", label: "Specification of Asset", type: "Section Break" },
//           {
//             name: "custom_asset_specifications",
//             label: "Asset Specifications",
//             type: "Table",
//             columns: [
//               { name: "specification_type", label: "Specification Type", type: "text" },
//               { name: "details", label: "Details", type: "text" },
//             ],
//           },
//         ]),
//       },

//       {
//         name: "Drawing Attachment",
//         fields: fields([
//           {
//             name: "custom_drawing_attachment",
//             label: "Drawing Attachment",
//             type: "Table",
//             columns: [
//               { name: "name_of_document", label: "Name of Document", type: "text" },
//               { name: "attachment", label: "Attachment", type: "Attach" },
//             ],
//           },
//         ]),
//       },

//       {
//         name: "Depreciation",
//         fields: fields([
//           { name: "calculate_depreciation", label: "Calculate Depreciation", type: "Check" },
//           { name: "opening_accumulated_depreciation", label: "Opening Accumulated Depreciation", type: "Currency" },
//           { name: "opening_number_of_booked_depreciations", label: "Opening Booked Depreciations", type: "Int" },
//           { name: "is_fully_depreciated", label: "Is Fully Depreciated", type: "Check" },
//           {
//             name: "depreciation_method",
//             label: "Depreciation Method",
//             type: "Select",
//             options: [
//               { label: "Straight Line", value: "Straight Line" },
//               { label: "Written Down Value", value: "Written Down Value" },
//             ],
//           },
//           { name: "value_after_depreciation", label: "Value After Depreciation", type: "Currency" },
//           {
//             name: "finance_books",
//             label: "Finance Books",
//             type: "Table",
//             columns: [
//               { name: "finance_book", label: "Finance Book", type: "text" },
//               { name: "depreciation_method", label: "Depreciation Method", type: "text" },
//               { name: "rate", label: "Rate (%)", type: "number" },
//             ],
//           },
//         ]),
//       },
//     ];
//   }, [asset]);

//   /* -------------------------------------------------
//      5. SUBMIT – Now with File Uploading (Corrected Logic)
//      ------------------------------------------------- */
//   const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {

//     if (!isDirty) {
//       toast.info("No changes to save.");
//       return;
//     }

//     setIsSaving(true);

//     try {
//       // 1. Create a deep copy of the form data. This will be our FINAL payload.
//       const payload: Record<string, any> = JSON.parse(JSON.stringify(data));

//       // 2. Handle File Uploads
//       if (payload.custom_drawing_attachment && apiKey && apiSecret) {
//         toast.info("Uploading attachments...");

//         // Use Promise.all to upload all new files in parallel
//         await Promise.all(
//           payload.custom_drawing_attachment.map(async (row: any, index: number) => {
//             // Get the original value from the 'data' object (which has the File)
//             const originalFile = data.custom_drawing_attachment[index]?.attachment;

//             if (originalFile instanceof File) {
//               // This is a new file that needs to be uploaded
//               try {
//                 // Pass the base URL, not the resource URL
//                 const fileUrl = await uploadFile(originalFile, apiKey, apiSecret, API_BASE_URL.replace("/api/resource", ""));

//                 // --- THIS IS THE CRITICAL CHANGE ---
//                 // We update the 'attachment' field *inside* our 'payload'
//                 row.attachment = fileUrl;
//                 // -----------------------------------

//               } catch (err) {
//                 // Throw an error to stop the save
//                 throw new Error(`Failed to upload file: ${originalFile.name}`);
//               }
//             }
//             // If it's not a File, it's already a string URL (or null),
//             // so we don't need an 'else' block. It's already correct in 'payload'.
//           })
//         );
//       }

//       // 3. Clean the payload (remove virtual fields)
//       const allFields = formTabs.flatMap(tab => tab.fields);
//       const nonDataFields = new Set<string>();
//       allFields.forEach(field => {
//         if (
//           field.type === "Section Break" ||
//           field.type === "Column Break" ||
//           field.type === "Button" ||
//           field.type === "Read Only"
//         ) {
//           nonDataFields.add(field.name);
//         }
//       });

//       // We create 'finalPayload' *from our modified payload*, not from 'data'
//       const finalPayload: Record<string, any> = {};
//       for (const key in payload) {
//         if (!nonDataFields.has(key)) {
//           finalPayload[key] = payload[key];
//         }
//       }

//       // 4. Add metadata
//       if (!asset) {
//         alert("Error: Asset data not loaded. Cannot save.");
//         setIsSaving(false);
//         return;
//       }
//       finalPayload.modified = asset.modified;
//       finalPayload.docstatus = asset.docstatus;

//       // 5. Conversions
//       const boolFields = [
//         "is_existing_asset", "is_composite_asset", "is_composite_component",
//         "calculate_depreciation", "is_fully_depreciated",
//         "maintenance_required", "comprehensive_insurance",
//       ];
//       boolFields.forEach((f) => {
//         if (f in finalPayload) finalPayload[f] = finalPayload[f] ? 1 : 0;
//       });

//       const numericFields = [
//         "gross_purchase_amount", "additional_asset_cost", "total_asset_cost",
//         "asset_quantity", "opening_accumulated_depreciation",
//         "opening_number_of_booked_depreciations", "value_after_depreciation",
//         "custom_previous_hours", "insured_value"
//       ];
//       numericFields.forEach((f) => {
//         finalPayload[f] = Number(finalPayload[f]) || 0;
//       });

//       // 6. Delete "Set Only Once" fields
//       delete finalPayload.naming_series;

//       console.log("Sending this PAYLOAD to Frappe:", finalPayload);

//       // 7. Send the final payload
//       const resp = await axios.put(`${API_BASE_URL}/${doctypeName}/${docname}`, finalPayload, {
//         headers: {
//           Authorization: `token ${apiKey}:${apiSecret}`,
//           "Content-Type": "application/json",
//         },
//         withCredentials: true,
//         maxBodyLength: Infinity,
//         maxContentLength: Infinity,
//       });

//       toast.success("Changes saved!");

//       if (resp.data && resp.data.data) {
//         setAsset(resp.data.data);
//       }

//       router.push(`/lis-management/doctype/asset/${docname}`);

//     } catch (err: any) {
//       console.error("Save error:", err);
//       console.log("Full server error:", err.response?.data);
//       toast.error("Failed to save", {
//         description: (err as Error).message || "Check the browser console (F12) for the full server error."
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleCancel = () => router.back();

//   /* -------------------------------------------------
//      6. UI STATES
//      ------------------------------------------------- */
//   if (loading) {
//     return (
//       <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
//         <p>Loading asset details...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="module active" style={{ padding: "2rem" }}>
//         <p style={{ color: "var(--color-error)" }}>{error}</p>
//         <button className="btn btn--primary" onClick={() => window.location.reload()}>
//           Retry
//         </button>
//       </div>
//     );
//   }

//   if (!asset) {
//     return (
//       <div className="module active" style={{ padding: "2rem" }}>
//         <p>Asset not found.</p>
//       </div>
//     );
//   }

//   /* -------------------------------------------------
//      7. RENDER FORM
//      ------------------------------------------------- */
//   return (
//     <DynamicForm
//       tabs={formTabs}
//       onSubmit={handleSubmit}
//       onCancel={handleCancel}
//       title={`Edit Asset: ${asset.name}`}
//       description={`Update details for record ID: ${docname}`}
//       submitLabel={isSaving ? "Saving..." : "Save Changes"}
//       cancelLabel="Cancel"
//     />
//   );
// }