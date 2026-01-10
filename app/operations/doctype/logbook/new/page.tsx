"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DynamicForm,
  TabbedLayout,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

export default function NewLogbookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKey, apiSecret } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  const doctypeName = "Logbook";

  // Parse duplicate data from URL parameters
  const duplicateData = React.useMemo(() => {
    const duplicateParam = searchParams.get('duplicate');
    if (!duplicateParam) return null;
    
    try {
      const decodedData = JSON.parse(atob(decodeURIComponent(duplicateParam)));
      console.log("Parsed duplicate data:", decodedData);
      return decodedData;
    } catch (error) {
      console.error("Error parsing duplicate data:", error);
      toast.error("Failed to parse duplicate data");
      return null;
    }
  }, [searchParams]);

  // Show notification if we have duplicate data (only once)
  const notificationShown = React.useRef(false);
  React.useEffect(() => {
    if (duplicateData && !notificationShown.current) {
      toast.success("Form populated with duplicate data. Modify as needed and save.");
      notificationShown.current = true;
    }
  }, [duplicateData]);

  /* -------------------------------------------------
     1. Define the form structure
     ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    // Helper function to get value from duplicate data or fallback to default
    const getValue = (fieldName: string, defaultValue: any = undefined) => {
      return duplicateData?.[fieldName] ?? defaultValue;
    };

    return [
      {
        name: "Details",
        fields: [
          {
            name: "start_pump",
            label: "Start Pump",
            type: "Check",
            defaultValue: getValue("start_pump", 0),
          },
          {
            name: "stop_pump",
            label: "Stop Pump",
            type: "Check",
            defaultValue: getValue("stop_pump", 0),
          },
          {
            name: "stop_datetime",
            label: "Stop Datetime",
            type: "DateTime",
            defaultValue: getValue("stop_datetime"),
          },
          {
            name: "operator_id_1",
            label: "Operator ID",
            type: "Link",
            linkTarget: "Employee",
            defaultValue: getValue("operator_id_1"),
          },
          {
            name: "operator_name_1",
            label: "Operator Name",
            type: "Data",
            defaultValue: getValue("operator_name_1"),
          },
          {
            name: "pump_stop_reason",
            label: "Pump Stop Reason",
            type: "Link",
            linkTarget: "Pump Stop Reasons",
            defaultValue: getValue("pump_stop_reason"),
          },
          {
            name: "primary_list",
            label: "Primary List",
            type: "Table",
            defaultValue: getValue("primary_list", []),
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "motor", label: "Motor", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Int" },
              { name: "check", label: "Check", type: "Check" },
            ],
          },
          {
            name: "secondary_list",
            label: "Secondary List",
            type: "Table",
            defaultValue: getValue("secondary_list", []),
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Int" },
            ],
          },
        ],
      },
    ];
  }, [duplicateData]);

  /* -------------------------------------------------
     2. SUBMIT (Create)
     ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    // Check if we have valid data to submit
    // For Logbook, we might ensure at least one operator or datetime is set, 
    // or just rely on 'isDirty' if user filled anything.
    const hasValidData = isDirty || (duplicateData && (data.start_pump || data.stop_pump));
    
    if (!hasValidData) {
      toast.info("Please fill out the form.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const payload: Record<string, any> = { ...data };
      payload.doctype = doctypeName;

      // Convert Parent Booleans
      if ("start_pump" in payload) payload.start_pump = payload.start_pump ? 1 : 0;
      if ("stop_pump" in payload) payload.stop_pump = payload.stop_pump ? 1 : 0;

      // Convert Child Table Booleans (Primary List)
      if (Array.isArray(payload.primary_list)) {
        payload.primary_list = payload.primary_list.map((row: any) => ({
          ...row,
          check: row.check ? 1 : 0,
        }));
      }

      console.log("Sending NEW Logbook payload:", payload);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `token ${apiKey}:${apiSecret}`,
      };

      const storedCsrfToken = localStorage.getItem('csrfToken');
      if (storedCsrfToken) {
        headers['X-Frappe-CSRF-Token'] = storedCsrfToken;
      }

      const resp = await fetch(`${API_BASE_URL}/${doctypeName}`, {
        method: 'POST',
        headers: headers,
        credentials: 'include', 
        body: JSON.stringify(payload), 
      });

      const responseData = await resp.json();

      if (!resp.ok) {
        console.log("Full server error:", responseData);
        throw new Error(responseData.exception || responseData._server_messages || "Failed to create document");
      }
      
      toast.success("Logbook created successfully!");
      
      router.push(`/operations/doctype/logbook`);

    } catch (err: any) {
      console.error("Save error:", err);
      
      if (err.response?.data?.exc_type === "DuplicateEntryError") {
        toast.error("Duplicate Entry Error", {
          description: "This Logbook record may already exist."
        });
      } else {
        toast.error("Failed to create Logbook", {
          description: err.message || "Check console for details."
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* -------------------------------------------------
     3. RENDER FORM
     ------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title="New Logbook"
      description="Create a new Logbook record"
      submitLabel={isSaving ? "Saving..." : "Create"}
      cancelLabel="Cancel"
    />
  );
}