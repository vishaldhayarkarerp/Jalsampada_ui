"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DynamicForm,
  TabbedLayout,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

export default function NewLogbookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKey, apiSecret } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  // 🟢 1. Store form methods to access watch/setValue
  const [formMethods, setFormMethods] = React.useState<UseFormReturn<any> | null>(null);

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
      toast.error("Failed to parse duplicate data", { duration: Infinity });
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
     2. Sync Logic (Primary -> Secondary)
  ------------------------------------------------- */
  React.useEffect(() => {
    if (!formMethods) return;

    // Subscribe to changes in the form
    const subscription = formMethods.watch((value, { name, type }) => {
      // Check if the changed field belongs to 'primary_list'
      if (name && name.startsWith("primary_list")) {

        // Get latest values
        const currentValues = formMethods.getValues();
        const primaryList = currentValues.primary_list || [];
        const currentSecondaryList = currentValues.secondary_list || [];

        // Identify pumps that are currently checked in Primary List
        const checkedPumpsMap = new Map();
        primaryList.forEach((row: any) => {
          // Check for true (boolean) or 1 (integer)
          if (row.pump && (row.check === 1 || row.check === true)) {
            checkedPumpsMap.set(row.pump, { pump: row.pump, pump_no: row.pump_no });
          }
        });

        // Construct New Secondary List
        let newSecondaryList: any[] = [];

        // A. Keep existing secondary items IF they are still checked in primary
        //    (This preserves existing rows and prevents duplicates)
        currentSecondaryList.forEach((secRow: any) => {
          // Check if this row originated from primary_list
          const existsInPrimary = primaryList.some((p: any) => p.pump === secRow.pump);

          if (existsInPrimary) {
            // If it's in primary, only keep it if it's currently checked
            if (checkedPumpsMap.has(secRow.pump)) {
              newSecondaryList.push(secRow);
              // Remove from map so we know we've handled it
              checkedPumpsMap.delete(secRow.pump);
            }
          } else {
            // If it's not in primary list at all (manual entry?), keep it
            newSecondaryList.push(secRow);
          }
        });

        // B. Append new checked items that weren't in secondary list
        checkedPumpsMap.forEach((pumpData) => {
          newSecondaryList.push(pumpData);
        });

        // Only update if array actually changed to avoid render loops
        if (JSON.stringify(currentSecondaryList) !== JSON.stringify(newSecondaryList)) {
          formMethods.setValue("secondary_list", newSecondaryList, { shouldDirty: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [formMethods]);

  /* -------------------------------------------------
     3. Define the form structure
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
            name: "entry_date",
            label: "Entry Date",
            type: "Date",
            defaultValue: getValue("entry_date"),
          },
          {
            name: "stop_datetime",
            label: "Stop Datetime",
            type: "DateTime",
            defaultValue: getValue("stop_datetime"),
          },

          {
            name: "lis_name",
            label: "LIS Name",
            type: "Link",
            linkTarget: "Lift Irrigation Scheme",
            defaultValue: getValue("lis_name"),
          },
          {
            name: "stage",
            label: "Stage",
            type: "Link",
            linkTarget: "Stage No",
            defaultValue: getValue("stage"),
            filterMapping: [
              { sourceField: "lis_name", targetField: "lis_name" }
            ],
          },
          {
            name: "operator_id_1",
            label: "Operator ID",
            type: "Link",
            linkTarget: "User",
            defaultValue: getValue("operator_id_1"),
          },
          {
            name: "operator_name_1",
            label: "Operator Name",
            type: "Data",
            defaultValue: getValue("operator_name_1"),
          },

          {
            name: "status",
            label: "Status",
            type: "Select",
            options: [
              { label: "Running", value: "Running" },
              { label: "Stopped", value: "Stopped" },
            ],
            defaultValue: getValue("status")
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
          {
            name: "pump_stop_reason",
            label: "Pump Stop Reason",
            type: "Link",
            linkTarget: "Pump Stop Reasons",
            defaultValue: getValue("pump_stop_reason"),
          },
        ],
      },
    ];
  }, [duplicateData]);

  /* -------------------------------------------------
     4. SUBMIT (Create)
     ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    // Check if we have valid data to submit
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
     5. RENDER FORM
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
      // 🟢 Pass the setter to capture form methods
      onFormInit={setFormMethods}
    />
  );
}