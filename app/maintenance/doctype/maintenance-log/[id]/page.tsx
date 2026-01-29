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

/* --------------------------------------------------
  TYPES
-------------------------------------------------- */
interface MaintenanceLogData {
  name: string;
  naming_series?: string;
  task?: string;
  maintenance_status?: string;
  has_certificate?: number;
  completion_date?: string;
  log?: string;
  maintenance_schedule?: string;
  docstatus: 0 | 1 | 2;
  modified: string;
}

/* --------------------------------------------------
  COMPONENT
-------------------------------------------------- */
export default function MaintenanceLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = decodeURIComponent(params.id as string);
  const doctypeName = "Asset Maintenance Log";

  const [record, setRecord] = React.useState<MaintenanceLogData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  /* --------------------------------------------------
    FETCH RECORD
  -------------------------------------------------- */
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
          `${API_BASE_URL}/${encodeURIComponent(doctypeName)}/${docname}`,
          {
            headers: {
              Authorization: `token ${apiKey}:${apiSecret}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );

        setRecord(resp.data.data as MaintenanceLogData);
      } catch (err: any) {
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

  /* --------------------------------------------------
    BUILD FORM (FIELDS SAME AS NEW FORM)
  -------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!record) return [];

    const getValue = (fieldName: keyof MaintenanceLogData, defaultValue: any = undefined) =>
      record?.[fieldName] ?? defaultValue;

    return [
      {
        name: "Details",
        fields: [
          {
            name: "maintenance_schedule",
            label: "Maintenance Schedule",
            type: "Link",
            linkTarget: "Asset Maintenance",
            defaultValue: getValue("maintenance_schedule"),
          },
          {
            name: "naming_series",
            label: "Series",
            type: "Select",
            options: [{ label: "ACC-AML-.YYYY.-", value: "ACC-AML-.YYYY.-" }],
            defaultValue: getValue("naming_series"),
          },
          {
            name: "item_code",
            label: "Item Code",
            type: "Read Only",
            linkTarget: "Item",
            displayDependsOn: "maintenance_schedule",
            fetchFrom: {
              sourceField: "maintenance_schedule",
              targetDoctype: "Asset Maintenance",
              targetField: "item_code",
            },
          },
          {
            name: "asset_name",
            label: "Asset Name",
            type: "Read Only",
            linkTarget: "Asset",
            displayDependsOn: "maintenance_schedule",
            fetchFrom: {
              sourceField: "maintenance_schedule",
              targetDoctype: "Asset Maintenance",
              targetField: "asset_name",
            },
          },

          { name: "section_break_1", type: "Section Break", label: "Maintenance Details" },

          {
            name: "task",
            label: "Task",
            type: "Link",
            linkTarget: "Asset Maintenance Task",
            searchField: "maintenance_task",
            defaultValue: getValue("task"),
          },
          {
            name: "maintenance_status",
            label: "Status",
            type: "Select",
            options: [
              { label: "Planned", value: "Planned" },
              { label: "In Progress", value: "In Progress" },
              { label: "Cancelled", value: "Cancelled" },
              { label: "Overdue", value: "Overdue" },
            ],
            defaultValue: getValue("maintenance_status", "Planned"),
          },
          {
            name: "completion_date",
            label: "Completion Date",
            type: "Date",
            defaultValue: getValue("completion_date"),
          },

          { name: "section_break_2", type: "Section Break", label: "Certificate" },

          {
            name: "has_certificate",
            label: "Has Certificate?",
            type: "Check",
            defaultValue: getValue("has_certificate"),
          },
          {
            name: "resume",
            label: "Upload Certificate",
            type: "Attach",
            displayDependsOn: "has_certificate==1",
          },

          { name: "section_break_3", type: "Section Break", label: "Log Notes" },

          {
            name: "log",
            label: "Log Notes",
            type: "Small Text",
            defaultValue: getValue("log"),
          },
        ],
      },
    ];
  }, [record]);

  /* --------------------------------------------------
    SAVE (UPDATE)
  -------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }

    if (!record || !apiKey || !apiSecret) {
      toast.error("Cannot save.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = JSON.parse(JSON.stringify(data));

      const finalPayload: Record<string, any> = {
        ...payload,
        modified: record.modified,
        docstatus: record.docstatus,
      };

      const resp = await axios.put(
        `${API_BASE_URL}/${encodeURIComponent(doctypeName)}/${docname}`,
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
    } catch (err: any) {
      toast.error("Failed to save", {
        description: err.response?.data?.message || err.message,
        duration: Infinity,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* --------------------------------------------------
    UI STATES
  -------------------------------------------------- */
  if (loading) return <div style={{ padding: "2rem" }}>Loading {doctypeName}...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;
  if (!record) return <div style={{ padding: "2rem" }}>{doctypeName} not found.</div>;

  /* --------------------------------------------------
    RENDER
  -------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`${doctypeName}: ${record.name}`}
      description="Update Maintenance Log"
      submitLabel={isSaving ? "Saving..." : "Save"}
      cancelLabel="Cancel"
      deleteConfig={{
        doctypeName: doctypeName,
        docName: docname,
        redirectUrl: "/maintenance/doctype/maintenance-log",
      }}
    />
  );
}