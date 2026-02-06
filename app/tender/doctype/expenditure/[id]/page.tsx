"use client";

import * as React from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import {
  DynamicForm,
  TabbedLayout,
  FormField,
} from "@/components/DynamicFormComponent";
import { getApiMessages } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  fetchWorkNameByTenderNumber,
  updateWorkNameInTableRows,
  clearWorkNameInTableRows,
  fetchPreviousBillDetails // 🟢 Added back
} from "../services";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

/* -------------------------------------------------
1. Expenditure type – mirrors the API exactly
------------------------------------------------- */

interface ExpenditureDetailsRow {
  name_of_work?: string;          // Small Text
  stage?: string;                 // Link -> Stage No
  work_type?: string;             // Link -> Work Type
  asset?: string;                 // Link -> Asset
  work_subtype?: string;          // Link -> Work Subtype
  asset_name?: string;            // Data
  bill_amount?: number;           // Currency (Expenditure Amount)
  have_asset?: 0 | 1;             // Check
  asset_no?: string;              // Data
  from_date?: string;             // Date
  attach?: string | File;         // Attach
  to_date?: string;               // Date
  invoice_number?: string;        // Data
  expenditure_date?: string;      // Date (Invoice Date)
  remarks?: string;               // Text (Work Details)
}

interface ExpenditureData {
  name: string;

  fiscal_year?: string;             // Link -> Fiscal Year
  prev_bill_no?: string;            // Data
  bill_upto?: number;               // Currency
  tender_number?: string;           // Link -> Project
  bill_number?: string;             // Data
  remaining_amount?: number;        // Currency
  tender_amount?: number;           // Currency
  prev_bill_amt?: number;           // Currency
  bill_type?: string;               // Select
  posting_date?: string;            // Date
  bill_amount?: number;             // Currency
  
  // 🟢 Corrected Field Names (From our fix)
  previous_page_no?: string;        // Data (Previous)
  previous_mb_no?: string;          // Data (Previous)
  
  page_no?: string;                 // Data (Current)
  mb_no?: string;                   // Data (Current)

  lift_irrigation_scheme?: string;  // Link -> Lift Irrigation Scheme
  stage?: string[];                 // Table MultiSelect -> Stage Multiselect
  expenditure_details?: ExpenditureDetailsRow[]; // Table -> Expenditure Details
  saved_amount?: number;            // Currency
  work_description?: string;        // Text

  docstatus: 0 | 1 | 2;
  modified: string;
}

/**
 * Uploads a single file to Frappe's 'upload_file' method
 */
async function uploadFile(
  file: File,
  apiKey: string,
  apiSecret: string,
  methodUrl: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("is_private", "0"); // 0 = Public, 1 = Private

  try {
    const resp = await axios.post(
      `${methodUrl.replace("/api/resource", "")}/api/method/upload_file`,
      formData,
      {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
        },
        withCredentials: true,
      }
    );

    if (resp.data && resp.data.message) {
      return resp.data.message.file_url;
    } else {
      throw new Error("Invalid response from file upload");
    }
  } catch (err) {
    console.error("File upload failed:", err);
    throw err;
  }
}

