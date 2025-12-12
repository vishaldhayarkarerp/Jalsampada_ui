"use client";

import * as React from "react";
// import axios from "axios"; // No longer need axios
import { useParams, useRouter } from "next/navigation";
import {
  DynamicForm,
  TabbedLayout,
  FormField,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// --- FIX #1: Define the API_BASE_URL ---
const API_BASE_URL = "http://103.219.1.138:4412//api/resource";

/* -------------------------------------------------
 1. LIS Data type
 ------------------------------------------------- */
interface LisData {
  name: string;
  lis_name: string;
  modified: string;
  docstatus: 0 | 1 | 2;
}

/* -------------------------------------------------
 2. Page component
 ------------------------------------------------- */
export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Lift Irrigation Scheme";

  const [scheme, setScheme] = React.useState<LisData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
  3. FETCH LIS (using fetch)
  ------------------------------------------------- */
  React.useEffect(() => {
    const fetchScheme = async () => {
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret || !docname) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // --- FIX #2: Use 'fetch' instead of 'axios' ---
        const headers: HeadersInit = {
          'Authorization': `token ${apiKey}:${apiSecret}`,
        };

        const resp = await fetch(`${API_BASE_URL}/${doctypeName}/${docname}`, {
          method: 'GET',
          headers: headers,
          credentials: 'include',
        });

        if (!resp.ok) {
          throw new Error(`Failed to load ${doctypeName}`);
        }
        
        const responseData = await resp.json();
        setScheme(responseData.data);
        // ------------------------------------------

      } catch (err: any) {
        console.error("API Error:", err);
        setError(
          err.status === 404
            ? `${doctypeName} not found`
            : err.status === 403
              ? "Unauthorized"
              : `Failed to load ${doctypeName}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  /* -------------------------------------------------
  4. Build tabs
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!scheme) return [];

    const fields = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        defaultValue:
          f.name in scheme
            ? // @ts-ignore
            scheme[f.name as keyof LisData]
            : f.defaultValue,
      }));

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
  }, [scheme]);

  /* -------------------------------------------------
  5. SUBMIT (UPDATE - using fetch)
  ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }
    
    if (!scheme) {
      toast.error("Cannot save, data not loaded.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        lis_name: data.lis_name,
        modified: scheme.modified,
        docstatus: scheme.docstatus,
      };

      // --- FIX #3: Use 'fetch' with 'PUT' and CSRF Token ---
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `token ${apiKey}:${apiSecret}`,
      };
      
      const storedCsrfToken = localStorage.getItem('csrfToken');
      if (storedCsrfToken) {
        headers['X-Frappe-CSRF-Token'] = storedCsrfToken;
      }
      
      const resp = await fetch(`${API_BASE_URL}/${doctypeName}/${docname}`, {
        method: 'PUT',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const responseData = await resp.json();

      if (!resp.ok) {
        console.log("Full server error:", responseData);
        throw new Error(responseData.exception || responseData._server_messages || "Failed to save");
      }
      // -------------------------------------------------

      toast.success("Changes saved!");
      
      if (responseData && responseData.data) {
        setScheme(responseData.data);
      }
      
      router.push(`/lis-management/doctype/lift-irrigation-scheme/${docname}`);

    } catch (err: any) {
      console.error("Save error:", err);
      console.log("Full server error:", err.message);
      toast.error("Failed to save", {
        description: (err as Error).message || "Check console for details."
      });
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

  if (!scheme) {
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
      title={`Edit ${doctypeName}: ${scheme.lis_name}`}
      description={`Update details for record ID: ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save Changes"}
      cancelLabel="Cancel"
    />
  );
}