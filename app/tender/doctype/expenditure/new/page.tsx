"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  DynamicForm,
  TabbedLayout,
  FormField,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  fetchWorkNameByTenderNumber,
  updateWorkNameInTableRows,
  clearWorkNameInTableRows
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
  name?: string;

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
  page_no?: string;                 // Data
  mb_no?: string;                   // Data
  lift_irrigation_scheme?: string;  // Link -> Lift Irrigation Scheme
  stage?: string[];                 // Table MultiSelect -> Stage Multiselect
  expenditure_details?: ExpenditureDetailsRow[]; // Table -> Expenditure Details
  saved_amount?: number;            // Currency
  work_description?: string;        // Text

  docstatus?: 0 | 1 | 2;
  modified?: string;
}

/**
 * Uploads a single file to Frappe's 'upload_file' method
 * and returns the server URL.
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

export default function NewExpenditurePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const doctypeName = "Expenditure";
  const [isSaving, setIsSaving] = React.useState(false);

  // 🟢 NEW: State for work name default value
  const [workName, setWorkName] = React.useState<string>("");

  /* -------------------------------------------------
  3. Helper function to get allowed stages from parent stage field
  ------------------------------------------------- */

  const getAllowedStages = React.useCallback((formData: Record<string, any>): string[] => {
    const parentStage = formData.stage;
    if (!parentStage || !Array.isArray(parentStage)) return [];
    return parentStage.map((item: any) => item.stage).filter(Boolean);
  }, []);

  const [formInstance, setFormInstance] = React.useState<any>(null);

  React.useEffect(() => {
    if (!formInstance) return;

    console.log("Setting up watch subscription for tender_number");

    const subscription = formInstance.watch((value: any, { name }: { name?: string }) => {

      if (name === "tender_number" && value.tender_number) {

        const fetchWorkName = async () => {
          try {
            if (!apiKey || !apiSecret) {
              console.error("API keys not available");
              return;
            }

            const fetchedWorkName = await fetchWorkNameByTenderNumber(
              value.tender_number,
              apiKey,
              apiSecret
            );


            if (fetchedWorkName) {
              // Update all existing rows in table using service function
              updateWorkNameInTableRows(formInstance, fetchedWorkName);
              // Update state for future "Add Row" clicks
              setWorkName(fetchedWorkName);
            } else {
              console.log("No work_name found in response");
              // Clear work name from existing rows using service function
              clearWorkNameInTableRows(formInstance);
              setWorkName("");
            }
          } catch (error) {
            console.error("Failed to fetch work_name:", error);
          }
        };

        fetchWorkName();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [formInstance, apiKey, apiSecret]);

  const handleFormInit = React.useCallback((form: any) => {
    setFormInstance(form);

    let previousBillType: string | undefined;

    // Store the initial bill type value, but only if it's not "Running" due to RA in prev_bill_no
    const initialBillType = form.getValues('bill_type');
    const initialPrevBillNo = form.getValues('prev_bill_no');

    // If current bill type is "Running" but prev_bill_no contains "ra", 
    // we should assume original value wasn't "Running"
    if (initialBillType === 'Running' && initialPrevBillNo && typeof initialPrevBillNo === 'string' && /ra/i.test(initialPrevBillNo)) {
      // Don't store "Running" as previous - it was auto-set
      previousBillType = 'Select Type'; // Default fallback
    } else if (initialBillType && initialBillType !== 'Running') {
      previousBillType = initialBillType;
    } else {
      previousBillType = 'Select Type'; // Default fallback
    }

    // Watch the prev_bill_no field and set bill_type accordingly
    form.watch((value: any, { name }: { name?: string }) => {
      if (name === 'prev_bill_no' || name === undefined) {
        const prevBillNo = form.getValues('prev_bill_no');
        const currentBillType = form.getValues('bill_type');

        // Check if prev_bill_no contains 'ra' or 'RA' (case-insensitive)
        if (prevBillNo && typeof prevBillNo === 'string' && /ra/i.test(prevBillNo)) {
          // Set bill_type to "Running" if it's not already set
          if (currentBillType !== 'Running') {
            // Store current value as previous before changing to Running
            if (currentBillType && currentBillType !== 'Running') {
              previousBillType = currentBillType;
            }
            form.setValue('bill_type', 'Running', { shouldDirty: true });
          }
        } else {
          // If prev_bill_no is empty or doesn't contain 'ra', restore previous bill type
          if (!prevBillNo || (typeof prevBillNo === 'string' && !/ra/i.test(prevBillNo))) {
            if (currentBillType === 'Running' && previousBillType) {
              form.setValue('bill_type', previousBillType, { shouldDirty: true });
            } else if (!prevBillNo && currentBillType === 'Running' && !previousBillType) {
              // If no previous value stored, reset to default
              form.setValue('bill_type', 'Select Type', { shouldDirty: true });
            }
          }
        }
      }
    });
  }, []);

  /* -------------------------------------------------
  4. Form tabs configuration
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    return [
      {
        name: "Details",
        fields: ([
          {
            name: "fiscal_year",
            label: "Fiscal Year",
            type: "Link",
            linkTarget: "Fiscal Year",
            required: true,
          },
          {
            name: "tender_number",
            label: "Tender Number",
            type: "Link",
            required: true,
            linkTarget: "Project",
            filterMapping: [
              { sourceField: "custom_fiscal_year", targetField: "fiscal_year" }
            ]
          },
          {
            name: "tender_amount",
            label: "Tender Amount",
            type: "Currency",
            precision: 2,
            fetchFrom: {
              sourceField: "tender_number",
              targetDoctype: "Project",
              targetField: "custom_tender_amount"
            }
          },
          {
            name: "posting_date",
            label: "Bill Date",
            type: "Date",
          },

          {
            name: "prev_bill_no",
            label: "Previous Bill Number",
            type: "Data",
          },
          {
            name: "bill_number",
            label: "Bill Number",
            type: "Data",
          },
          {
            name: "prev_bill_amt",
            label: "Previous Bill Amount",
            type: "Currency",
            precision: 2,
          },
          {
            name: "mb_no",
            label: "MB No",
            type: "Data",
          },
          {
            name: "bill_amount",
            label: "Bill Amount",
            type: "Currency",
            required: true,
            precision: 2,
          },

          {
            name: "bill_upto",
            label: "Bill Upto Amount",
            type: "Currency",
            precision: 2,
          },
          {
            name: "remaining_amount",
            label: "Remaining Amount",
            type: "Currency",
            precision: 2,
          },
          {
            name: "page_no",
            label: "Page No",
            type: "Data",
          },
          {
            name: "bill_type",
            label: "Bill Type",
            type: "Select",
            options: [
              { label: "Running", value: "Running" },
              { label: "Final", value: "Final" },
            ],
          },
          {
            name: "lift_irrigation_scheme",
            label: "Lift Irrigation Scheme",
            type: "Link",
            linkTarget: "Lift Irrigation Scheme",
            required: true,
            fetchFrom: {
              sourceField: "tender_number",
              targetDoctype: "Project",
              targetField: "custom_lis_name"
            }
          },
          {
            name: "stage",
            label: "Stage/ Sub Scheme",
            type: "Table MultiSelect",
            linkTarget: "Stage No",
            filterMapping: [
              { sourceField: "lift_irrigation_scheme", targetField: "lis_name" },
            ],
            fetchFrom: {
              sourceField: "tender_number",
              targetDoctype: "Project",
              targetField: "custom_stage"
            }
          },

          {
            name: "expenditure_details",
            label: "Expenditure Details",
            type: "Table",
            showDownloadUpload: true,
            columns: [
              // 🟢 NEW: Added defaultValue from state
              { name: "name_of_work", label: "Name of Work", type: "Read Only", defaultValue: workName },
              {
                name: "stage",
                label: "Stage",
                type: "Link",
                linkTarget: "Stage No",
                filters: (getValues: (name: string) => any) => {
                  // Use 'parent.stage' to access the live parent field value
                  const parentStage = getValues("parent.stage");
                  const allowedStages = getAllowedStages({ stage: parentStage });
                  if (!allowedStages || allowedStages.length === 0) return { name: ["in", []] }; // Return empty filter if no stages
                  return { name: ["in", allowedStages] };
                }
              },
              { name: "section_interchange", label: "", type: "Section Break" },
              { name: "work_type", label: "Work Type", type: "Link", linkTarget: "Work Type" },
              {
                name: "work_subtype",
                label: "Work Subtype",
                type: "Link",
                linkTarget: "Work Subtype",
                filterMapping: [{ sourceField: "work_type", targetField: "work_type" }]
              },
              { name: "bill_amount", label: "Expenditure Amount", type: "Currency", precision: 2 },
              { name: "have_asset", label: "Have Asset", type: "Check", displayDependsOn: "work_type==Miscellaneous" },
              {
                name: "asset",
                label: "Asset",
                type: "Link",
                linkTarget: "Asset",
                displayDependsOn: "work_type==Repair || work_type==Auxiliary || have_asset==1"
              },
              {
                name: "asset_name",
                label: "Asset Name",
                type: "Data",
                displayDependsOn: "work_type==Repair || work_type==Auxilary || have_asset==1",
                fetchFrom: { sourceField: "asset", targetDoctype: "Asset", targetField: "asset_name" }
              },
              {
                name: "asset_no",
                label: "Asset No",
                type: "Data",
                displayDependsOn: "work_type==Repair || work_type==Auxilary || have_asset==1",
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

          {
            name: "saved_amount",
            label: "Saved Amount",
            type: "Currency",
            precision: 2,
          },
          {
            name: "work_description",
            label: "Work Description",
            type: "Long Text",
          }
        ]),
      }
    ];
  }, [workName, getAllowedStages]); // 🟢 NEW: Added workName to dependency array

  /* -------------------------------------------------
  4. SUBMIT – with file uploading for child table
  ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }

    if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) {
      toast.error("Authentication required. Please log in.", { duration: Infinity });
      return;
    }

    setIsSaving(true);

    try {
      const payload: Record<string, any> = JSON.parse(JSON.stringify(data));

      // Handle file uploads in Expenditure Details child table
      if (payload.expenditure_details) {
        toast.info("Uploading attachments in expenditure details...");

        await Promise.all(
          payload.expenditure_details.map(
            async (row: any, index: number) => {
              const originalFile =
                data.expenditure_details?.[index]?.attach;

              if (originalFile instanceof File) {
                try {
                  const fileUrl = await uploadFile(
                    originalFile,
                    apiKey,
                    apiSecret,
                    API_BASE_URL.replace("/api/resource", "")
                  );
                  row.attach = fileUrl;
                } catch (err) {
                  throw new Error(
                    `Failed to upload file in row ${index + 1}`
                  );
                }
              }
            }
          )
        );
      }

      // Clean payload: remove non-data fields
      const allFields = formTabs.flatMap((tab) => tab.fields);
      const nonDataFields = new Set<string>();
      allFields.forEach((field) => {
        if (
          field.type === "Section Break" ||
          field.type === "Column Break" ||
          field.type === "Button" ||
          field.type === "Read Only"
        ) {
          nonDataFields.add(field.name);
        }
      });

      const finalPayload: Record<string, any> = {};
      for (const key in payload) {
        if (!nonDataFields.has(key)) {
          finalPayload[key] = payload[key];
        }
      }

      // Boolean conversions (include child-level have_asset if present)
      const boolFields = [
        "have_asset",
      ];
      boolFields.forEach((f) => {
        if (f in finalPayload) {
          finalPayload[f] = finalPayload[f] ? 1 : 0;
        }
      });

      // Numeric conversions
      const numericFields = [
        "bill_upto",
        "remaining_amount",
        "tender_amount",
        "prev_bill_amt",
        "bill_amount",
        "saved_amount",
      ];
      numericFields.forEach((f) => {
        if (f in finalPayload) {
          finalPayload[f] = Number(finalPayload[f]) || 0;
        }
      });

      // Child table numeric + boolean conversions
      if (Array.isArray(finalPayload.expenditure_details)) {
        finalPayload.expenditure_details = finalPayload.expenditure_details.map(
          (row: any) => {
            return {
              ...row,
              bill_amount: Number(row.bill_amount) || 0,
              have_asset: row.have_asset ? 1 : 0,
            };
          }
        );
      }

      // Send payload
      console.log("Sending this PAYLOAD to Frappe:", finalPayload);

      const response = await axios.post(`${API_BASE_URL}/${doctypeName}`, finalPayload, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      toast.success("Expenditure created successfully!");

      // Navigate using the auto-generated naming series ID (EXP-####)
      const docName = response.data.data.name;
      if (docName) {
        router.push(`/tender/doctype/expenditure/${encodeURIComponent(docName)}`);
      } else {
        router.push(`/tender/doctype/expenditure`);
      }

    } catch (err: any) {
      console.error("Create error:", err);
      console.log("Full server error:", err.response?.data);

      // Extract actual validation message from server response
      let errorMessage = (err as Error).message || "Check the browser console (F12) for the full server error.";

      if (err.response?.status === 417) {
        const serverMessages = err.response?.data?._server_messages;
        if (serverMessages) {
          try {
            const parsed = JSON.parse(serverMessages);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const messageObj = typeof parsed[0] === 'string' ? JSON.parse(parsed[0]) : parsed[0];
              errorMessage = messageObj.message || err.response?.data?.exception || errorMessage;
            }
          } catch (e) {
            console.error("Failed to parse server messages:", e);
          }
        }
      }

      toast.error("Failed to create Expenditure", {
        description: errorMessage,
        duration: Infinity
      });
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
      title={`New ${doctypeName}`}
      description="Create a new expenditure record"
      submitLabel={isSaving ? "Saving..." : "New Expenditure"}
      cancelLabel="Cancel"
      doctype={doctypeName}
      onFormInit={handleFormInit}
    />
  );
}