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
import axios from "axios";

// Base URL for Resources
const API_BASE_URL = "http://103.219.1.138:4412/api/resource";
// Base URL for RPC Methods (Custom Python logic)
const API_METHOD_URL = "http://103.219.1.138:4412/api/method";

export default function NewLogbookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 🟢 Removed currentUser from here to rely on Cookie instead
  const { apiKey, apiSecret } = useAuth(); 
  const [isSaving, setIsSaving] = React.useState(false);
  const [userFullName, setUserFullName] = React.useState<string | null>(null);

  // Store form methods
  const [formMethods, setFormMethods] = React.useState<UseFormReturn<any> | null>(null);

  const doctypeName = "Logbook";

  // 🟢 HELPER: Directly fetch User ID from Browser Cookies (Instant)
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    console.log("🔍 Debug - All cookies:", document.cookie);
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const val = parts.pop()?.split(';').shift();
        return val ? decodeURIComponent(val) : null;
    }
    return null;
  };

  // 🟢 Debug: Check localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("🔍 Debug - localStorage:", {
        apiKey: localStorage.getItem("apiKey"),
        apiSecret: localStorage.getItem("apiSecret") ? "***" : null,
        currentUser: localStorage.getItem("currentUser"),
        posProfile: localStorage.getItem("posProfile")
      });
    }
  }, []);

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
      console.log("🔍 Debug - Fetched current user:", user);
      
      // Store in localStorage for future use
      if (user && typeof window !== "undefined") {
        localStorage.setItem("currentUser", user);
      }
      
      return user;
    } catch (error) {
      console.error("🔍 Debug - Error fetching current user:", error);
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
      console.log("🔍 Debug - Fetched user full name:", fullName);
      
      return fullName;
    } catch (error) {
      console.error("🔍 Debug - Error fetching user full name:", error);
      return null;
    }
  };

  const duplicateData = React.useMemo(() => {
    const duplicateParam = searchParams.get('duplicate');
    if (!duplicateParam) return null;
    try {
      return JSON.parse(atob(decodeURIComponent(duplicateParam)));
    } catch (error) {
      console.error("Error parsing duplicate data:", error);
      return null;
    }
  }, [searchParams]);

  // 🟢 Fetch user full name when user ID is available
  React.useEffect(() => {
    const getUserAndFullName = async () => {
      const cookieUser = getCookie("user_id");
      const localStorageUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
      const userId = cookieUser || localStorageUser;
      
      if (userId && !userFullName) {
        console.log("🔍 Debug - Fetching full name for user:", userId);
        const fullName = await fetchUserFullName(userId);
        if (fullName) {
          setUserFullName(fullName);
          console.log("🔍 Debug - Set user full name:", fullName);
        }
      }
    };
    
    getUserAndFullName();
  }, [userFullName]); // Only run once when userFullName is null

  // 🟢 Update form fields when userFullName becomes available
  React.useEffect(() => {
    if (formMethods && userFullName) {
      console.log("🔍 Debug - Updating form with userFullName:", userFullName);
      
      // Update operator_name if it's empty
      const currentOperatorName = formMethods.getValues("operator_name");
      if (!currentOperatorName) {
        formMethods.setValue("operator_name", userFullName);
        console.log("🔍 Debug - Set operator_name to:", userFullName);
      }
      
      // Update operator_name_1 if it's empty
      const currentOperatorName1 = formMethods.getValues("operator_name_1");
      if (!currentOperatorName1) {
        formMethods.setValue("operator_name_1", userFullName);
        console.log("🔍 Debug - Set operator_name_1 to:", userFullName);
      }
    }
  }, [userFullName, formMethods]);

  React.useEffect(() => {
    if (duplicateData) {
      toast.success("Form populated with duplicate data.");
    }
  }, [duplicateData]);

  /* -------------------------------------------------
     2. AUTOMATION LOGIC
  ------------------------------------------------- */
  React.useEffect(() => {
    if (!formMethods || !apiKey || !apiSecret) return;

    // 🟢 LOGIC D: Force Set User from Cookie (Backup Check)
    // This ensures that if the default value missed it, we set it now.
    const cookieUser = getCookie("user_id");
    console.log("🔍 Debug - cookieUser value:", cookieUser);
    
    if (cookieUser) {
        console.log("🔍 Debug - Setting cookieUser:", cookieUser);
        // Set for Start Mode
        if (!formMethods.getValues("operator_id")) {
             formMethods.setValue("operator_id", cookieUser);
             console.log("🔍 Debug - Set operator_id to:", cookieUser);
        }
        // Set for Stop Mode
        if (!formMethods.getValues("operator_id_1")) {
             formMethods.setValue("operator_id_1", cookieUser);
             console.log("🔍 Debug - Set operator_id_1 to:", cookieUser);
        }
    } else {
        console.log("🔍 Debug - No cookieUser available, fetching from API");
        // Fetch user from API if no cookie available
        fetchCurrentUser().then(fetchedUser => {
            if (fetchedUser) {
                console.log("🔍 Debug - Setting fetchedUser:", fetchedUser);
                // Set for Start Mode
                if (!formMethods.getValues("operator_id")) {
                     formMethods.setValue("operator_id", fetchedUser);
                     console.log("🔍 Debug - Set operator_id to fetchedUser:", fetchedUser);
                }
                // Set for Stop Mode
                if (!formMethods.getValues("operator_id_1")) {
                     formMethods.setValue("operator_id_1", fetchedUser);
                     console.log("🔍 Debug - Set operator_id_1 to fetchedUser:", fetchedUser);
                }
            }
        });
    }

    const subscription = formMethods.watch(async (value, { name, type }) => {
      const form = formMethods; 

      // ➤ LOGIC A: Mutual Exclusivity
      if (name === "start_pump" && value.start_pump) {
        form.setValue("stop_pump", 0); 
        fetchPumps("Stopped");
      }
      if (name === "stop_pump" && value.stop_pump) {
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
  }, [formMethods, apiKey, apiSecret]);


  /* -------------------------------------------------
     3. FORM DEFINITION (ALIGNED)
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    const getValue = (field: string, def: any = undefined) => duplicateData?.[field] ?? def;
    
    // 🟢 Get Cookie User for Default Value (Runs on Render)
    const cookieUser = getCookie("user_id");
    // Fallback to localStorage if cookie is not available
    const localStorageUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
    const userForDefault = cookieUser || localStorageUser;
    console.log("🔍 Debug - Form definition user sources:", { cookieUser, localStorageUser, userForDefault, userFullName });

    return [
      {
        name: "Details",
        fields: [
          // ── SECTION 2: MODE ────────────────────────────────────────────────
          { 
            name: "sec_mode", 
            label: "Operation Mode", 
            type: "Section Break" 
          },
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
          { name: "cb_mode", label: "", type: "Column Break" },  

          // ── SECTION 1: CONTEXT ─────────────────────────────────────────────
          {
             name: "sec_location", 
             label: "Location & Date", 
             type: "Section Break" 
          },
          {
            name: "entry_date",
            label: "Entry Date",
            type: "Date",
            defaultValue: getValue("entry_date", new Date().toISOString().split('T')[0]),
          },
          {
            name: "lis_name",
            label: "LIS Name",
            type: "Link",
            linkTarget: "Lift Irrigation Scheme",
            defaultValue: getValue("lis_name"),
            required: true
          },
          {
            name: "stage",
            label: "Stage",
            type: "Link",
            linkTarget: "Stage No",
            defaultValue: getValue("stage"),
            required: true,
            filterMapping: [{ sourceField: "lis_name", targetField: "lis_name" }],
          }, 
          

          // ── SECTION 3: OPERATION DETAILS ──────────────────────────────────
          { 
            name: "sec_details", 
            label: "Operation Details", 
            type: "Section Break",
            displayDependsOn: "start_pump == 1 || stop_pump == 1"
          },

          // ➤ START MODE DETAILS
          {
            name: "start_datetime",
            label: "Start Datetime",
            type: "DateTime",
            defaultValue: getValue("start_datetime"),
            displayDependsOn: "start_pump == 1"
          },
          {
            name: "operator_id",
            label: "Operator ID",
            type: "Read Only",
            linkTarget: "User",
            // 🟢 Default set from Cookie or localStorage
            defaultValue: getValue("operator_id", userForDefault),
            readOnly: true,
            displayDependsOn: "start_pump == 1"
          },
          {
            name: "operator_name",
            label: "Operator Name",
            type: "Read Only",
            defaultValue: getValue("operator_name", userFullName),
            readOnly: true,
            displayDependsOn: "start_pump == 1",
            fetchFrom: {
              sourceField: "operator_id",
              targetDoctype: "User",
              targetField: "full_name"
            }
          },

          // ➤ STOP MODE DETAILS
          {
            name: "stop_datetime",
            label: "Stop Datetime",
            type: "DateTime",
            defaultValue: getValue("stop_datetime"),
            displayDependsOn: "stop_pump == 1" 
          },
          {
            name: "pump_stop_reason",
            label: "Pump Stop Reason",
            type: "Link",
            linkTarget: "Pump Stop Reasons",
            defaultValue: getValue("pump_stop_reason"),
            displayDependsOn: "stop_pump == 1"
          },
          {
            name: "specify",
            label: "Specify (if Other)",
            type: "Small Text",
            defaultValue: getValue("specify"),
            displayDependsOn: "pump_stop_reason == 'Other'" 
          },

          // {
          //   name: "lis_name",
          //   label: "LIS Name",
          //   type: "Link",
          //   linkTarget: "Lift Irrigation Scheme",
          //   defaultValue: getValue("lis_name"),
          // },
          // {
          //   name: "stage",
          //   label: "Stage",
          //   type: "Link",
          //   linkTarget: "Stage No",
          //   defaultValue: getValue("stage"),
          //   filterMapping: [
          //     { sourceField: "lis_name", targetField: "lis_name" }
          //   ],
          // },
          {
            name: "operator_id_1",
            label: "Operator ID",
            type: "Read Only",
            linkTarget: "User",
            // 🟢 Default set from Cookie or localStorage
            defaultValue: getValue("operator_id_1", userForDefault),
            displayDependsOn: "stop_pump == 1"
          },
          {
            name: "operator_name_1",
            label: "Operator Name",
            type: "Read Only",
            defaultValue: getValue("operator_name_1", userFullName),

            displayDependsOn: "stop_pump == 1",
            // fetchFrom: {
            //   sourceField: "operator_id_1",
            //   targetDoctype: "User",
            //   targetField: "full_name"
            // }
          },

          // ── SECTION 4: TABLES ──────────────────────────────────────────────
          { 
            name: "sec_assets", 
            label: "Asset Selection", 
            type: "Section Break",
            displayDependsOn: "start_pump == 1 || stop_pump == 1"
          },
          {
            name: "primary_list",
            label: "Available Pumps (Select to Act)",
            type: "Table",
            displayDependsOn: "start_pump == 1 || stop_pump == 1",
            defaultValue: getValue("primary_list", []),
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
            label: "Selected for Update (System Auto-Fill)",
            type: "Table",
            displayDependsOn: "start_pump == 1 || stop_pump == 1",
            defaultValue: getValue("secondary_list", []),
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Data" },
            ],
          },
          
        ],
      },
    ];
  }, [duplicateData, userFullName]);

  /* -------------------------------------------------
     4. SUBMIT
  ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!data.start_pump && !data.stop_pump) {
      toast.error("Please select either Start Pump or Stop Pump");
      return;
    }
    if (!data.secondary_list || data.secondary_list.length === 0) {
      toast.error("Please select at least one pump from the list");
      return;
    }

    // Validate required datetime based on pump selection
    if (data.start_pump && !data.start_datetime) {
      toast.error("Start Datetime is required");
      return;
    }
    if (data.stop_pump && !data.stop_datetime) {
      toast.error("Stop Datetime is required");
      return;
    }

    setIsSaving(true);

    try {
      const payload: Record<string, any> = { ...data };
      payload.doctype = doctypeName;
      
      // Only include relevant datetime fields based on pump selection
      if (data.start_pump) {
        // Start mode - include start_datetime, exclude stop_datetime
        delete payload.stop_datetime;
        delete payload.pump_stop_reason;
        delete payload.specify;
        delete payload.operator_id_1;
        delete payload.operator_name_1;
      } else {
        // Stop mode - include stop_datetime, exclude start_datetime
        delete payload.start_datetime;
        delete payload.operator_id;
        delete payload.operator_name;
      }
      
      if (Array.isArray(payload.primary_list)) {
        payload.primary_list = payload.primary_list.map((row: any) => ({
          ...row,
          check: row.check ? 1 : 0,
        }));
      }

      const response = await axios.post(`${API_BASE_URL}/${doctypeName}`, payload, {
        headers: { Authorization: `token ${apiKey}:${apiSecret}` }
      });

      toast.success("Logbook created successfully!");
      
      // Use the created record's ID to redirect to detail page
      const logbookId = response.data.data.name;
      router.push(`/operations/doctype/logbook/${encodeURIComponent(logbookId)}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.exception || err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      title="New Logbook"
      description="Record pump operations"
      submitLabel={isSaving ? "Saving..." : "Create"}
      onFormInit={setFormMethods}
    />
  );
}