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
import { UseFormReturn } from "react-hook-form";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

/* -------------------------------------------------
   1. Logbook type
------------------------------------------------- */
interface LogbookData {
  name: string;
  date?: string;
  location?: string;

  pump_status?: 0 | 1;
  start_datetime?: string;
  operator_id?: string;
  operator_name?: string;
  stop_datetime?: string;
  operator_id_1?: string;
  operator_name_1?: string;
  pump_stop_reason?: string;

  primary_list?: Array<{
    pump?: string;
    pump_no?: number;
    check?: 0 | 1;
  }>;

  secondary_list?: Array<{
    pump?: string;
    pump_no?: number;
  }>;

  docstatus: 0 | 1 | 2;
  modified: string;
}

/* -------------------------------------------------
   2. Page Component
------------------------------------------------- */
export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Logbook";

  const [logbook, setLogbook] = React.useState<LogbookData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // 🟢 1. Store form methods to access watch/setValue
  const [formMethods, setFormMethods] = React.useState<UseFormReturn<any> | null>(null);

  /* -------------------------------------------------
     3. Fetch Logbook
  ------------------------------------------------- */
  React.useEffect(() => {
    const fetchData = async () => {
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) return;

      try {
        const resp = await axios.get(
          `${API_BASE_URL}/${doctypeName}/${docname}`,
          {
            headers: {
              Authorization: `token ${apiKey}:${apiSecret}`,
            },
          }
        );

        setLogbook(resp.data.data);
      } catch {
        setError("Failed to load Logbook");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  /* -------------------------------------------------
     4. Sync Logic (Primary -> Secondary)
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
        //    (This prevents duplicates and maintains any manual edits if applicable)
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
     5. Tabs
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!logbook) return [];

    const fields = (list: FormField[]) =>
      list.map((f) => ({
        ...f,
        defaultValue:
          f.name in logbook
            ? logbook[f.name as keyof LogbookData]
            : f.defaultValue,
      }));

    return [
      {
        name: "Details",
        fields: fields([
          // { name: "location", label: "Location", type: "Link", linkTarget: "Location" },

          { name: "pump_status", label: "Pump Status", type: "Pump Status" },

          { name: "start_datetime", label: "Start Datetime", type: "DateTime", displayDependsOn: "pump_status == 1" },
          { name: "operator_id", label: "Operator ID", type: "Link", linkTarget: "User", displayDependsOn: "pump_status == 1" },
          { name: "operator_name", label: "Operator Name", type: "Data", displayDependsOn: "pump_status == 1" },

          { name: "stop_datetime", label: "Stop Datetime", type: "DateTime", displayDependsOn: "pump_status == 0" },
          { name: "operator_id_1", label: "Operator ID", type: "Link", linkTarget: "User", displayDependsOn: "pump_status == 0" },
          { name: "operator_name_1", label: "Operator Name", type: "Data", displayDependsOn: "pump_status == 0" },

          {
            name: "pump_stop_reason",
            label: "Pump Stop Reason",
            type: "Link",
            linkTarget: "Pump Stop Reasons",
            displayDependsOn: "pump_status == 0"
          },
          {
            name: "primary_list",
            label: "Primary List",
            type: "Table",
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "motor", label: "Motor", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Data" },
               { name: "motor_no", label: "Motor No", type: "Data" },
              { name: "check", label: "Check", type: "Check" },
            ],
          },
          {
            name: "secondary_list",
            label: "Secondary List",
            type: "Table",
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Int" },
            ],
          },

        ]),
      }
    ];
  }, [logbook]);

  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);

    try {
      const payload = { ...data };
      payload.modified = logbook?.modified;
      payload.docstatus = logbook?.docstatus;
      
      // Convert pump_status to start_pump/stop_pump for backend compatibility
      payload.start_pump = data.pump_status ? 1 : 0;
      payload.stop_pump = data.pump_status ? 0 : 1;
      
      // Only include relevant datetime fields based on pump status
      if (data.pump_status === 1) {
        // Start mode - include start_datetime, exclude stop_datetime
        delete payload.stop_datetime;
        delete payload.pump_stop_reason;
        delete payload.operator_id_1;
        delete payload.operator_name_1;
      } else {
        // Stop mode - include stop_datetime, exclude start_datetime
        delete payload.start_datetime;
        delete payload.operator_id;
        delete payload.operator_name;
      }

      if (payload.primary_list) {
        payload.primary_list.forEach((r: any) => {
          r.check = r.check ? 1 : 0;
        });
      }

      await axios.put(
        `${API_BASE_URL}/${doctypeName}/${docname}`,
        payload,
        {
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
        }
      );

      toast.success("Logbook updated");
      router.push(`/operations/doctype/logbook/${encodeURIComponent(docname)}`);
    } catch {
      toast.error("Save failed", { duration: Infinity });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!logbook) return <p>Not found</p>;

  /* -------------------------------------------------
     6. Render
  ------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      title={`${doctypeName}: ${logbook.name}`}
      submitLabel={isSaving ? "Saving..." : "Save"}
      deleteConfig={{
        doctypeName: doctypeName,
        docName: docname,
        redirectUrl: "/operations/doctype/logbook"
      }}
      isSubmittable={true}
      // 🟢 Pass the setter to capture form methods
      onFormInit={setFormMethods}
    />
  );
}