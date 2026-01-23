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
  page_no?: string;                 // Data
  mb_no?: string;                   // Data
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

  // NEW: State for work name default value
  const [workName, setWorkName] = React.useState<string>("");
  const [formInstance, setFormInstance] = React.useState<any>(null);

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

        const messages = getApiMessages(
          null,
          err,
          "Record loaded successfully",
          "Failed to load record",
          (error) => {
            // Custom handler for load errors with status codes
            if (error.response?.status === 404) return "Record not found";
            if (error.response?.status === 403) return "Unauthorized";
            if (error.response?.status === 417) {
              // Extract actual validation message from server response
              const serverMessages = error.response?.data?._server_messages;
              if (serverMessages) {
                try {
                  const parsed = JSON.parse(serverMessages);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    const messageObj = typeof parsed[0] === 'string' ? JSON.parse(parsed[0]) : parsed[0];
                    return messageObj.message || error.response?.data?.exception || "Validation failed";
                  }
                } catch (e) {
                  console.error("Failed to parse server messages:", e);
                }
              }
              return error.response?.data?.exception || "Validation failed - Server cannot meet requirements";
            }
            return "Failed to load record";
          }
        );

        setError(messages.description || messages.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  React.useEffect(() => {
    if (!formInstance) return;

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
              updateWorkNameInTableRows(formInstance, fetchedWorkName);
              setWorkName(fetchedWorkName);
            } else {
              console.log("No work_name found in response");
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
    // we should assume the original value wasn't "Running"
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
  4. Build tabs once when data is ready
  ------------------------------------------------- */

  // Helper function to get allowed stages from parent stage field
  const getAllowedStages = React.useCallback((formData: Record<string, any>): string[] => {
    const parentStage = formData.stage;
    if (!parentStage || !Array.isArray(parentStage)) return [];
    return parentStage.map((item: any) => item.stage).filter(Boolean);
  }, []);

  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!expenditure) return [];

    // Create a reference to access allowed stages in child table
    const parentStageRef = { current: expenditure.stage };

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
            name: "bill_type",
            label: "Bill Type",
            type: "Select",
            options: [
              { label: "Select Type", value: "Select Type" },
              { label: "Running", value: "Running" },
              { label: "Final", value: "Final" },
            ],
          },
          {
            name: "mb_no",
            label: "MB No",
            type: "Data",
          },
          {
            name: "page_no",
            label: "Page No",
            type: "Data",
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
                displayDependsOn: "work_type==Repair || work_type==Auxilary || have_asset==1"
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
  }, [expenditure, workName]);

  /* -------------------------------------------------
  5. SUBMIT – with Validation & file uploading
  ------------------------------------------------- */

  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }

    // 🟢 1. CLIENT-SIDE VALIDATION LOGIC 🟢

    // Parse Parent Values
    const billAmount = Number(data.bill_amount) || 0;
    const tenderAmount = Number(data.tender_amount) || 0;
    const savedAmount = Number(data.saved_amount) || 0;

    // Rule 1: Bill Amount cannot be > Tender Amount
    if (billAmount > tenderAmount) {
      toast.error("Validation Failed", {
        description: "The Bill Amount cannot be greater than the Tender Amount. Please verify the bill amount."
       ,duration: Infinity});
      return; // Stop the save process
    }

    // Calculate sum of child table rows
    const details = data.expenditure_details || [];
    const totalChildBillAmt = details.reduce((sum: number, row: any) => {
      return sum + (Number(row.bill_amount) || 0);
    }, 0);

    const amtToBeMatched = savedAmount + totalChildBillAmt;

    // Rule 2: Balance Check
    if (billAmount !== amtToBeMatched) {
      const lowOrHigh = billAmount < amtToBeMatched ? "LOWER" : "HIGHER";

      toast.error("Mismatch detected in amounts", {
        description: `Calculated Invoice Amount: ${amtToBeMatched}
Entered Bill Amount: ${billAmount}

The entered Bill Amount is ${lowOrHigh} than the calculated Invoice Amount.
Please ensure that the Invoice Amount and the Total Bill Amount are equal.`
      });
      return; // Stop the save process
    }

    // If validation passes, proceed to save
    setIsSaving(true);

    try {
      const payload: Record<string, any> = JSON.parse(JSON.stringify(data));

      // Handle file uploads in Expenditure Details child table
      if (payload.expenditure_details && apiKey && apiSecret) {
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

      if (!expenditure) {
        alert("Error: Record data not loaded. Cannot save.");
        setIsSaving(false);
        return;
      }

      finalPayload.modified = expenditure.modified;
      finalPayload.docstatus = expenditure.docstatus;

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

      const resp = await axios.put(
        `${API_BASE_URL}/${doctypeName}/${docname}`,
        finalPayload,
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

      // Handle successful response
      const messages = getApiMessages(resp, null, "Changes saved!", "Failed to save");

      if (messages.success) {
        toast.success(messages.message, { description: messages.description });
      } else {
        toast.error(messages.message, { description: messages.description , duration: Infinity});
      }

      if (resp.data && resp.data.data) {
        setExpenditure(resp.data.data as ExpenditureData);
      }

      // Return appropriate status based on docstatus
      const savedStatus = resp.data.data.docstatus === 0 ? "Draft" :
        resp.data.data.docstatus === 1 ? "Submitted" : "Cancelled";

      router.push(`/tender/doctype/expenditure/${docname}`);
      return { status: savedStatus };
    } catch (err: any) {
      console.error("Save error:", err);
      console.log("Full server error:", err.response?.data);

      const messages = getApiMessages(
        null,
        err,
        "Changes saved!",
        "Failed to save",
        (error) => {
          // Custom handler for save errors with status codes
          if (error.response?.status === 404) return "Record not found";
          if (error.response?.status === 403) return "Unauthorized";
          if (error.response?.status === 417) {
            // Extract actual validation message from server response
            const serverMessages = error.response?.data?._server_messages;
            if (serverMessages) {
              try {
                const parsed = JSON.parse(serverMessages);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const messageObj = typeof parsed[0] === 'string' ? JSON.parse(parsed[0]) : parsed[0];
                  return messageObj.message || error.response?.data?.exception || "Validation failed";
                }
              } catch (e) {
                console.error("Failed to parse server messages:", e);
              }
            }
            return error.response?.data?.exception || "Validation failed - Server cannot meet requirements";
          }
          return "Failed to save record";
        }
      );

      toast.error(messages.message, { description: messages.description, duration: Infinity});
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* -------------------------------------------------
  6. UI STATES
  ------------------------------------------------- */

  if (loading) {
    return <div>Loading expenditure details...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <div>{error}</div>
        <button
          className="border px-3 py-1 rounded"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!expenditure) {
    return <div>Expenditure not found.</div>;
  }

  /* -------------------------------------------------
  7. RENDER FORM
  ------------------------------------------------- */

  return (
    <DynamicForm
      title={`Expenditure ${expenditure.name}`}
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onFormInit={handleFormInit}
      doctype={doctypeName}
      submitLabel={isSaving ? "Saving..." : "Save"}
      cancelLabel="Cancel"
      initialStatus={expenditure.docstatus === 0 ? "Draft" : expenditure.docstatus === 1 ? "Submitted" : "Cancelled"}
      docstatus={expenditure.docstatus}
      deleteConfig={{
        doctypeName: doctypeName,
        docName: docname,
        redirectUrl: "/tender/doctype/expenditure",
      }}
    />
  );
}