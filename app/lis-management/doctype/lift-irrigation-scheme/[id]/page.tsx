"use client";

import * as React from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  DynamicForm,
  TabbedLayout,
  FormField,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://103.219.1.138:4429/api/resource";

/* -------------------------------------------------
 1. LIS Data type
 ------------------------------------------------- */
interface LisData {
  name: string;
  lis_name: string;
}

/* -------------------------------------------------
 2. Page component
 ------------------------------------------------- */
export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Lift Irrigation Scheme"; // <-- CHANGED

  const [scheme, setScheme] = React.useState<LisData | null>(null); // <-- CHANGED
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
  3. FETCH LIS
  ------------------------------------------------- */
  React.useEffect(() => {
    const fetchScheme = async () => { // <-- CHANGED
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret || !docname) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const resp = await axios.get(`${API_BASE_URL}/${doctypeName}/${docname}`, {
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });

        setScheme(resp.data.data); // <-- CHANGED
      } catch (err: any) {
        console.error("API Error:", err);
        setError(
          err.response?.status === 404
            ? `${doctypeName} not found`
            : err.response?.status === 403
              ? "Unauthorized"
              : `Failed to load ${doctypeName}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchScheme(); // <-- CHANGED
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  /* -------------------------------------------------
  4. Build tabs
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!scheme) return []; // <-- CHANGED

    const fields = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        defaultValue:
          f.name in scheme
            ? // @ts-ignore
            scheme[f.name as keyof LisData]
            : f.defaultValue,
      }));

    // Very simple tab layout
    return [
      {
        name: "Details",
        fields: fields([
          {
            name: "lis_name",
            label: "Lift Irrigation Scheme Name",
            type: "Data",
            required: true
          },
          { 
            name: "name", 
            label: "ID", 
            type: "Read Only",
            readOnlyValue: scheme.name
          },
        ]),
      },
    ];
  }, [scheme]); // <-- CHANGED

  /* -------------------------------------------------
  5. SUBMIT
  ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>) => {
    setIsSaving(true);
    try {
      // The payload only needs the fields that are being saved
      const payload = {
        lis_name: data.lis_name,
      };

      await axios.put(`${API_BASE_URL}/${doctypeName}/${docname}`, payload, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      alert("Changes saved!");
      router.push(`/lis-management/doctype/${doctypeName}`);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* -------------------------------------------------
  6. UI STATES
  ------------------------------------------------- */
  if (loading) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading {doctypeName} details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        <p style={{ color: "var(--color-error)" }}>{error}</p>
        <button className="btn btn--primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!scheme) { // <-- CHANGED
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        <p>{doctypeName} not found.</p>
      </div>
    );
  }

  /* -------------------------------------------------
  7. RENDER FORM
  ------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`Edit ${doctypeName}: ${scheme.lis_name}`} // <-- CHANGED
      description={`Update details for record ID: ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save Changes"}
      cancelLabel="Cancel"
    />
  );
}