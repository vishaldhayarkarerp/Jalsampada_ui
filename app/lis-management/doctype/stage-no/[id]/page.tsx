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
import { toast } from "sonner";

const API_BASE_URL = "http://103.219.1.138:4412//api/resource";

/* -------------------------------------------------
 1. Stage No Data type
 ------------------------------------------------- */
interface StageNoData {
  name: string;
  stage_no: string;
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
  const doctypeName = "Stage No"; // <-- CHANGED

  const [stage, setStage] = React.useState<StageNoData | null>(null); // <-- CHANGED
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
  3. FETCH Stage
  ------------------------------------------------- */
  React.useEffect(() => {
    const fetchStage = async () => { // <-- CHANGED
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

        setStage(resp.data.data); // <-- CHANGED
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

    fetchStage(); // <-- CHANGED
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  /* -------------------------------------------------
  4. Build tabs
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!stage) return []; // <-- CHANGED

    const fields = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        defaultValue:
          f.name in stage
            ? // @ts-ignore
            stage[f.name as keyof StageNoData]
            : f.defaultValue,
      }));

    return [
      {
        name: "Details",
        fields: fields([
          {
            name: "stage_no",
            label: "Stage No",
            type: "Data",
            required: true
          },
          {
            name: "lis_phase",
            label: "LIS Phase",
            type: "Link", // Assuming this links to the LIS doctype
            required: true,
            linkTarget: "LIS Phases", // Specify the target doctype
            description: "Links to Lift Irrigation Scheme"
          },
          {
            name: "lis_name",
            label: "Lift Irrigation Scheme",
            type: "Link", // Assuming this links to the LIS doctype
            required: true,
            // Add description if you want to specify the link target
            description: "Links to Lift Irrigation Scheme"
          }
        ]),
      },
    ];
  }, [stage]); // <-- CHANGED

  /* -------------------------------------------------
  5. SUBMIT
  ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>) => {
    setIsSaving(true);
    try {
      // The payload only needs the fields that are being saved
      const payload = {
        stage_no: data.stage_no,
        lis_name: data.lis_name,
        lis_phase: data.lis_phase
      };

      await axios.put(`${API_BASE_URL}/${doctypeName}/${docname}`, payload, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      toast.success("Changes saved successfully!");
      router.push(`/lis-management/doctype/stage-no/${docname}`);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save. Check console for details.");
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

  if (!stage) { // <-- CHANGED
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
      title={`Edit ${doctypeName}: ${stage.stage_no}`} // <-- CHANGED
      description={`Update details for record ID: ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save"}
      cancelLabel="Cancel"
    />
  );
}