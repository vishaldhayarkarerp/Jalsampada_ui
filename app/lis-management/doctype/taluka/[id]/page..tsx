"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Pencil, Loader2, Map, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

interface TalukaData {
  name: string;
  taluka: string;
  district: string;
  owner: string;
  modified: string;
}

export default function TalukaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docname = params.id as string;
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const [data, setData] = useState<TalukaData | null>(null);
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
        const resp = await axios.get(`${API_BASE_URL}/Taluka/${docname}`, {
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });
        setData(resp.data.data);
      } catch (err: any) {
        console.error("API Error:", err);
        setError("Failed to load taluka details.");
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
      {/* Header Navigation */}
      <div className="mb-6">
        <Link
          href="/lis-management/doctype/taluka"
          className="flex items-center text-sm text-muted-foreground hover:text-primary mb-3 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to List
        </Link>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {data.taluka}
              </h1>
              <p className="text-sm text-muted-foreground">ID: {data.name}</p>
            </div>
          </div>

          <button className="btn btn--outline flex items-center gap-2" disabled>
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card p-6 border border-border bg-card text-card-foreground shadow-sm rounded-xl">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-border">
          Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Taluka Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              Taluka Name
            </label>
            <div className="text-lg font-medium">{data.taluka}</div>
          </div>

          {/* District Link */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              District
            </label>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              {/* You could link this back to the District page if needed */}
              <Link 
                href={`/lis-management/doctype/district/${data.district}`}
                className="text-base text-blue-600 hover:underline"
              >
                {data.district}
              </Link>
            </div>
          </div>

          {/* Last Modified */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              Last Updated
            </label>
            <div className="text-base">{data.modified}</div>
          </div>
          
           {/* Created By */}
           <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              Created By
            </label>
            <div className="text-base">{data.owner}</div>
          </div>
        </div>
      </div>
    </div>
  );
}