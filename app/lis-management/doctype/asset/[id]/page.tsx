"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { 
  ArrowLeft, Download, QrCode, Clipboard, 
  BarChart3, History, Settings, X, Pencil, Loader2, 
  Image as ImageIcon, FileText, ExternalLink, UploadCloud
} from "lucide-react";

// Import Auth Context
import { useAuth } from "@/context/AuthContext";

const FRAPPE_BASE_URL = "http://192.168.1.30:4429"; 
const API_BASE_URL = `${FRAPPE_BASE_URL}/api/resource`;

// ------------------------------------------------------------------
// 1. STATIC SAMPLE DATA (Restored for Demo Tabs)
// ------------------------------------------------------------------
const SAMPLE_LATEST_READING = {
  temperature: 42.5,
  vibration_level: 0.8,
  oil_pressure: 58,
};

const SAMPLE_READINGS = [
  { id: 1, timestamp: "2025-11-17T10:30:00Z", temperature: 42.5, vibration_level: 0.8, oil_pressure: 58, is_anomaly: false },
  { id: 2, timestamp: "2025-11-17T09:15:00Z", temperature: 43.1, vibration_level: 1.2, oil_pressure: 57, is_anomaly: true },
  { id: 3, timestamp: "2025-11-17T08:00:00Z", temperature: 41.9, vibration_level: 0.7, oil_pressure: 59, is_anomaly: false },
  { id: 4, timestamp: "2025-11-16T22:30:00Z", temperature: 40.8, vibration_level: 0.6, oil_pressure: 60, is_anomaly: false },
  { id: 5, timestamp: "2025-11-16T18:00:00Z", temperature: 44.2, vibration_level: 1.5, oil_pressure: 55, is_anomaly: true },
];

const MAINTENANCE_HISTORY = [
  { date: "2025-06-15", type: "Preventive", status: "Completed", cost: "₹8,500" },
  { date: "2025-03-20", type: "Emergency", status: "Completed", cost: "₹32,000" },
  { date: "2024-12-10", type: "Preventive", status: "Completed", cost: "₹8,500" },
];

const SAMPLE_SPECIFICATIONS = [
  { label: "Machine Type", value: "CNC Lathe" },
  { label: "Model", value: "PRO-500X" },
  { label: "Manufacturer", value: "Haas Automation" },
  { label: "Installation Date", value: "15/08/2023" },
  { label: "Health Status", value: "Healthy" },
];

// ------------------------------------------------------------------
// 2. REAL DATA TYPES
// ------------------------------------------------------------------
interface AssetData {
  name: string;
  asset_name: string;
  location: string;
  status: string;
  
  // Child table for Drawings
  custom_drawing_attachment?: Array<{
    name_of_document?: string;
    attachment?: string;
  }>;
  
  modified: string;
}

// Helper to check if a file URL is an image
const isImage = (url?: string) => {
  if (!url) return false;
  const extension = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
};

