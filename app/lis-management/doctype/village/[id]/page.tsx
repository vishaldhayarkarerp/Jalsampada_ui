"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Pencil, Loader2, Home, MapPin, Droplets } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

// Interface matching your child table
interface LISDetail {
  name: string;
  lis_name: string;
  no_of_beneficiaries: number;
  lis_status: string;
  contemplated_ayacut_acres: number;
  commissioned__new: string;
  source_of_water: string;
}

interface VillageData {
  name: string;
  village: string;
  taluka: string;
  district: string;
  lis_wise_village_details?: LISDetail[]; // Child Table Array
  modified: string;
}

export default function VillageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docname = params.id as string;
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const [data, setData] = useState<VillageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isInitialized) return;
      if (!isAuthenticated || !apiKey || !apiSecret) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const resp = await axios.get(`${API_BASE_URL}/Village/${docname}`, {
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });
        setData(resp.data.data);
      } catch (err: any) {
        console.error("API Error:", err);
        setError("Failed to load village details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || "Document not found"}</p>
        <button onClick={() => router.back()} className="btn btn--outline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="module active p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/lis-management/doctype/village"
          className="flex items-center text-sm text-muted-foreground hover:text-primary mb-3 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to List
        </Link>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {data.village}
              </h1>
              <p className="text-sm text-muted-foreground">ID: {data.name}</p>
            </div>
          </div>

          <button className="btn btn--outline flex items-center gap-2" disabled>
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="card p-6 border border-border bg-card text-card-foreground shadow-sm rounded-xl mb-6">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-border">
          Geography
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              Taluka
            </label>
            <div className="text-lg font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              {data.taluka}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              District
            </label>
            <div className="text-lg font-medium">{data.district}</div>
          </div>
        </div>
      </div>

      {/* Child Table Data */}
      <div className="card p-6 border border-border bg-card text-card-foreground shadow-sm rounded-xl">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
          <Droplets className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">LIS Wise Details</h3>
        </div>

        {data.lis_wise_village_details && data.lis_wise_village_details.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 text-left border-b border-border">
                  <th className="p-3 font-medium text-muted-foreground">LIS Name</th>
                  <th className="p-3 font-medium text-muted-foreground">Beneficiaries</th>
                  <th className="p-3 font-medium text-muted-foreground">Status</th>
                  <th className="p-3 font-medium text-muted-foreground">Ayacut (Acres)</th>
                  <th className="p-3 font-medium text-muted-foreground">Type</th>
                  <th className="p-3 font-medium text-muted-foreground">Water Source</th>
                </tr>
              </thead>
              <tbody>
                {data.lis_wise_village_details.map((row, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="p-3 font-medium">{row.lis_name || "—"}</td>
                    <td className="p-3">{row.no_of_beneficiaries}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs border ${
                        row.lis_status === 'Functional' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {row.lis_status || "—"}
                      </span>
                    </td>
                    <td className="p-3">{row.contemplated_ayacut_acres}</td>
                    <td className="p-3">{row.commissioned__new || "—"}</td>
                    <td className="p-3">{row.source_of_water || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground italic bg-muted/20 rounded-lg">
            No LIS details linked to this village.
          </div>
        )}
      </div>
    </div>
  );
}