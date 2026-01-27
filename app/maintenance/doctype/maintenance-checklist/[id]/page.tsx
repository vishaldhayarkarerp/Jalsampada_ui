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
import { MaintenanceChecklistMatrix } from "@/app/maintenance/doctype/maintenance-checklist/components/MaintenanceChecklistMatrix"; // 🟢 Import Matrix

// API base URL
const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

// ----------------------
// 1. Types
// ----------------------
interface MaintenanceChecklist {
  name: string;
  lis_name?: string;
  stage?: string;
  monitoring_type?: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly";
  asset_category?: string;
  checklist_data?: any[];
  modified: string;
  owner?: string;
}

// ----------------------
// 2. Component
// ----------------------
export default function MaintenanceChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = decodeURIComponent(params.id as string);
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

        setRecord(resp.data.data as Omit<MaintenanceChecklist, 'docstatus'>);
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

    // Helper to map record values to fields
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
            { name: "posting_datetime", label: "Posting Datetime", type: "DateTime" },
          {
            name: "lis_name",
            label: "LIS Name",
            type: "Link",
            linkTarget: "Lift Irrigation Scheme",
            required: true,
          },
          {
            name: "stage",
            label: "Stage",
            type: "Link",
            linkTarget: "Stage No",
            required: true,
            // Dynamic filter for stage based on LIS Name
            filters: (getValues) => {
                const lis = getValues("lis_name");
                return lis ? { "lis_name": lis } : {};
            }
          },
          {
            name: "asset_category",
            label: "Asset Category",
            type: "Link",
            linkTarget: "Asset Category",
            required: true,
          },
          {
            name: "monitoring_type",
            label: "Monitoring Type",
            type: "Select",
            options: [
                            { label: "Daily", value: "Daily" },
                            { label: "Weekly", value: "Weekly" },
                            { label: "Monthly", value: "Monthly" },
                            { label: "Quarterly", value: "Quarterly" },
                            { label: "Half-Yearly", value: "Half-Yearly" },
                            { label: "Yearly", value: "Yearly" }
                        ],
            required: true,
          },
          // 🟢 MATRIX UI SECTION
          {
            name: "checklist_matrix_section",
            label: "Checklist Matrix",
            type: "Section Break",
          },
          {
            name: "checklist_ui",
            label: "",
            type: "Custom",
            // The Matrix component will auto-read 'checklist_data' from the form state
            customElement: <MaintenanceChecklistMatrix />
          },
        ]),
      },
    ];
  }, [record]);

  // ----------------------
  // Submit handler
  // ----------------------
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!record) return;
    if (!apiKey || !apiSecret) {
      toast.error("Missing API credentials.");
      return;
    }

    setIsSaving(true);

    try {
      let currentDocname = record.name;

      /* 🔁 1. RENAME LOGIC (If LIS Name changed) */
      // Note: In Frappe, usually specific naming series controls the name. 
      // If your logic relies on renaming, keep this. Otherwise, standard update is safer.
      /* const newName = data.lis_name; 
      if (newName && newName !== record.lis_name) {
          // Rename logic here if strictly required by your business logic
      }
      */

      /* 🧹 2. CLEAN PAYLOAD */
      const payload: Record<string, any> = { ...data };

      // Remove UI-only fields
      delete payload.checklist_ui;
      delete payload.checklist_matrix_section;
      
      // Remove standard non-editable fields if they exist in data
      delete payload.modified;
      delete payload.creation;
      delete payload.owner;
      delete payload.idx;

      // Ensure checklist_data is passed (it should be in 'data' from useForm)
      // If the matrix hasn't been touched, it might not be in 'data' depending on dirty state.
      // safely fallback to record.checklist_data if not present in data
      if (!payload.checklist_data && record.checklist_data) {
        payload.checklist_data = record.checklist_data;
      }

      /* 💾 3. UPDATE */
      const resp = await axios.put(
        `${API_BASE_URL}/${encodeURIComponent(doctypeName)}/${encodeURIComponent(currentDocname)}`,
        payload,
        {
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      toast.success("Checklist saved successfully!");

      if (resp.data?.data) {
        setRecord(resp.data.data);
        // If name changed via backend (rare for PUT), handle redirect
        if (resp.data.data.name !== currentDocname) {
            router.push(`/maintenance/doctype/maintenance-checklist/${resp.data.data.name}`);
        }
      }

    } catch (err: any) {
      console.error("Save error:", err);
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
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Loading Checklist...</p>
            </div>
        </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!record) {
    return <div className="p-8">Document not found.</div>;
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
      description="Update checklist details and matrix"
      submitLabel={isSaving ? "Saving..." : "Save"}
      cancelLabel="Cancel"
      initialStatus="Draft"
      docstatus={0}
      isSubmittable={false}
      deleteConfig={{
        doctypeName: doctypeName,
        docName: docname,
        redirectUrl: "/maintenance/doctype/maintenance-checklist",
      }}
    />
  );
}