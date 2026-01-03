"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import {
  Download, QrCode,
  BarChart3, History, Settings, X, Pencil, Loader2,
  FileText, ExternalLink, UploadCloud,
  Package, Wrench, MapPin
} from "lucide-react";
import { Image as ImageIcon } from "lucide-react";

// Import Auth Context
import { useAuth } from "@/context/AuthContext";

const FRAPPE_BASE_URL = "http://103.219.1.138:4412";
const API_BASE_URL = `${FRAPPE_BASE_URL}/api/resource`;

interface AssetData {
  name: string;
  asset_name: string;
  location: string;
  status: string;
  asset_category?: string;
  purchase_date?: string;
  gross_purchase_amount?: number;
  custom_lis_name?: string;
  custom_stage_no?: string;
  custom_condition?: string;
  custom_equipement_make?: string;
  custom_equipement_model?: string;
  custom_asset_specifications?: Array<{
    specification_type: string;
    details: string;
  }>;
  custom_drawing_attachment?: Array<{
    name_of_document?: string;
    attachment?: string;
  }>;
  modified: string;
}

const isImage = (url?: string) => {
  if (!url) return false;
  const extension = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
};

export default function AssetDetailPage() {
  const params = useParams();
  const docname = params.id as string;

  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const [asset, setAsset] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showQR, setShowQR] = useState(false);

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

  const handleDownloadReport = () => toast.success("Report downloading...");

  const handleOpenFile = (url?: string) => {
    if (!url) return;
    const fullUrl = url.startsWith("http") ? url : `${FRAPPE_BASE_URL}${url}`;
    window.open(fullUrl, "_blank");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "drawings", label: "Drawings", icon: ImageIcon },
    { id: "specs", label: "Specs", icon: Settings },
    { id: "readings", label: "Readings", icon: BarChart3 },
    { id: "maintenance", label: "Maintenance", icon: History },
  ];

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
    <div className="py-4 px-2 test-module-page">
      {/* Compact Header Section - Single Line */}
      <div className="test-module-header py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{asset.asset_name}</h1>
            <span className={`status-badge text-xs whitespace-nowrap ${asset.status === 'Draft' ? 'status-badge-draft' : 'bg-gray-500'}`}>
              {asset.status}
            </span>
            <span className="flex items-center gap-1 text-sm text-blue-100 whitespace-nowrap">
              <Package size={14} /> {asset.name}
            </span>
            <span className="flex items-center gap-1 text-sm text-blue-100 whitespace-nowrap">
              <MapPin size={14} /> {asset.location}
            </span>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/lis-management/doctype/asset/edit/${docname}`}>
              <button className="btn-header-primary-asset bg-green-600 hover:bg-green-700 text-sm">
                <Pencil size={16} /> Edit
              </button>
            </Link>
            <button onClick={handleDownloadReport} className="btn-header-secondary-asset text-sm">
              <Download size={16} /> Report
            </button>
            <button onClick={() => setShowQR(true)} className="btn-header-secondary-asset text-sm">
              <QrCode size={16} /> QR
            </button>
          </div>
        </div>
      </div>

      {/* Compact Info Bar - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <div className="test-info-box !py-2">
          <p className="text-sm">Category</p>
          <span className="text-base font-bold">{asset.asset_category || "—"}</span>
        </div>
        <div className="test-info-box !py-2">
          <p className="text-sm">Condition</p>
          <span className="text-base font-bold text-blue-600">{asset.custom_condition || "N/A"}</span>
        </div>
        <div className="test-info-box !py-2">
          <p className="text-sm">LIS Name</p>
          <span className="text-base font-bold text-green-600">{asset.custom_lis_name || "—"}</span>
        </div>
        <div className="test-info-box !py-2">
          <p className="text-sm">Make</p>
          <span className="text-base font-bold">{asset.custom_equipement_make || "—"}</span>
        </div>
        <div className="test-info-box !py-2">
          <p className="text-sm">Model</p>
          <span className="text-base font-bold">{asset.custom_equipement_model || "—"}</span>
        </div>
        <div className="test-info-box !py-2">
          <p className="text-sm">Purchase Date</p>
          <span className="text-base font-bold">
            {asset.purchase_date
              ? new Date(asset.purchase_date).toLocaleDateString("en-GB")
              : "—"}
          </span>
        </div>
      </div>

      {/* Compact Tab Navigation */}
      <div className="test-module-tab-bar mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`test-module-tab text-sm py-2 ${activeTab === tab.id ? "active" : ""}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Single Column Content */}
      <div className="space-y-4">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="test-card !p-4">
            <h2 className="test-card-title text-lg mb-3">Recent Readings</h2>
            <p className="text-sm text-gray-500 mb-3">Live sensor data integration pending.</p>
            <div className="p-4 text-center text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              No sensor data connected to this asset ID.
            </div>
          </div>
        )}

        {/* DRAWINGS TAB */}
        {activeTab === "drawings" && (
          <div className="test-card !p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="test-card-title text-lg">Attached Drawings & Files</h2>
              <Link href={`/lis-management/doctype/asset/edit/${docname}`}>
                <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <UploadCloud size={12} /> Manage
                </button>
              </Link>
            </div>

            {asset.custom_drawing_attachment && asset.custom_drawing_attachment.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
                      <div className="h-24 w-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 overflow-hidden relative">
                        {isImg ? (
                          <img
                            src={fullUrl}
                            alt={file.name_of_document || "Drawing"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <FileText size={32} className="text-gray-400" />
                        )}

                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ExternalLink className="text-white drop-shadow-md" size={20} />
                        </div>
                      </div>

                      <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <p className="font-medium text-xs truncate text-gray-800 dark:text-gray-200">
                          {file.name_of_document || "Unnamed"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <ImageIcon size={36} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">No drawings attached</p>
                <Link href={`/lis-management/doctype/asset/edit/${docname}`}>
                  <button className="btn btn--primary btn--sm mt-3 text-xs">
                    Upload Now
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* SPECIFICATIONS TAB */}
        {activeTab === "specs" && (
          <div className="test-card !p-4">
            <h2 className="test-card-title text-lg mb-3">Machine Specifications</h2>
            {asset.custom_asset_specifications && asset.custom_asset_specifications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {asset.custom_asset_specifications.map((spec, idx) => (
                  <div key={idx} className="test-info-box !text-left !py-2">
                    <p className="text-lg">{spec.specification_type}</p>
                    <strong className="text-xl font-bold">{spec.details}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p className="text-sm">No specifications recorded.</p>
                <Link href={`/lis-management/doctype/asset/edit/${docname}`} className="text-blue-600 text-xs hover:underline mt-2 block">
                  Add Specifications
                </Link>
              </div>
            )}
          </div>
        )}

        {/* PLACEHOLDER TABS */}
        {(activeTab === "readings" || activeTab === "maintenance") && (
          <div className="test-card !p-4">
            <h2 className="test-card-title text-lg mb-2">Data Unavailable</h2>
            <p className="text-sm text-gray-500">This module is not yet connected to the historical API.</p>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Asset QR</h3>
              <button onClick={() => setShowQR(false)}><X size={20} /></button>
            </div>
            <div className="flex justify-center mb-4 bg-gray-50 p-6 rounded-xl border border-dashed">
              <QrCode size={100} className="text-gray-800" />
            </div>
            <div className="text-center font-mono font-bold text-sm">{asset.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}