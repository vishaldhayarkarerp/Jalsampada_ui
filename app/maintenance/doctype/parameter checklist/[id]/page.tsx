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

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

interface ParameterData {
  name: string;
  parameter_data?: string;
  monitoring_type?: "Daily" | "Weekly" | "Monthly";
  asset_category?: string;
  docstatus: 0 | 1 | 2;
  modified: string;
}

export default function ParameterDataDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Parameter Data";

  const [record, setRecord] = React.useState<ParameterData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // FETCH DOC
  React.useEffect(() => {
    const fetchDoc = async () => {
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret || !docname) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const resp = await axios.get(
          `${API_BASE_URL}/${encodeURIComponent(doctypeName)}/${encodeURIComponent(docname)}`,
          {
            headers: {
              Authorization: `token ${apiKey}:${apiSecret}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          }
        );

        setRecord(resp.data.data as ParameterData);
      } catch (err: any) {
        console.error("API Error:", err);
        setError(
          err.response?.status === 404
            ? "Record not found"
            : err.response?.status === 403
            ? "Unauthorized"
            : "Failed to load record"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  // BUILD TABS
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!record) return [];

    const fields = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        // @ts-ignore
        defaultValue: f.name in record ? record[f.name as keyof ParameterData] : f.defaultValue,
      }));

    return [
      {
        name: "Details",
        fields: fields([
          {
            name: "parameter_data",
            label: "Parameter Data",
            type: "Text",
          },
          {
            name: "monitoring_type",
            label: "Monitoring Type",
            type: "Select",
            options: "Daily\nWeekly"
          },
          {
            name: "asset_category",
            label: "Asset Category",
            type: "Link",
            linkTarget: "Asset Category",
          },
        ]),
      },
    ];
  }, [record]);

  // SUBMIT
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }

    if (!record) {
      toast.error("Record not loaded. Cannot save.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = JSON.parse(JSON.stringify(data));

      const allFields = formTabs.flatMap((tab) => tab.fields);
      const nonDataFields = new Set<string>();
      allFields.forEach((field) => {
        if (
          field.type === "Section Break" ||
          field.type === "Column Break" ||
          field.type === "Button" ||
          field.type === "Read Only"
        ) {
          nonDataFields.add(field.name);
        }
      });

      const finalPayload: Record<string, any> = {};
      for (const key in payload) {
        if (!nonDataFields.has(key)) {
          finalPayload[key] = payload[key];
        }
      }

      finalPayload.modified = record.modified;
      finalPayload.docstatus = record.docstatus;

      console.log("Sending this PAYLOAD to Frappe:", finalPayload);

      const resp = await axios.put(
        `${API_BASE_URL}/${encodeURIComponent(doctypeName)}/${encodeURIComponent(docname)}`,
        finalPayload,
        {
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      toast.success("Changes saved!");

      if (resp.data && resp.data.data) {
        setRecord(resp.data.data as ParameterData);
      }

      router.push(`/maintenance/doctype/parameter-data/${docname}`);
    } catch (err: any) {
      console.error("Save error:", err);
      console.log("Full server error:", err.response?.data);
      toast.error("Failed to save", {
        description:
          err.message || "Check the browser console (F12) for the full server error.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  // UI STATES
  if (loading) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading parameter data...</p>
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

  if (!record) {
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        <p>Record not found.</p>
      </div>
    );
  }

  // RENDER FORM
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`${doctypeName}: ${record.name}`}
      description={`Update details for record ID: ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save"}
      cancelLabel="Cancel"
    />
  );
}
