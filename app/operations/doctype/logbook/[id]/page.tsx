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
  const [formMethods, setFormMethods] = React.useState<UseFormReturn<any> | null>(null);

  // State for dynamic table label
  const [primaryListLabel, setPrimaryListLabel] = React.useState("Available Pumps");

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

      // ➤ LOGIC A: Handle Radio Button Selection
      if (name === "pump_operation") {
        if (value.pump_operation === "start") {
          setPrimaryListLabel("Stopped Pumps (Select to Start)");
          fetchPumps("Stopped");
          // Set status to "Running" for start operation
          form.setValue("status", "Running");
        } else if (value.pump_operation === "stop") {
          setPrimaryListLabel("Running Pumps (Select to Stop)");
          fetchPumps("Running");
          // Set status to "Stopped" for stop operation
          form.setValue("status", "Stopped");
        }
      }

      // ➤ LOGIC B: Fetch Pumps on Context Change
      if (name === "lis_name" || name === "stage") {
        const operation = form.getValues("pump_operation");
        if (operation === "start") fetchPumps("Stopped");
        else if (operation === "stop") fetchPumps("Running");
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
    const getVal = (key: string, def?: any) => {
      if (key === 'pump_operation') {
        // Convert start_pump/stop_pump back to pump_operation for UI
        if (logbook.start_pump === 1) return 'start';
        if (logbook.stop_pump === 1) return 'stop';
        return '';
      }
      return logbook[key as keyof LogbookData] ?? def;
    };
    return [
      {
        name: "Details",
        fields: [
          {
            name: "pump_operation",
            label: "Operation",
            type: "Radio",
            options: [
              { label: "Start Pump", value: "start", className: "text-green-600" },
              { label: "Stop Pump", value: "stop", className: "text-red-600" }
            ],
            defaultValue: getVal("pump_operation", ""),
          },
          { name: "cb_mode", label: "", type: "Column Break" },
          { name: "sec_location", label: "Location & Date", type: "Section Break" },
          { name: "entry_date", label: "Entry Date", type: "Date", defaultValue: getVal("entry_date") },
          { name: "lis_name", label: "LIS Name", type: "Link", linkTarget: "Lift Irrigation Scheme", defaultValue: getVal("lis_name"), required: true },
          { name: "stage", label: "Stage", type: "Link", linkTarget: "Stage No", defaultValue: getVal("stage"), required: true, filterMapping: [{ sourceField: "lis_name", targetField: "lis_name" }] },
          { name: "sec_details", label: "Operation Details", type: "Section Break" },
          { name: "start_datetime", label: "Start Datetime", type: "DateTime", defaultValue: getVal("start_datetime"), required: true, displayDependsOn: "pump_operation == 'start'" },
          { name: "operator_id", label: "Operator ID", type: "Read Only", linkTarget: "User", defaultValue: getVal("operator_id"), readOnly: true, displayDependsOn: "pump_operation == 'start'" },
          { name: "operator_name", label: "Operator Name", type: "Read Only", defaultValue: getVal("operator_name"), readOnly: true, displayDependsOn: "pump_operation == 'start'" },
          { name: "stop_datetime", label: "Stop Datetime", type: "DateTime", defaultValue: getVal("stop_datetime"), required: true, displayDependsOn: "pump_operation == 'stop'" },
          { name: "pump_stop_reason", label: "Reason", type: "Link", linkTarget: "Pump Stop Reasons", defaultValue: getVal("pump_stop_reason"), displayDependsOn: "pump_operation == 'stop'" },
          { name: "specify", label: "Specify (if Other)", type: "Small Text", defaultValue: getVal("specify"), displayDependsOn: "pump_stop_reason == 'Other'" },
          { name: "operator_id_1", label: "Operator ID", type: "Read Only", linkTarget: "User", defaultValue: getVal("operator_id_1"), readOnly: true, displayDependsOn: "pump_operation == 'stop'" },
          { name: "operator_name_1", label: "Operator Name", type: "Read Only", defaultValue: getVal("operator_name_1"), readOnly: true, displayDependsOn: "pump_operation == 'stop'" },
          {
            name: "status",
            label: "Status",
            type: "Read Only",
            readOnly: true,
            defaultValue: getVal("status"),
            displayDependsOn: "pump_operation == 'start' || pump_operation == 'stop'"
          },
          { name: "sec_assets", label: "Asset Selection", type: "Section Break" },
          {
            name: "primary_list", label: primaryListLabel, type: "Table", defaultValue: getVal("primary_list", []),
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
  }, [logbook, primaryListLabel]);

  // 🟢 UPDATE DRAFT HANDLER
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) { toast.info("No changes to save."); return; }

    if (!data.pump_operation) {
      toast.error("Please select either Start Pump or Stop Pump");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = { ...data, modified: logbook?.modified, docstatus: logbook?.docstatus };

      // Transform radio value back to checkbox format for API
      if (data.pump_operation === "start") {
        payload.start_pump = 1;
        payload.stop_pump = 0;
        delete payload.stop_datetime;
        delete payload.pump_stop_reason;
        delete payload.specify;
        delete payload.operator_id_1;
        delete payload.operator_name_1;
      } else {
        payload.start_pump = 0;
        payload.stop_pump = 1;
        delete payload.start_datetime;
        delete payload.operator_id;
        delete payload.operator_name;
      }

      // Remove the radio field as API doesn't expect it
      delete payload.pump_operation;

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