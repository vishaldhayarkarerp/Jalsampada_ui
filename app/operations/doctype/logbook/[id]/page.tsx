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

// 🟢 CONFIGURATION
const API_BASE_URL = "http://103.219.1.138:4412/api/resource";
const API_METHOD_URL = "http://103.219.1.138:4412/api/method";
const DOCTYPE_NAME = "Logbook";

// 🟢 INTERFACES
interface LogbookData {
  name: string;
  entry_date?: string;
  lis_name?: string;
  stage?: string;
  
  // Backend stores these as separate checks
  start_pump?: 0 | 1;
  stop_pump?: 0 | 1;
  
  // Start Fields
  start_datetime?: string;
  operator_id?: string;
  operator_name?: string;

  // Stop Fields
  stop_datetime?: string;
  operator_id_1?: string;
  operator_name_1?: string;
  pump_stop_reason?: string;
  specify?: string;

  primary_list?: Array<{
    pump?: string;
    pump_no?: number;
    motor?: string;
    motor_no?: string;
    check?: 0 | 1;
  }>;

  secondary_list?: Array<{
    pump?: string;
    pump_no?: number;
  }>;

  docstatus: 0 | 1 | 2;
  modified: string;
}

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const docname = params.id as string;

  const [logbook, setLogbook] = React.useState<LogbookData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [userFullName, setUserFullName] = React.useState<string | null>(null);
  
  // Store form methods for automation
  const [formMethods, setFormMethods] = React.useState<UseFormReturn<any> | null>(null);

  // 🟢 HELPER: Directly fetch User ID from Browser Cookies (Instant)
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const val = parts.pop()?.split(';').shift();
        return val ? decodeURIComponent(val) : null;
    }
    return null;
  };

  // 🟢 HELPER: Fetch current user if not available
  const fetchCurrentUser = async (): Promise<string | null> => {
    if (!apiKey || !apiSecret) return null;
    
    try {
      const response = await fetch(
        "http://103.219.1.138:4412/api/method/frappe.auth.get_logged_user",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const user = data.message || null;
      
      // Store in localStorage for future use
      if (user && typeof window !== "undefined") {
        localStorage.setItem("currentUser", user);
      }
      
      return user;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  };

  // 🟢 HELPER: Fetch user's full name
  const fetchUserFullName = async (userId: string): Promise<string | null> => {
    if (!userId || !apiKey || !apiSecret) return null;
    
    try {
      const response = await fetch(
        `http://103.219.1.138:4412/api/resource/User/${userId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const fullName = data.data?.full_name || null;
      
      return fullName;
    } catch (error) {
      console.error("Error fetching user full name:", error);
      return null;
    }
  };

  // 🟢 Fetch user full name when user ID is available
  React.useEffect(() => {
    const getUserAndFullName = async () => {
      const cookieUser = getCookie("user_id");
      const localStorageUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
      const userId = cookieUser || localStorageUser;
      
      if (userId && !userFullName) {
        const fullName = await fetchUserFullName(userId);
        if (fullName) {
          setUserFullName(fullName);
        }
      }
    };
    
    getUserAndFullName();
  }, [userFullName]);

  // 🟢 1. FETCH RECORD
  React.useEffect(() => {
    const fetchRecord = async () => {
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) return;

      try {
        setLoading(true);
        const resp = await axios.get(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, {
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
        });
        setLogbook(resp.data.data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load Logbook record.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  // 🟢 2. AUTOMATION LOGIC (Ported from new/page.tsx & Adapted for Toggle)
  React.useEffect(() => {
    if (!formMethods || !apiKey || !apiSecret || !logbook) return;

    // 🟢 Initial Mutual Exclusivity Check (runs once when form loads)
    const startPump = formMethods.getValues("start_pump");
    const stopPump = formMethods.getValues("stop_pump");
    
    if (startPump && stopPump) {
      // If both are checked in the data, default to start_pump and uncheck stop_pump
      formMethods.setValue("stop_pump", 0);
    }

    const subscription = formMethods.watch(async (value, { name, type }) => {
      const form = formMethods; 

      // ➤ LOGIC A: Strong Mutual Exclusivity (ensure only one can be checked)
      const startPump = form.getValues("start_pump");
      const stopPump = form.getValues("stop_pump");
      
      if (startPump && stopPump) {
        // If both are somehow checked, uncheck the one that wasn't just changed
        if (name === "start_pump") {
          form.setValue("stop_pump", 0);
          fetchPumps("Stopped");
        } else if (name === "stop_pump") {
          form.setValue("start_pump", 0);
          fetchPumps("Running");
        } else {
          // If neither was changed (form load), default to start_pump
          form.setValue("stop_pump", 0);
        }
      } else if (name === "start_pump" && value.start_pump) {
        // Normal mutual exclusivity: checking start unchecks stop
        form.setValue("stop_pump", 0); 
        fetchPumps("Stopped");
      } else if (name === "stop_pump" && value.stop_pump) {
        // Normal mutual exclusivity: checking stop unchecks start
        form.setValue("start_pump", 0); 
        fetchPumps("Running");
      }

      // ➤ LOGIC B: Fetch Pumps
      if (name === "lis_name" || name === "stage") {
        const isStart = form.getValues("start_pump");
        const isStop = form.getValues("stop_pump");
        if (isStart) fetchPumps("Stopped");
        else if (isStop) fetchPumps("Running");
      }

      // ➤ LOGIC C: Sync Lists
      if (name && name.startsWith("primary_list")) {
        syncPrimaryToSecondary();
      }
    });

    // Helper: Fetch Pumps
    const fetchPumps = async (status: "Running" | "Stopped") => {
      const values = formMethods.getValues();
      if (!values.lis_name || !values.stage) return;

      try {
        toast.info(`Fetching ${status} pumps...`);
        const resp = await axios.get(`${API_METHOD_URL}/quantlis_management.operations.doctype.logbook.logbook.get_primary_list_with_motor`, {
          params: {
            lis_name: values.lis_name,
            stage: values.stage,
            status: status
          },
          headers: { Authorization: `token ${apiKey}:${apiSecret}` }
        });

        const pumps = resp.data.message || [];
        
        const tableData = pumps.map((p: any) => ({
          pump: p.pump,
          pump_no: p.pump_no,
          motor: p.motor,
          motor_no: p.motor_no,
          check: 0 
        }));

        formMethods.setValue("primary_list", tableData);
        formMethods.setValue("secondary_list", []); 
        
      } catch (error) {
        console.error("Failed to fetch pumps", error);
        toast.error("Failed to load pump list");
      }
    };

    // Helper: Sync Lists
    const syncPrimaryToSecondary = () => {
      const primaryList = formMethods.getValues("primary_list") || [];
      const newSecondaryList = primaryList
        .filter((row: any) => row.check === 1 || row.check === true)
        .map((row: any) => ({
          pump: row.pump,
          pump_no: row.pump_no,
          motor: row.motor
        }));
      
      const currentSec = formMethods.getValues("secondary_list");
      if (JSON.stringify(currentSec) !== JSON.stringify(newSecondaryList)) {
        formMethods.setValue("secondary_list", newSecondaryList);
      }
    };

    return () => subscription.unsubscribe();
  }, [formMethods, apiKey, apiSecret, logbook]);


  // 🟢 3. FORM DEFINITION
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!logbook) return [];

    // Helper to map DB values to Form values
    const getVal = (key: keyof LogbookData, def?: any) => logbook[key] ?? def;

    // 🟢 Logic to determine initial Pump Status from DB fields
    // If start_pump is 1, status is 1 (Start). Else 0 (Stop).
    const initialStatus = (logbook.start_pump === 1) ? 1 : 0;

    return [
      {
        name: "Details",
        fields: [
          // ── SECTION 1: MODE (Using Two Checkboxes like new/page.tsx) ──────────────────────
          { 
            name: "sec_mode", 
            label: "Operation Mode", 
            type: "Section Break" 
          },
          {
            name: "start_pump",
            label: "Start Pump",
            type: "Check",
            defaultValue: getVal("start_pump", 0),
          },
          {
            name: "stop_pump",
            label: "Stop Pump",
            type: "Check",
            defaultValue: getVal("stop_pump", 0),
          },
          { name: "cb_mode", label: "", type: "Column Break" },  

          // ── SECTION 2: CONTEXT ──────────────────────────────────────────
          {
             name: "sec_location", 
             label: "Location & Date", 
             type: "Section Break" 
          },
          {
            name: "entry_date",
            label: "Entry Date",
            type: "Date",
            defaultValue: getVal("entry_date"),
          },
          {
            name: "lis_name",
            label: "LIS Name",
            type: "Link",
            linkTarget: "Lift Irrigation Scheme",
            defaultValue: getVal("lis_name"),
            required: true
          },
          {
            name: "stage",
            label: "Stage",
            type: "Link",
            linkTarget: "Stage No",
            defaultValue: getVal("stage"),
            required: true,
            filterMapping: [{ sourceField: "lis_name", targetField: "lis_name" }],
          }, 

          // ── SECTION 3: OPERATION DETAILS (Dynamic) ──────────────────────
          { 
            name: "sec_details", 
            label: "Operation Details", 
            type: "Section Break",
          },

          // ➤ START MODE DETAILS (Visible when pump_status == 1)
          {
            name: "start_datetime",
            label: "Start Datetime",
            type: "DateTime",
            defaultValue: getVal("start_datetime"),
            displayDependsOn: "start_pump == 1"
          },
          {
            name: "operator_id",
            label: "Operator ID",
            type: "Read Only",
            linkTarget: "User",
            defaultValue: getVal("operator_id") || (() => {
              const cookieUser = getCookie("user_id");
              const localStorageUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
              return cookieUser || localStorageUser;
            })(),
            readOnly: true,
            displayDependsOn: "start_pump == 1"
          },
          {
            name: "operator_name",
            label: "Operator Name",
            type: "Read Only",
            defaultValue: getVal("operator_name") || userFullName,
            readOnly: true,
            displayDependsOn: "start_pump == 1",
            fetchFrom: {
              sourceField: "operator_id",
              targetDoctype: "User",
              targetField: "full_name"
            }
          },

          // ➤ STOP MODE DETAILS (Visible when pump_status == 0)
          {
            name: "stop_datetime",
            label: "Stop Datetime",
            type: "DateTime",
            defaultValue: getVal("stop_datetime"),
            displayDependsOn: "stop_pump == 1" 
          },
          {
            name: "pump_stop_reason",
            label: "Reason",
            type: "Link",
            linkTarget: "Pump Stop Reasons",
            defaultValue: getVal("pump_stop_reason"),
            displayDependsOn: "stop_pump == 1" 
          },
          {
            name: "specify",
            label: "Specify (if Other)",
            type: "Small Text",
            defaultValue: getVal("specify"),
            displayDependsOn: "pump_stop_reason == 'Other'" 
          },
          {
            name: "operator_id_1",
            label: "Operator ID",
            type: "Read Only",
            linkTarget: "User", 
            defaultValue: getVal("operator_id_1") || (() => {
              const cookieUser = getCookie("user_id");
              const localStorageUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
              return cookieUser || localStorageUser;
            })(),
            readOnly: true,
            displayDependsOn: "stop_pump == 1"
          },
          {
            name: "operator_name_1",
            label: "Operator Name",
            type: "Read Only",
            defaultValue: getVal("operator_name_1") || userFullName,
            readOnly: true,
            displayDependsOn: "stop_pump == 1",
            fetchFrom: {
              sourceField: "operator_id_1",
              targetDoctype: "User",
              targetField: "full_name"
            }
          },

          // ── SECTION 4: ASSETS ───────────────────────────────────────────
          { 
            name: "sec_assets", 
            label: "Asset Selection", 
            type: "Section Break",
          },
          {
            name: "primary_list",
            label: "Available Pumps (Select to Act)",
            type: "Table",
            defaultValue: getVal("primary_list", []),
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "motor", label: "Motor", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Data" },
              { name: "motor_no", label: "Motor No", type: "Data" },
              { name: "check", label: "Select", type: "Check" }, 
            ],
          },
          {
            name: "secondary_list",
            label: "Selected for Update",
            type: "Table",
            defaultValue: getVal("secondary_list", []),
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Data" },
            ],
          },
        ],
      }
    ];
  }, [logbook]);

  // 🟢 4. SUBMIT HANDLER
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }

    setIsSaving(true);

    try {
      const payload: Partial<LogbookData> = { ...data } as any;
      payload.modified = logbook?.modified;
      payload.docstatus = logbook?.docstatus;

      // 🟢 MAP CHECKBOX FIELDS TO DB FIELDS
      // Use the checkbox values directly - no conversion needed
      const isStart = data.start_pump === 1;
      const isStop = data.stop_pump === 1;
      
      payload.start_pump = data.start_pump;
      payload.stop_pump = data.stop_pump;

      // 🟢 Ensure operator fields are set when switching modes
      const cookieUser = getCookie("user_id");
      const localStorageUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
      const currentUser = cookieUser || localStorageUser;
      
      if (isStart) {
        // For Start mode, ensure operator_id and operator_name are set
        if (!payload.operator_id && currentUser) {
          payload.operator_id = currentUser;
        }
        if (!payload.operator_name && userFullName) {
          payload.operator_name = userFullName;
        }
      }
      
      if (isStop) {
        // For Stop mode, ensure operator_id_1 and operator_name_1 are set
        if (!payload.operator_id_1 && currentUser) {
          payload.operator_id_1 = currentUser;
        }
        if (!payload.operator_name_1 && userFullName) {
          payload.operator_name_1 = userFullName;
        }
      }

      // Clean up irrelevant fields based on status
      if (isStart) {
        payload.stop_datetime = undefined; // Send undefined/null to clear or ignore
        payload.pump_stop_reason = undefined;
        // Preserve operator fields instead of clearing them
        // payload.operator_id_1 = undefined;
        // payload.operator_name_1 = undefined;
      }
      
      if (isStop) {
        payload.start_datetime = undefined;
        // Preserve operator fields instead of clearing them
        // payload.operator_id = undefined;
        // payload.operator_name = undefined;
      }

      // Remove UI-only fields before sending (none needed for checkbox approach)

      // Format Table
      if (Array.isArray(payload.primary_list)) {
        payload.primary_list = payload.primary_list.map((row: any) => ({
          ...row,
          check: row.check ? 1 : 0,
        }));
      }

      await axios.put(
        `${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`,
        payload,
        {
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
        }
      );

      toast.success("Logbook updated successfully!");
      
      // Reload to reflect changes
      const updated = await axios.get(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, {
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
      });
      setLogbook(updated.data.data);
      
      // Reset form dirty state to show "Saved"
      formMethods?.reset(updated.data.data);

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.exception || "Failed to update record");
    } finally {
      setIsSaving(false);
    }
  };

  // 🟢 5. RENDER
  if (loading) return <div className="p-8 text-center text-gray-500">Loading Logbook...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!logbook) return <div className="p-8 text-center">Record not found.</div>;

  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      title={`${DOCTYPE_NAME}: ${logbook.name}`}
      description={`Record ID: ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save Changes"}
      isSubmittable={true}
      docstatus={logbook.docstatus}
      onFormInit={setFormMethods}
      deleteConfig={{
        doctypeName: DOCTYPE_NAME,
        docName: docname,
        redirectUrl: "/operations/doctype/logbook"
      }}
    />
  );
}