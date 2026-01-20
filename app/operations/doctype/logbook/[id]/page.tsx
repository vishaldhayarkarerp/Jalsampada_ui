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
import { getApiMessages } from "@/lib/utils";

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
  status?: string; // Field that holds "Running" or "Stopped"
  start_pump?: 0 | 1;
  stop_pump?: 0 | 1;
  start_datetime?: string;
  operator_id?: string;
  operator_name?: string;
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
  const [formMethods, setFormMethods] = React.useState<UseFormReturn<any> | null>(null);

  // 🟢 Badge Status Logic
  const getCurrentStatus = () => {
    if (!logbook) return "";

    // 1. If Cancelled
    if (logbook.docstatus === 2) return "Cancelled";

    // 2. If Submitted (Show Operational Status)
    if (logbook.docstatus === 1) {
      return logbook.status || "Submitted";
    }

    // 3. If Draft (docstatus === 0)
    if (logbook.docstatus === 0) {
      // Check if form has unsaved changes
      if (formMethods?.formState.isDirty) {
        return "Not Saved";
      }
      return "Draft";
    }

    return "";
  };

  // 🟢 HELPERS
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

  const fetchUserFullName = async (userId: string): Promise<string | null> => {
    if (!userId || !apiKey || !apiSecret) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/User/${userId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `token ${apiKey}:${apiSecret}`,
        },
      });
      const data = await response.json();
      return data.data?.full_name || null;
    } catch (error) {
      return null;
    }
  };

  React.useEffect(() => {
    const getUserAndFullName = async () => {
      const cookieUser = getCookie("user_id");
      const localStorageUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
      const userId = cookieUser || localStorageUser;
      if (userId && !userFullName) {
        const fullName = await fetchUserFullName(userId);
        if (fullName) setUserFullName(fullName);
      }
    };
    getUserAndFullName();
  }, [userFullName]);

  // 🟢 1. FETCH RECORD
  const fetchRecord = async () => {
    if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) return;
    try {
      setLoading(true);
      const resp = await axios.get(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, {
        headers: { Authorization: `token ${apiKey}:${apiSecret}` },
      });
      setLogbook(resp.data.data);
    } catch (err: any) {
      setError("Failed to load Logbook record.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchRecord(); }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  // 🟢 SUBMIT DOCUMENT
  const handleSubmitDocument = async () => {
    setIsSaving(true);
    try {
      const resp = await axios.put(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, {
        docstatus: 1
      }, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      const messages = getApiMessages(resp, null, "Document submitted successfully!", "Failed to submit document");
      if (messages.success) {
        toast.success(messages.message);
        setLogbook(resp.data.data);
      } else {
        toast.error(messages.message, { description: messages.description });
      }
    } catch (err: any) {
      const messages = getApiMessages(null, err, null, "Failed to submit document");
      toast.error(messages.message, { description: messages.description });
    } finally {
      setIsSaving(false);
    }
  };

  // 🟢 CANCEL DOCUMENT
  const handleCancelDocument = async () => {
    setIsSaving(true);
    try {
      const resp = await axios.put(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, {
        docstatus: 2
      }, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      const messages = getApiMessages(resp, null, "Document cancelled successfully!", "Failed to cancel document");
      if (messages.success) {
        toast.success(messages.message);
        setLogbook(resp.data.data);
      } else {
        toast.error(messages.message, { description: messages.description });
      }
    } catch (err: any) {
      const messages = getApiMessages(null, err, null, "Failed to cancel document");
      toast.error(messages.message, { description: messages.description });
    } finally {
      setIsSaving(false);
    }
  };

  // 🟢 AUTOMATION LOGIC
  React.useEffect(() => {
    if (!formMethods || !apiKey || !apiSecret || !logbook) return;

    const subscription = formMethods.watch(async (value, { name }) => {
      const form = formMethods;
      const startPump = form.getValues("start_pump");
      const stopPump = form.getValues("stop_pump");

      if (startPump && stopPump) {
        if (name === "start_pump") {
          form.setValue("stop_pump", 0);
          fetchPumps("Stopped");
        } else if (name === "stop_pump") {
          form.setValue("start_pump", 0);
          fetchPumps("Running");
        }
      } else if (name === "start_pump" && value.start_pump) {
        form.setValue("stop_pump", 0);
        fetchPumps("Stopped");
      } else if (name === "stop_pump" && value.stop_pump) {
        form.setValue("start_pump", 0);
        fetchPumps("Running");
      }

      if (name === "lis_name" || name === "stage") {
        const isStart = form.getValues("start_pump");
        const isStop = form.getValues("stop_pump");
        if (isStart) fetchPumps("Stopped");
        else if (isStop) fetchPumps("Running");
      }

      if (name && name.startsWith("primary_list")) {
        syncPrimaryToSecondary();
      }
    });

    const fetchPumps = async (status: "Running" | "Stopped") => {
      const values = formMethods.getValues();
      if (!values.lis_name || !values.stage) return;
      try {
        const resp = await axios.get(`${API_METHOD_URL}/quantlis_management.operations.doctype.logbook.logbook.get_primary_list_with_motor`, {
          params: { lis_name: values.lis_name, stage: values.stage, status: status },
          headers: { Authorization: `token ${apiKey}:${apiSecret}` }
        });
        const tableData = (resp.data.message || []).map((p: any) => ({
          pump: p.pump, pump_no: p.pump_no, motor: p.motor, motor_no: p.motor_no, check: 0
        }));
        formMethods.setValue("primary_list", tableData);
        formMethods.setValue("secondary_list", []);
      } catch (error) {
        toast.error("Failed to load pump list");
      }
    };

    const syncPrimaryToSecondary = () => {
      const primaryList = formMethods.getValues("primary_list") || [];
      const newSecondaryList = primaryList
        .filter((row: any) => row.check === 1 || row.check === true)
        .map((row: any) => ({ pump: row.pump, pump_no: row.pump_no, motor: row.motor }));
      formMethods.setValue("secondary_list", newSecondaryList);
    };
    return () => subscription.unsubscribe();
  }, [formMethods, apiKey, apiSecret, logbook]);

  // 🟢 FORM DEFINITION
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!logbook) return [];
    const getVal = (key: keyof LogbookData, def?: any) => logbook[key] ?? def;
    return [
      {
        name: "Details",
        fields: [
          { name: "sec_mode", label: "Operation Mode", type: "Section Break" },
          { name: "start_pump", label: "Start Pump", type: "Check", defaultValue: getVal("start_pump", 0) },
          { name: "stop_pump", label: "Stop Pump", type: "Check", defaultValue: getVal("stop_pump", 0) },
          { name: "cb_mode", label: "", type: "Column Break" },
          { name: "sec_location", label: "Location & Date", type: "Section Break" },
          { name: "entry_date", label: "Entry Date", type: "Date", defaultValue: getVal("entry_date") },
          { name: "lis_name", label: "LIS Name", type: "Link", linkTarget: "Lift Irrigation Scheme", defaultValue: getVal("lis_name"), required: true },
          { name: "stage", label: "Stage", type: "Link", linkTarget: "Stage No", defaultValue: getVal("stage"), required: true, filterMapping: [{ sourceField: "lis_name", targetField: "lis_name" }] },
          { name: "sec_details", label: "Operation Details", type: "Section Break" },
          { name: "start_datetime", label: "Start Datetime", type: "DateTime", defaultValue: getVal("start_datetime"), displayDependsOn: "start_pump == 1" },
          { name: "operator_id", label: "Operator ID", type: "Read Only", linkTarget: "User", defaultValue: getVal("operator_id"), readOnly: true, displayDependsOn: "start_pump == 1" },
          { name: "operator_name", label: "Operator Name", type: "Read Only", defaultValue: getVal("operator_name") || userFullName, readOnly: true, displayDependsOn: "start_pump == 1" },
          { name: "stop_datetime", label: "Stop Datetime", type: "DateTime", defaultValue: getVal("stop_datetime"), displayDependsOn: "stop_pump == 1" },
          { name: "pump_stop_reason", label: "Reason", type: "Link", linkTarget: "Pump Stop Reasons", defaultValue: getVal("pump_stop_reason"), displayDependsOn: "stop_pump == 1" },
          { name: "specify", label: "Specify (if Other)", type: "Small Text", defaultValue: getVal("specify"), displayDependsOn: "pump_stop_reason == 'Other'" },
          { name: "operator_id_1", label: "Operator ID", type: "Read Only", linkTarget: "User", defaultValue: getVal("operator_id_1"), readOnly: true, displayDependsOn: "stop_pump == 1" },
          { name: "operator_name_1", label: "Operator Name", type: "Read Only", defaultValue: getVal("operator_name_1") || userFullName, readOnly: true, displayDependsOn: "stop_pump == 1" },
          { name: "sec_assets", label: "Asset Selection", type: "Section Break" },
          {
            name: "primary_list", label: "Available Pumps", type: "Table", defaultValue: getVal("primary_list", []),
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "motor", label: "Motor", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Data" },
              { name: "motor_no", label: "Motor No", type: "Data" },
              { name: "check", label: "Select", type: "Check" },
            ],
          },
          {
            name: "secondary_list", label: "Selected for Update", type: "Table", defaultValue: getVal("secondary_list", []),
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Data" },
            ],
          },
        ],
      }
    ];
  }, [logbook, userFullName]);

  // 🟢 UPDATE DRAFT HANDLER
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) { toast.info("No changes to save."); return; }
    setIsSaving(true);
    try {
      const payload = { ...data, modified: logbook?.modified, docstatus: logbook?.docstatus };
      await axios.put(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, payload, {
        headers: { Authorization: `token ${apiKey}:${apiSecret}` },
      });
      toast.success("Logbook updated successfully!");
      fetchRecord();
    } catch (err: any) {
      toast.error("Failed to update record");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Logbook...</div>;
  if (!logbook) return <div className="p-8 text-center">Record not found.</div>;

  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={() => router.push('/operations/doctype/logbook')}
      onSubmitDocument={handleSubmitDocument}
      onCancelDocument={handleCancelDocument}
      title={`${DOCTYPE_NAME}: ${logbook.name}`}
      description={`Record ID: ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save Changes"}
      isSubmittable={true}
      docstatus={logbook.docstatus}
      initialStatus={getCurrentStatus()} // <--- Added Dynamic Status Badge logic
      onFormInit={setFormMethods}
      deleteConfig={{
        doctypeName: DOCTYPE_NAME,
        docName: docname,
        redirectUrl: "/operations/doctype/logbook"
      }}
    />
  );
}