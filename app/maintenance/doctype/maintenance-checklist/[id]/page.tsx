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
import { renameDocument } from "@/lib/services";

// API base URL
const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

// ----------------------
// 1. Types
// ----------------------
interface MaintenanceChecklist {
  name: string;
  lis_name?: string;
  stage?: string;
  monitoring_type?: "Daily" | "Weekly" | "Monthly";
  asset_category?: string;
  docstatus: 0 | 1 | 2;
  modified: string;
}

// ----------------------
// 2. Component
// ----------------------
export default function MaintenanceChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Maintenance Checklist";

  const [record, setRecord] = React.useState<MaintenanceChecklist | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // ----------------------
  // Fetch record
  // ----------------------
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
          }
        );

        setRecord(resp.data.data as MaintenanceChecklist);
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

    fetchDoc();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  // ----------------------
  // Build form tabs
  // ----------------------
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!record) return [];

    const fields = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        // @ts-ignore
        defaultValue: f.name in record ? record[f.name as keyof MaintenanceChecklist] : f.defaultValue,
      }));

    return [
      {
        name: "Details",
        fields: fields([
          {
            name: "lis_name",
            label: "LIS Name",
            type: "Text",
            required: true,
          },
          {
            name: "stage",
            label: "Stage",
            type: "Text",
            required: true,
          },
          {
            name: "monitoring_type",
            label: "Monitoring Type",
            type: "Select",
            options: "Daily\nWeekly\nMonthly",
            required: true,
          },
          {
            name: "asset_category",
            label: "Asset Category",
            type: "Link",
            linkTarget: "Asset Category",
            required: true,
          },
        ]),
      },
    ];
  }, [record]);

  // ----------------------
  // Submit handler
  // ----------------------
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
  if (!isDirty) {
    toast.info("No changes to save.");
    return;
  }

  if (!record) {
    toast.error("Record not loaded. Cannot save.", { duration: Infinity });
    return;
  }

  if (!apiKey || !apiSecret) {
    toast.error("Missing API credentials.");
    return;
  }

  setIsSaving(true);

  try {
    let currentDocname = docname;

    /* 🔁 RENAME USING LIS NAME */
    const newName = data.lis_name;

    if (newName && newName !== record.name) {
      try {
        await renameDocument(apiKey, apiSecret, doctypeName, record.name, newName);

        currentDocname = newName;

        setRecord(prev =>
          prev ? { ...prev, name: newName, lis_name: newName } : null
        );

        router.replace(`/maintenance/doctype/maintenance-checklist/${newName}`);
      } catch (renameError: any) {
        toast.error("Failed to rename document", {
          description: renameError.response?.data?.message || renameError.message,
        });
        setIsSaving(false);
        return;
      }
    }

    /* 🧹 CLEAN PAYLOAD (THIS WAS MISSING ❌) */
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

    // Required by Frappe
    finalPayload.modified = record.modified;
    finalPayload.docstatus = record.docstatus;

    /* 💾 UPDATE */
    const resp = await axios.put(
      `${API_BASE_URL}/${encodeURIComponent(doctypeName)}/${encodeURIComponent(currentDocname)}`,
      finalPayload,
      {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    toast.success("Changes saved!");

    if (resp.data?.data) setRecord(resp.data.data);

    router.push(`/maintenance/doctype/maintenance-checklist/${currentDocname}`);
  } catch (err: any) {
    console.error("Save error:", err);
    console.log("SERVER SAYS:", err.response?.data);
    toast.error("Failed to save", {
      description: err.response?.data?.message || err.message,
      duration: Infinity,
    });
  } finally {
    setIsSaving(false);
  }
};

  const handleCancel = () => router.back();

  // ----------------------
  // UI States
  // ----------------------
  if (loading) {
    return <div className="module active" style={{ padding: "2rem" }}>Loading {doctypeName} details...</div>;
  }

  if (error) {
    return <div className="module active" style={{ padding: "2rem", color: "red" }}>{error}</div>;
  }

  if (!record) {
    return <div className="module active" style={{ padding: "2rem" }}>{doctypeName} not found.</div>;
  }

  // ----------------------
  // Render form
  // ----------------------
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`${doctypeName}: ${record.name}`}
      description={`Update details for record ID: ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save"}
      cancelLabel="Cancel"
      deleteConfig={{
        doctypeName: doctypeName,
        docName: docname,
        redirectUrl: "/maintenance/doctype/maintenance-checklist",
      }}
    />
  );
}