// ------------------------------------------------------------------
// 3. COMPONENT
// ------------------------------------------------------------------
export default function AssetDetailPage() {
  const params = useParams();
  const docname = params.id as string;
  
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  
  // State
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState("overview");
  const [showQR, setShowQR] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);

  // ------------------------------------------------------------------
  // 4. DATA FETCHING
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchAsset = async () => {
      if (!isInitialized) return;
      if (!isAuthenticated || !apiKey || !apiSecret) {
        setLoading(false); 
        return;
      }

      try {
        setLoading(true);
        const resp = await axios.get(`${API_BASE_URL}/Asset/${docname}`, {
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });
        setAsset(resp.data.data);
      } catch (err: any) {
        console.error("API Error:", err);
        setError("Failed to load asset details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  // ------------------------------------------------------------------
  // 5. HANDLERS
  // ------------------------------------------------------------------
  const handleDownloadReport = () => toast.success("Report downloaded!");
  const handleCreateWorkOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Work Order Created!");
    setShowWorkOrderModal(false);
  };

  const handleOpenFile = (url?: string) => {
    if (!url) return;
    const fullUrl = url.startsWith("http") ? url : `${FRAPPE_BASE_URL}${url}`;
    window.open(fullUrl, "_blank");
  };

  // Define Tabs
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "drawings", label: "Drawings", icon: ImageIcon },
    { id: "readings", label: "Readings", icon: BarChart3 }, 
    { id: "maintenance", label: "Maintenance", icon: History },
    { id: "specs", label: "Specifications", icon: Settings },
  ];

  // ------------------------------------------------------------------
  // 6. RENDER
  // ------------------------------------------------------------------
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;
  if (error || !asset) return <div className="p-6 text-center text-red-600 font-bold">{error || "Asset Not Found"}</div>;

  return (
    <div className="p-4 md:p-6 test-module-page">

      {/* Back Button */}
      <Link href="/lis-management/doctype/asset" className="back-link">
        <ArrowLeft size={20} /> Back to Asset List
      </Link>

      {/* Header Section */}
      <div className="test-module-header">
        <div className="flex flex-row items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{asset.asset_name}</h1>
            <p className="text-blue-100 text-lg mt-1">ID: {asset.name} | Location: {asset.location}</p>
          </div>
          <div className={`status-badge ${asset.status === 'Operational' ? 'status-badge-healthy' : 'bg-gray-500'}`}>
            {asset.status}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link href={`/lis-management/doctype/asset/edit/${docname}`}>
            <button className="btn-header-primary bg-green-600 hover:bg-green-700">
              <Pencil size={18} /> Edit Asset
            </button>
          </Link>
          <button onClick={() => setShowWorkOrderModal(true)} className="btn-header-secondary">
            <Clipboard size={18} /> Create Work Order
          </button>
          <button onClick={handleDownloadReport} className="btn-header-secondary">
            <Download size={18} /> Download Report
          </button>
          <button onClick={() => setShowQR(true)} className="btn-header-secondary">
            <QrCode size={18} /> QR Code
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
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

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- OVERVIEW TAB --- */}
          {activeTab === "overview" && (
            <>
              <div className="test-card">
                <h2 className="test-card-title">Current Status (Live Demo)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="test-info-box">
                    <p>Temperature</p>
                    <span className="text-4xl font-bold text-orange-600">{SAMPLE_LATEST_READING.temperature}°C</span>
                  </div>
                  <div className="test-info-box">
                    <p>Vibration Level</p>
                    <span className="text-4xl font-bold text-blue-600">{SAMPLE_LATEST_READING.vibration_level}</span>
                    <br /><span className="text-xs text-green-600">(Normal)</span>
                  </div>
                  <div className="test-info-box">
                    <p>Oil Pressure</p>
                    <span className="text-4xl font-bold text-green-600">{SAMPLE_LATEST_READING.oil_pressure} PSI</span>
                  </div>
                </div>
              </div>
              
              <div className="test-card">
                <h2 className="test-card-title">Recent Readings</h2>
                <div className="stock-table-container">
                   <table className="stock-table">
                    <thead>
                      <tr><th>Date & Time</th><th>Temp</th><th>Vibration</th><th>Pressure</th><th>Anomaly</th></tr>
                    </thead>
                    <tbody>
                      {SAMPLE_READINGS.slice(0,3).map(r => (
                        <tr key={r.id}>
                          <td>{new Date(r.timestamp).toLocaleString()}</td>
                          <td>{r.temperature}</td>
                          <td>{r.vibration_level}</td>
                          <td>{r.oil_pressure}</td>
                          <td>{r.is_anomaly ? <span className="text-red-600">Yes</span> : <span className="text-green-600">No</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                </div>
              </div>
            </>
          )}

          {/* --- DRAWINGS TAB (FIXED THEME) --- */}
          {activeTab === "drawings" && (
            <div className="test-card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="test-card-title">Attached Drawings & Files</h2>
                <Link href={`/lis-management/doctype/asset/edit/${docname}`}>
                  <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <UploadCloud size={14} /> Manage Files
                  </button>
                </Link>
              </div>

              {asset.custom_drawing_attachment && asset.custom_drawing_attachment.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {asset.custom_drawing_attachment.map((file, idx) => {
                    const isImg = isImage(file.attachment);
                    const fullUrl = file.attachment?.startsWith("http") ? file.attachment : `${FRAPPE_BASE_URL}${file.attachment}`;

                    return (
                      <div 
                        key={idx} 
                        onClick={() => handleOpenFile(file.attachment)}
                        // --- THE FIX IS HERE ---
                        // Light Mode: bg-white, border-gray-200
                        // Dark Mode: dark:bg-gray-800, dark:border-gray-700
                        className="group rounded-xl overflow-hidden cursor-pointer transition-all duration-200
                          border border-gray-200 bg-white hover:shadow-lg hover:border-blue-400
                          dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
                      >
                        {/* Preview Area */}
                        {/* Light: bg-gray-100 | Dark: dark:bg-gray-900 */}
                        <div className="h-32 w-full flex items-center justify-center relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                          {isImg ? (
                            <img src={fullUrl} alt={file.name_of_document} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                          ) : (
                            // Icon color changes based on theme
                            <FileText size={40} className="text-gray-400 dark:text-gray-500" />
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ExternalLink className="text-white drop-shadow-md" size={24} />
                          </div>
                        </div>
                        
                        {/* Footer Area */}
                        {/* Light: bg-white, text-gray-900 | Dark: dark:bg-gray-800, dark:text-gray-100 */}
                        <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <p className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                            {file.name_of_document || "Unnamed File"}
                          </p>
                          <p className="text-xs truncate mt-1 text-gray-500 dark:text-gray-400">
                            {file.attachment?.split('/').pop()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <ImageIcon size={48} className="mb-3 opacity-50" />
                  <p className="text-lg font-medium">No drawings attached</p>
                  <Link href={`/lis-management/doctype/asset/edit/${docname}`}>
                    <button className="btn btn--primary btn--sm mt-4">Upload Now</button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* --- READINGS TAB --- */}
          {activeTab === "readings" && (
            <div className="test-card">
              <h2 className="test-card-title">All Sensor Readings</h2>
              <div className="stock-table-container">
                <table className="stock-table">
                  <thead>
                    <tr><th>Date & Time</th><th>Temp</th><th>Vibration</th><th>Pressure</th><th>Anomaly</th></tr>
                  </thead>
                  <tbody>
                    {SAMPLE_READINGS.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.timestamp).toLocaleString()}</td>
                        <td>{r.temperature}</td>
                        <td>{r.vibration_level}</td>
                        <td>{r.oil_pressure}</td>
                        <td>{r.is_anomaly ? <span className="text-red-600">Yes</span> : <span className="text-green-600">No</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- MAINTENANCE TAB --- */}
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

          {/* --- SPECS TAB --- */}
          {activeTab === "specs" && (
            <div className="test-card">
              <h2 className="test-card-title">Machine Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SAMPLE_SPECIFICATIONS.map((spec, idx) => (
                  <div key={idx} className="test-info-box !text-left">
                    <p>{spec.label}</p>
                    <strong>{spec.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-1">
          <div className="test-card sticky top-20">
            <h3 className="test-card-title">Quick Info</h3>
            <div className="space-y-5">
              <div className="test-info-box !text-left">
                <p>Machine Type</p>
                <strong>CNC Lathe</strong>
              </div>
              <div className="test-info-box !text-left">
                <p>Operational Status</p>
                <strong className="text-green-600">{asset.status}</strong>
              </div>
              <div className="test-info-box !text-left">
                <p>Last Updated</p>
                <strong>{asset.modified.split(" ")[0]}</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Asset QR</h3>
              <button onClick={() => setShowQR(false)}><X size={24} /></button>
            </div>
            <div className="flex justify-center mb-6 bg-gray-50 p-8 rounded-xl border border-dashed">
               <QrCode size={128} />
            </div>
            <div className="text-center font-mono font-bold">{asset.name}</div>
          </div>
        </div>
      )}

      {showWorkOrderModal && (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-bold">Create Work Order</h3>
               <button onClick={() => setShowWorkOrderModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateWorkOrder} className="space-y-5">
               <div>
                 <label className="block text-sm font-semibold mb-2">Title</label>
                 <input required className="w-full px-4 py-3 border rounded-lg bg-transparent" placeholder="e.g. Pump Maintenance" />
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold">Create</button>
            </form>
          </div>
         </div>
      )}

    </div>
  );
}