/* -------------------------------------------------
2. Page component
------------------------------------------------- */

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Expenditure";

  const [expenditure, setExpenditure] = React.useState<ExpenditureData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // 🟢 Colleague's State Logic
  const isProgrammaticUpdate = React.useRef(false);
  const [formVersion, setFormVersion] = React.useState(0);
  type FormSaveState = "CLEAN" | "DIRTY";
  const [formSaveState, setFormSaveState] = React.useState<FormSaveState>("CLEAN");

  // State for work name default value
  const [workName, setWorkName] = React.useState<string>("");
  const [formInstance, setFormInstance] = React.useState<any>(null);
  const [billType, setBillType] = React.useState<string>("");

  /* -------------------------------------------------
  3. FETCH DOCUMENT
  ------------------------------------------------- */

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
          `${API_BASE_URL}/${doctypeName}/${docname}`,
          {
            headers: {
              Authorization: `token ${apiKey}:${apiSecret}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          }
        );

        setExpenditure(resp.data.data as ExpenditureData);
      } catch (err: any) {
        console.error("API Error:", err);
        const messages = getApiMessages(null, err, "Loaded", "Failed", (e)=> e.response?.data?.exception || "Error");
        setError(messages.description || messages.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  // 🟢 OUR FIX: INITIAL FETCH FOR PREVIOUS DETAILS (If missing in current doc)
  React.useEffect(() => {
    if (!formInstance || !expenditure?.tender_number) return;

    const currentPrevMB = formInstance.getValues("previous_mb_no");
    
    if (!currentPrevMB) {
        const fetchInitialPrevDetails = async () => {
             if (!apiKey || !apiSecret) return;
             try {
                 const prevDetails = await fetchPreviousBillDetails(
                    expenditure.tender_number!, 
                    docname,
                    apiKey, 
                    apiSecret
                 );
                 if (prevDetails) {
                    isProgrammaticUpdate.current = true; // Don't mark as dirty for initial load
                    
                    formInstance.setValue("prev_bill_no", prevDetails.bill_number || 0);
                    formInstance.setValue("prev_bill_amt", prevDetails.bill_amount || 0);
                    // Map 'mb_no' from old record -> 'previous_mb_no'
                    formInstance.setValue("previous_mb_no", prevDetails.mb_no || 0);
                    // Map 'page_no' from old record -> 'previous_page_no'
                    formInstance.setValue("previous_page_no", prevDetails.page_no || 0);
                    
                    setTimeout(() => { isProgrammaticUpdate.current = false; }, 100);
                 }
             } catch(e) { console.error(e); }
        };
        fetchInitialPrevDetails();
    }
  }, [formInstance, expenditure, docname, apiKey, apiSecret]);

  // 🟢 OUR FIX: WATCHER WITH FETCH LOGIC
  React.useEffect(() => {
    if (!formInstance) return;

    const subscription = formInstance.watch(async (value: any, { name }: { name?: string }) => {
      if (name === "tender_number" && value.tender_number) {
        if (!apiKey || !apiSecret) return;

        // 1. Fetch Work Name
        const fetchWorkName = async () => {
          try {
            const fetchedWorkName = await fetchWorkNameByTenderNumber(value.tender_number, apiKey, apiSecret);
            if (fetchedWorkName) {
              updateWorkNameInTableRows(formInstance, fetchedWorkName);
              setWorkName(fetchedWorkName);
            } else {
              clearWorkNameInTableRows(formInstance);
              setWorkName("");
            }
          } catch (error) { console.error("Failed to fetch work_name:", error); }
        };

        // 2. Fetch Previous Bill Details
        const fetchPreviousBill = async () => {
          try {
            const prevDetails = await fetchPreviousBillDetails(
              value.tender_number, 
              docname || null,
              apiKey, 
              apiSecret
            );

            if (prevDetails) {
              formInstance.setValue("prev_bill_no", prevDetails.bill_number || 0);
              formInstance.setValue("prev_bill_amt", prevDetails.bill_amount || 0);
              // Correct Mapping
              formInstance.setValue("previous_mb_no", prevDetails.mb_no || 0);
              formInstance.setValue("previous_page_no", prevDetails.page_no || 0);
            } else {
              formInstance.setValue("prev_bill_no", 0);
              formInstance.setValue("prev_bill_amt", 0);
              formInstance.setValue("previous_mb_no", 0);
              formInstance.setValue("previous_page_no", 0);
            }
          } catch (err) { console.error("Error setting previous bill details", err); }
        };

        await Promise.all([fetchWorkName(), fetchPreviousBill()]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [formInstance, apiKey, apiSecret, docname]);

  // 🟢 COLLEAGUE'S STATE LOGIC
  React.useEffect(() => {
    if (expenditure && expenditure.docstatus === 0) {
      setFormSaveState("CLEAN");
    }
  }, [expenditure]);

  const handleFormInit = React.useCallback((form: any) => {
    setFormInstance(form);
    let previousBillType: string | undefined;

    const initialBillType = form.getValues('bill_type');
    const initialPrevBillNo = form.getValues('prev_bill_no');
    setBillType(initialBillType);

    form.watch((value: any, { name }: { name?: string }) => {
      if (name === "bill_type") setBillType(value.bill_type);
    });
   
    if (initialBillType === 'Running' && initialPrevBillNo && typeof initialPrevBillNo === 'string' && /ra/i.test(initialPrevBillNo)) {
      previousBillType = 'Select Type';
    } else if (initialBillType && initialBillType !== 'Running') {
      previousBillType = initialBillType;
    } else {
      previousBillType = 'Select Type';
    }

    form.watch((value: any, { name }: { name?: string }) => {
      if (name === 'prev_bill_no' || name === undefined) {
        const prevBillNo = form.getValues('prev_bill_no');
        const currentBillType = form.getValues('bill_type');

        if (prevBillNo && typeof prevBillNo === 'string' && /ra/i.test(prevBillNo)) {
          if (currentBillType !== 'Running') {
            if (currentBillType && currentBillType !== 'Running') previousBillType = currentBillType;
            form.setValue('bill_type', 'Running', { shouldDirty: true });
          }
        } else {
          if (!prevBillNo || (typeof prevBillNo === 'string' && !/ra/i.test(prevBillNo))) {
            if (currentBillType === 'Running' && previousBillType) {
              form.setValue('bill_type', previousBillType, { shouldDirty: true });
            } else if (!prevBillNo && currentBillType === 'Running' && !previousBillType) {
              form.setValue('bill_type', 'Select Type', { shouldDirty: true });
            }
          }
        }
      }
    });

    // 🟢 Dirty State Watcher
    form.watch((_value: any, { name }: { name?: string }) => {
      if (!name) return;
      if (isProgrammaticUpdate.current) return;
      setFormSaveState("DIRTY");
    });
  }, []);

  const getAllowedStages = React.useCallback((formData: Record<string, any>): string[] => {
    const parentStage = formData.stage;
    if (!parentStage || !Array.isArray(parentStage)) return [];
    return parentStage.map((item: any) => item.stage).filter(Boolean);
  }, []);

  // 🟢 OUR FIELDS (With Correct Names)
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!expenditure) return [];

    const fields = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        defaultValue:
          f.name in expenditure
            ? // @ts-ignore
            expenditure[f.name as keyof ExpenditureData]
            : f.defaultValue,
      }));

    return [
      {
        name: "Details",
        fields: fields([
          { name: "fiscal_year", label: "Fiscal Year", type: "Link", linkTarget: "Fiscal Year", required: true },
          { name: "cb1", label: "", type: "Section Break" },
          { name: "posting_date", label: "Bill Date", type: "Date", fieldColumns: 1 },
          {
            name: "tender_number", label: "Tender Number", type: "Link", required: true, linkTarget: "Project", fieldColumns: 1,
            filterMapping: [{ sourceField: "custom_fiscal_year", targetField: "fiscal_year" }]
          },
          {
            name: "tender_amount", label: "Tender Amount", type: "Currency", fieldColumns: 1, precision: 2,
            fetchFrom: { sourceField: "tender_number", targetDoctype: "Project", targetField: "custom_tender_amount" }
          },
          {
            name: "lift_irrigation_scheme", label: "Lift Irrigation Scheme", type: "Link", linkTarget: "Lift Irrigation Scheme", required: true, fieldColumns: 1,
            fetchFrom: { sourceField: "tender_number", targetDoctype: "Project", targetField: "custom_lis_name" }
          },
          { name: "prev_bill_no", label: "Previous Bill Number", type: "Data", defaultValue: 0, fieldColumns: 1 },
          { name: "prev_bill_amt", label: "Previous Bill Amount", type: "Currency", precision: 2, defaultValue: "0.00", fieldColumns: 1 },
          
          // 🟢 Corrected Name: previous_mb_no
          { name: "previous_mb_no", label: "Previous MB No", type: "Data", defaultValue: 0, fieldColumns: 1 },
          // 🟢 Corrected Name: previous_page_no
          { name: "previous_page_no", label: "Previous Page No", type: "Data", defaultValue: 0, fieldColumns: 1 },

          { name: "bill_number", label: "Bill Number", type: "Data", defaultValue: "0.00", fieldColumns: 1 },
          { name: "bill_amount", label: "Bill Amount", type: "Currency", required: true, precision: 2, defaultValue: "0.00", fieldColumns: 1 },
          
          // 🟢 CURRENT MB/Page (using standard names)
          { name: "mb_no", label: "MB No", type: "Data", defaultValue: 0, fieldColumns: 1 },
          { name: "page_no", label: "Page No", type: "Data", defaultValue: 0, fieldColumns: 1 },

          { name: "bill_upto", label: "Bill Upto Amount", type: "Currency", precision: 2, defaultValue: "0.00" },
          { name: "remaining_amount", label: "Bill Remaining Amount", type: "Currency", precision: 2 },
          {
            name: "bill_type", label: "Bill Type", type: "Select",
            options: [{ label: "Running", value: "Running" }, { label: "Final", value: "Final" }]
          },
          {
            name: "stage", label: "Stage/ Sub Scheme", type: "Table MultiSelect", linkTarget: "Stage No",
            filterMapping: [{ sourceField: "lift_irrigation_scheme", targetField: "lis_name" }],
            fetchFrom: { sourceField: "tender_number", targetDoctype: "Project", targetField: "custom_stage" }
          },
          {
            name: "expenditure_details", label: "Expenditure Details", type: "Table", showDownloadUpload: true,
            columns: [
              { name: "name_of_work", label: "Name of Work", type: "Read Only", defaultValue: workName },
              {
                name: "stage", label: "Stage", type: "Link", linkTarget: "Stage No",
                filters: (getValues: (name: string) => any) => {
                  const parentStage = getValues("parent.stage");
                  const allowedStages = getAllowedStages({ stage: parentStage });
                  if (!allowedStages || allowedStages.length === 0) return { name: ["in", []] };
                  return { name: ["in", allowedStages] };
                }
              },
              { name: "section_interchange", label: "", type: "Section Break" },
              { name: "work_type", label: "Work Type", type: "Link", linkTarget: "Work Type" },
              {
                name: "work_subtype", label: "Work Subtype", type: "Link", linkTarget: "Work Subtype",
                filterMapping: [{ sourceField: "work_type", targetField: "work_type" }]
              },
              { name: "bill_amount", label: "Expenditure Amount", type: "Currency", precision: 2 },
              { name: "have_asset", label: "Have Asset", type: "Check", displayDependsOn: "work_type==Miscellaneous" },
              {
                name: "asset", label: "Asset", type: "Link", linkTarget: "Asset",
                displayDependsOn: "work_type==Repair || work_type==Auxilary || have_asset==1"
              },
              {
                name: "asset_name", label: "Asset Name", type: "Data", displayDependsOn: "work_type==Repair || work_type==Auxilary || have_asset==1",
                fetchFrom: { sourceField: "asset", targetDoctype: "Asset", targetField: "asset_name" }
              },
              {
                name: "asset_no", label: "Asset No", type: "Data", displayDependsOn: "work_type==Repair || work_type==Auxilary || have_asset==1",
                fetchFrom: { sourceField: "asset", targetDoctype: "Asset", targetField: "custom_asset_no" }
              },
              { name: "from_date", label: "From Date", type: "Date", displayDependsOn: "work_type==Operation || work_type==Security" },
              { name: "to_date", label: "To Date", type: "Date", displayDependsOn: "work_type==Operation || work_type==Security" },
              { name: "tax_amount", label: "Tax Amount", type: "Currency", precision: 2 },
              { name: "invoice_number", label: "Invoice Number", type: "Data" },
              { name: "expenditure_date", label: "Invoice Date", type: "Date" },
              { name: "remarks", label: "Work Details", type: "Text" },
              { name: "attach", label: "Attach", type: "Attach" },
              { name: "cb", label: "Column Break", type: "Column Break" },
              { name: "job_carried_out", label: "Job Carried Out", type: "Long Text", displayDependsOn: "work_type==Repair" },
              { name: "spare_replaced", label: "Spare Replaced", type: "Long Text", displayDependsOn: "work_type==Repair" },
            ],
          },
          { name: "saved_amount", label: "Saved Amount", type: "Currency", precision: 2, displayDependsOn: { "bill_type": "Final" } },
          { name: "work_description", label: "Work Description", type: "Long Text" }
        ]),
      }
    ];
  }, [expenditure, workName]);

  /* -------------------------------------------------
  5. SUBMIT – with Validation & file uploading
  ------------------------------------------------- */

  const handleSubmit = async (data: Record<string, any>, isDirty: boolean): Promise<{ status?: string } | void> => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }

    // Validation
    const billAmount = Number(data.bill_amount) || 0;
    const tenderAmount = Number(data.tender_amount) || 0;
    const savedAmount = Number(data.saved_amount) || 0;

    // 🟢 Flag as programmatic so watch() doesn't mark dirty immediately
    isProgrammaticUpdate.current = true;

    if (billAmount > tenderAmount) {
      toast.error("Validation Failed", {
        description: "The Bill Amount cannot be greater than the Tender Amount.", duration: Infinity
      });
      return;
    }

    const details = data.expenditure_details || [];
    const totalChildBillAmt = details.reduce((sum: number, row: any) => sum + (Number(row.bill_amount) || 0), 0);
    const amtToBeMatched = savedAmount + totalChildBillAmt;

    if (billAmount !== amtToBeMatched) {
      const lowOrHigh = billAmount < amtToBeMatched ? "LOWER" : "HIGHER";
      toast.error("Mismatch detected in amounts", {
        description: `Calculated: ${amtToBeMatched}, Entered: ${billAmount}. Entered is ${lowOrHigh}.`, duration: Infinity
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload: Record<string, any> = JSON.parse(JSON.stringify(data));

      if (payload.expenditure_details && apiKey && apiSecret) {
        toast.info("Uploading attachments...");
        await Promise.all(
          payload.expenditure_details.map(async (row: any, index: number) => {
            const originalFile = data.expenditure_details?.[index]?.attach;
            if (originalFile instanceof File) {
               try {
                 const fileUrl = await uploadFile(originalFile, apiKey, apiSecret, API_BASE_URL.replace("/api/resource", ""));
                 row.attach = fileUrl;
               } catch (err) { throw new Error(`Failed to upload file in row ${index + 1}`); }
            }
          })
        );
      }

      // Cleanup Payload
      const allFields = formTabs.flatMap((tab) => tab.fields);
      const nonDataFields = new Set<string>();
      allFields.forEach((field) => {
        if (field.type === "Section Break" || field.type === "Column Break" || field.type === "Button" || field.type === "Read Only") {
          nonDataFields.add(field.name);
        }
      });

      const finalPayload: Record<string, any> = {};
      for (const key in payload) {
        if (!nonDataFields.has(key)) {
          finalPayload[key] = payload[key];
        }
      }

      if (!expenditure) {
        alert("Error: Record data not loaded. Cannot save.");
        setIsSaving(false);
        return;
      }

      finalPayload.modified = expenditure.modified;
      finalPayload.docstatus = expenditure.docstatus;

      // Conversions
      ["have_asset"].forEach((f) => { if (f in finalPayload) finalPayload[f] = finalPayload[f] ? 1 : 0; });
      ["bill_upto", "remaining_amount", "tender_amount", "prev_bill_amt", "bill_amount", "saved_amount"].forEach((f) => {
        if (f in finalPayload) finalPayload[f] = Number(finalPayload[f]) || 0;
      });

      if (Array.isArray(finalPayload.expenditure_details)) {
        finalPayload.expenditure_details = finalPayload.expenditure_details.map((row: any) => ({
          ...row,
          bill_amount: Number(row.bill_amount) || 0,
          have_asset: row.have_asset ? 1 : 0,
        }));
      }

      const resp = await axios.put(
        `${API_BASE_URL}/${doctypeName}/${docname}`,
        finalPayload,
        {
          headers: { Authorization: `token ${apiKey}:${apiSecret}`, "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const messages = getApiMessages(resp, null, "Changes saved!", "Failed to save");
      if (messages.success) toast.success(messages.message);
      else toast.error(messages.message, { description: messages.description, duration: Infinity });

      if (resp.data && resp.data.data) {
        isProgrammaticUpdate.current = true;
        setExpenditure(resp.data.data as ExpenditureData);
        setBillType(resp.data.data.bill_type);
        setFormSaveState("CLEAN");
        // 🟢 Force Form Remount (Colleague's Logic)
        setFormVersion((v) => v + 1);
        isProgrammaticUpdate.current = false;
      }

      const savedStatus = resp.data.data.docstatus === 0 ? "Draft" : resp.data.data.docstatus === 1 ? "Submitted" : "Cancelled";
      
      // Navigate and Reload to ensure fresh state
      router.push(`/tender/doctype/expenditure/${docname}`);
      window.location.reload(); 
      return { status: savedStatus };

    } catch (err: any) {
      console.error("Save error:", err);
      const messages = getApiMessages(null, err, "Saved", "Failed", (e)=> e.response?.data?.exception || "Error");
      toast.error(messages.message, { description: messages.description, duration: Infinity });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!apiKey || !apiSecret) {
      toast.error("Authentication required");
      return;
    }

    try {
      await axios.post(
        `http://103.219.1.138:4412/api/method/frappe.client.cancel`,
        { doctype: "Expenditure", name: docname },
        { headers: { Authorization: `token ${apiKey}:${apiSecret}`, "Content-Type": "application/json" } }
      );
      toast.success("Document cancelled successfully");
      setExpenditure((prev) => prev ? { ...prev, docstatus: 2 } : prev);
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel document");
    }
  };


  /* -------------------------------------------------
  6. UI STATES
  ------------------------------------------------- */

  if (loading) return <div>Loading expenditure details...</div>;
  if (error) return <div className="flex flex-col gap-2"><div>{error}</div><button className="border px-3 py-1 rounded" onClick={() => window.location.reload()}>Retry</button></div>;
  if (!expenditure) return <div>Expenditure not found.</div>;

  const handleSubmitDocument = async () => {
    if (!formInstance) return;
    isProgrammaticUpdate.current = true;
    const formData = formInstance.getValues();
    if (!apiKey || !apiSecret || !isInitialized || !isAuthenticated) {
      toast.error("Authentication required");
      return;
    }
    setIsSaving(true);
    try {
      const payload: Record<string, any> = JSON.parse(JSON.stringify(formData));
      ["bill_upto", "remaining_amount", "tender_amount", "prev_bill_amt", "bill_amount", "saved_amount"].forEach((f) => {
        if (f in payload) payload[f] = Number(payload[f]) || 0;
      });
      if (Array.isArray(payload.expenditure_details)) {
        payload.expenditure_details = payload.expenditure_details.map((row: any) => ({
          ...row,
          bill_amount: Number(row.bill_amount) || 0,
          have_asset: row.have_asset ? 1 : 0,
        }));
      }
      payload.docstatus = 1;
      const response = await axios.put(
        `${API_BASE_URL}/Expenditure/${encodeURIComponent(docname)}`,
        payload,
        { headers: { Authorization: `token ${apiKey}:${apiSecret}` } }
      );
      toast.success("Document submitted successfully!");
      setExpenditure((prev) => prev ? { ...prev, docstatus: 1 } : prev);
      setFormSaveState("CLEAN");
      isProgrammaticUpdate.current = false;
      
      const docName = response.data.data.name;
      if (docName) {
        router.push(`/tender/doctype/expenditure/${encodeURIComponent(docName)}`);
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit document");
    } finally {
      setIsSaving(false);
    }
  };

  const isDraft = expenditure.docstatus === 0;
  const isSubmitted = expenditure.docstatus === 1;
  const isFinal = billType === "Final";

  // 🟢 Colleague's Button Logic
  const showSave = isDraft && formSaveState === "DIRTY";
  const showSubmit = isDraft && isFinal && formSaveState === "CLEAN";
  const formKey = `${expenditure.name}-${expenditure.docstatus}-${formVersion}`;

  return (
    <DynamicForm
      key={formKey} // 🟢 Reset Form on Save
      title={`Expenditure ${expenditure.name}`}
      tabs={formTabs}
      onSubmit={handleSubmit}
      onSubmitDocument={handleSubmitDocument}
      isSubmittable={showSubmit} // 🟢 Only if Final AND Clean
      onCancelDocument={async () => {
        if (!isSubmitted) return;
        return await handleCancel();
      }}
      docstatus={expenditure.docstatus}
      initialStatus={isDraft ? "Draft" : isSubmitted ? "Submitted" : "Cancelled"}
      onFormInit={handleFormInit}
      doctype={doctypeName}
      submitLabel={
        isSaving
          ? showSubmit
            ? "Submitting..."
            : "Saving..."
          : showSubmit
            ? "Submit"
            : "Save"
      }
      deleteConfig={{ doctypeName: doctypeName, docName: docname, redirectUrl: "/tender/doctype/expenditure" }}
    />
  );
}