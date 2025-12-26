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

// We need the root URL for images, not just the API resource URL
const FRAPPE_BASE_URL = "http://103.219.1.138:4412";
const API_BASE_URL = `${FRAPPE_BASE_URL}/api/resource`;

// ------------------------------------------------------------------
// 1. TYPES
// ------------------------------------------------------------------
interface AssetData {
  name: string;
  asset_name: string;
  location: string;
  status: string;
  asset_category?: string;
  purchase_date?: string;
  gross_purchase_amount?: number;

  // Custom fields
  custom_lis_name?: string;
  custom_stage_no?: string;
  custom_condition?: string;
  custom_equipement_make?: string;
  custom_equipement_model?: string;

  // Child Tables
  custom_asset_specifications?: Array<{
    specification_type: string;
    details: string;
  }>;

  // --- NEW: Drawing Attachments Child Table ---
  custom_drawing_attachment?: Array<{
    name_of_document?: string;
    attachment?: string; // e.g., "/files/my-drawing.pdf"
  }>;

  // Standard Frappe fields
  modified: string;
}

// Helper to check if a file URL is an image
const isImage = (url?: string) => {
  if (!url) return false;
  const extension = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
};

// ------------------------------------------------------------------
// 2. COMPONENT
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
  // 3. DATA FETCHING
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
        setError("Failed to load asset details. Check connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  // ------------------------------------------------------------------
  // 4. HANDLERS
  // ------------------------------------------------------------------
  const handleDownloadReport = () => toast.success("Report downloading...");

  const handleCreateWorkOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Work Order Created!");
    setShowWorkOrderModal(false);
  };

  const handleOpenFile = (url?: string) => {
    if (!url) return;
    // Construct full URL if it's a relative path from Frappe
    const fullUrl = url.startsWith("http") ? url : `${FRAPPE_BASE_URL}${url}`;
    window.open(fullUrl, "_blank");
  };

  // Define Tabs
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "drawings", label: "Drawings", icon: ImageIcon }, // --- NEW TAB ---
    { id: "readings", label: "Readings", icon: BarChart3 },
    { id: "maintenance", label: "Maintenance", icon: History },
    { id: "specs", label: "Specifications", icon: Settings },
  ];

  // ------------------------------------------------------------------
  // 5. RENDER
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-red-600 font-bold mb-4">{error || "Asset Not Found"}</h2>
        <Link href="/lis-management/doctype/asset">
          <button className="btn btn--primary">Go Back</button>
        </Link>
      </div>
    );
  }

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
            <p className="text-blue-100 text-lg mt-1">
              ID: {asset.name} | Location: {asset.location}
            </p>
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

        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- OVERVIEW TAB --- */}
          {activeTab === "overview" && (
            <>
              <div className="test-card">
                <h2 className="test-card-title">Asset Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="test-info-box">
                    <p>Category</p>
                    <span className="text-xl font-bold">{asset.asset_category || "—"}</span>
                  </div>
                  <div className="test-info-box">
                    <p>Condition</p>
                    <span className="text-xl font-bold text-blue-600">{asset.custom_condition || "N/A"}</span>
                  </div>
                  <div className="test-info-box">
                    <p>LIS Name</p>
                    <span className="text-xl font-bold text-green-600">{asset.custom_lis_name || "—"}</span>
                  </div>
                </div>
              </div>
              <div className="test-card">
                <h2 className="test-card-title">Recent Readings (Simulated)</h2>
                <p className="text-sm text-gray-500 mb-4">Live sensor data integration pending.</p>
                <div className="stock-table-container">
                  <div className="p-4 text-center text-gray-500 italic">
                    No sensor data connected to this asset ID.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* --- DRAWINGS TAB (NEW) --- */}
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
                    const fullUrl = file.attachment?.startsWith("http")
                      ? file.attachment
                      : `${FRAPPE_BASE_URL}${file.attachment}`;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenFile(file.attachment)}
                        className="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all bg-gray-50 dark:bg-gray-900"
                      >
                        {/* Preview Area */}
                        <div className="h-32 w-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 overflow-hidden relative">
                          {isImg ? (
                            <img
                              src={fullUrl}
                              alt={file.name_of_document || "Drawing"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <FileText size={48} className="text-gray-400" />
                          )}

                          {/* Hover Overlay Icon */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ExternalLink className="text-white drop-shadow-md" size={24} />
                          </div>
                        </div>

                        {/* Footer Area */}
                        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                          <p className="font-medium text-sm truncate text-gray-800 dark:text-gray-200">
                            {file.name_of_document || "Unnamed File"}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {file.attachment?.split('/').pop()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Empty State
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <ImageIcon size={48} className="mb-3 opacity-50" />
                  <p className="text-lg font-medium">No drawings attached</p>
                  <p className="text-sm mb-4">Upload CAD files, PDFs, or Images via the Edit page.</p>
                  <Link href={`/lis-management/doctype/asset/edit/${docname}`}>
                    <button className="btn btn--primary btn--sm">
                      Upload Now
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* --- SPECIFICATIONS TAB --- */}
          {activeTab === "specs" && (
            <div className="test-card">
              <h2 className="test-card-title">Machine Specifications</h2>
              {asset.custom_asset_specifications && asset.custom_asset_specifications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {asset.custom_asset_specifications.map((spec, idx) => (
                    <div key={idx} className="test-info-box !text-left">
                      <p>{spec.specification_type}</p>
                      <strong>{spec.details}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No specifications recorded.</p>
                  <Link href={`/lis-management/doctype/asset/edit/${docname}`} className="text-blue-600 text-sm hover:underline mt-2 block">
                    Add Specifications
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* --- PLACEHOLDER TABS --- */}
          {(activeTab === "readings" || activeTab === "maintenance") && (
            <div className="test-card">
              <h2 className="test-card-title">Data Unavailable</h2>
              <p className="text-gray-500">This module is not yet connected to the historical API.</p>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-1">
          <div className="test-card sticky top-20">
            <h3 className="test-card-title">Quick Info</h3>
            <div className="space-y-5">
              <div className="test-info-box !text-left">
                <p>Make</p>
                <strong>{asset.custom_equipement_make || "—"}</strong>
              </div>
              <div className="test-info-box !text-left">
                <p>Model</p>
                <strong>{asset.custom_equipement_model || "—"}</strong>
              </div>
              <div className="test-info-box !text-left">
                <p>Purchase Date</p>
                <strong>
                  {asset.purchase_date
                    ? new Date(asset.purchase_date).toLocaleDateString("en-GB").replaceAll("-", " ")
                    : "—"}
                </strong>
              </div>
              <div className="test-info-box !text-left">
                <p>Last Updated</p>
                <strong>
                  {new Date(asset.modified).toLocaleDateString("en-GB").replaceAll("-", " ")}
                </strong>
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
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Asset QR</h3>
              <button onClick={() => setShowQR(false)}><X size={24} /></button>
            </div>
            <div className="flex justify-center mb-6 bg-gray-50 p-8 rounded-xl border border-dashed">
              <QrCode size={128} className="text-gray-800" />
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
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold">
                Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}