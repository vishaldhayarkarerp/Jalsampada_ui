
"use client";

import * as React from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DynamicForm,
  TabbedLayout,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

/* -------------------------------------------------
 1. Maintenance Log type
 ------------------------------------------------- */
interface MaintenanceLogData {
  name?: string;
  naming_series?: string;
  task?: string;
  maintenance_status?: string;
  has_certificate?: number;
  completion_date?: string;
  log?: string;
  maintenance_schedule?: string;
}

/* -------------------------------------------------
 2. Page component
 ------------------------------------------------- */
export default function NewMaintenanceLogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const doctypeName = "Asset Maintenance Log";
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
   Parse duplicate data from URL parameters
  ------------------------------------------------- */
  const duplicateData: MaintenanceLogData | null = React.useMemo(() => {
    const duplicateParam = searchParams.get("duplicate");
    if (!duplicateParam) return null;

    try {
      const decodedData = JSON.parse(atob(decodeURIComponent(duplicateParam)));
      console.log("Parsed duplicate data:", decodedData);
      return decodedData;
    } catch (error) {
      console.error("Error parsing duplicate data:", error);
      toast.error("Invalid duplicate data provided.");
      return null;
    }
  }, [searchParams]);

  // Show notification once if duplicate data exists
  const notificationShown = React.useRef(false);
  React.useEffect(() => {
    if (duplicateData && !notificationShown.current) {
      toast.success("Form pre-filled with duplicate data. Please review and save.");
      notificationShown.current = true;
    }
  }, [duplicateData]);

  /* -------------------------------------------------
   Form tabs configuration
  ------------------------------------------------- */
const formTabs: TabbedLayout[] = React.useMemo(() => {
  const getValue = (fieldName: keyof MaintenanceLogData, defaultValue: any = undefined) =>
    duplicateData?.[fieldName] ?? defaultValue;

  return [
    {
      name: "Details",
      fields: [
        // Top identifiers row
        {
          name: "asset_maintenance",
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

        // Conditional fields: only show when maintenance_schedule is filled
        {
          name: "item_code",
          label: "Item Code",
          type: "Read Only",
          linkTarget: "Item",
          displayDependsOn: "maintenance_schedule", fetchFrom: { sourceField: "asset_maintenance", targetDoctype: "Asset Maintenance", targetField: "item_code" }
        },
        {
          name: "asset_maintenance",
          label: "Asset Name",
          type: "Read Only",
          linkTarget: "Asset",
          displayDependsOn: "maintenance_schedule", 
          fetchFrom: { sourceField: "maintenance_schedule", targetDoctype: "Asset", targetField: "asset_name" }
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
}, [duplicateData]);



  /* -------------------------------------------------
   Submit handler
  ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>) => {
    if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) {
      toast.error("Authentication required. Please log in.");
      return;
    }

    if (!data.task) {
      toast.info("Task field is required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...data };
      if (payload.name === "Will be auto-generated") {
        delete payload.name;
      }

      const response = await axios.post(`${API_BASE_URL}/${doctypeName}`, payload, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      toast.success("Maintenance Log created successfully!");
      const newName = response.data?.data?.name;
      if (newName) {
        router.push(`/maintenance/doctype/maintenance-log/${newName}`);
      }
    } catch (err: any) {
      console.error("Create error:", err);
      if (err.response?.data?.exc_type === "DuplicateEntryError") {
        toast.error("Duplicate Entry Error", {
          description: "A Maintenance Log with this series already exists.",
        });
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create Maintenance Log.";
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* -------------------------------------------------
   Render form
  ------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`New ${doctypeName}`}
      description="Fill out the details to create a new maintenance log entry."
      submitLabel={isSaving ? "Saving..." : "Save Log"}
      cancelLabel="Cancel"
    />
  );
}