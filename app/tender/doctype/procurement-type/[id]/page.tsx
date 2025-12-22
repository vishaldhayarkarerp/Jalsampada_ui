"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://103.219.1.138:4412//api/resource";

interface ProcurementType {
  name: string;
  [key: string]: any;
}

export default function ProcurementTypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  
  const [record, setRecord] = React.useState<ProcurementType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchRecord = async () => {
      if (!isInitialized) return;
      if (!isAuthenticated || !apiKey || !apiSecret) {
        setLoading(false);
        return;
      }

      const recordId = params.id as string;
      if (!recordId) return;

      try {
        setLoading(true);
        setError(null);

        const resp = await axios.get(`${API_BASE_URL}/Procurement Type/${recordId}`, {
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
          withCredentials: true,
        });

        setRecord(resp.data?.data || null);
      } catch (err: any) {
        console.error("API error:", err);
        setError(
          err.response?.status === 403
            ? "Unauthorized – check API key/secret"
            : "Failed to fetch record details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [params.id, apiKey, apiSecret, isAuthenticated, isInitialized]);

  if (loading) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading record details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-error)" }}>{error}</p>
        <button 
          className="btn btn--outline" 
          onClick={() => router.back()}
          style={{ marginTop: "1rem" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Record not found.</p>
        <button 
          className="btn btn--outline" 
          onClick={() => router.back()}
          style={{ marginTop: "1rem" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Procurement Type - {record.name}</h2>
          <p>View and manage record details</p>
        </div>
        <button 
          className="btn btn--outline" 
          onClick={() => router.back()}
        >
          <i className="fas fa-arrow-left"></i> Back
        </button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <div className="form-section">
          <h3>Record Details</h3>
          <div className="form-layout">
            <div className="form-page">
              <div className="form-section">
                <div className="row">
                  <div className="col-md-6">
                    <div className="fr-control">
                      <label className="control-label">ID</label>
                      <div className="control-input">
                        <input 
                          type="text" 
                          value={record.name} 
                          readOnly 
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
