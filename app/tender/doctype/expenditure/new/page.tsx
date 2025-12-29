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

  /* -------------------------------------------------
  3. Form tabs configuration
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    return [
      {
        name: "Details",
        fields: [
          {
            name: "fiscal_year",
            label: "Fiscal Year",
            type: "Link",
            linkTarget: "Fiscal Year",
          },
          {
            name: "prev_bill_no",
            label: "Previous Bill Number",
            type: "Data",
          },
          {
            name: "bill_upto",
            label: "Bill Upto Amount",
            type: "Currency",
          },

          {
            name: "tender_number",
            label: "Tender Number",
            type: "Link",
            linkTarget: "Project",
          },
          {
            name: "bill_number",
            label: "Bill Number",
            type: "Data",
          },
          {
            name: "remaining_amount",
            label: "Remaining Amount",
            type: "Currency",
          },

          {
            name: "tender_amount",
            label: "Tender Amount",
            type: "Currency",
          },
          {
            name: "prev_bill_amt",
            label: "Previous Bill Amount",
            type: "Currency",
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
            name: "posting_date",
            label: "Bill Date",
            type: "Date",
          },
          {
            name: "bill_amount",
            label: "Bill Amount",
            type: "Currency",
          },
          {
            name: "page_no",
            label: "Page No",
            type: "Data",
          },
          {
            name: "mb_no",
            label: "MB No",
            type: "Data",
          },

          {
            name: "lift_irrigation_scheme",
            label: "Lift Irrigation Scheme",
            type: "Link",
            linkTarget: "Lift Irrigation Scheme",
          },
          {
            name: "stage",
            label: "Stage/ Sub Scheme",
            type: "Table MultiSelect",
            linkTarget: "Stage Multiselect",
          },

          
          {
            name: "expenditure_details",
            label: "Expenditure Details",
            type: "Table",
            columns: [
              {
                name: "name_of_work",
                label: "Name of Work",
                type: "Text",
              },
              {
                name: "stage",
                label: "Stage",
                type: "Link",
                linkTarget: "Stage No",
              },
              {
                name: "work_type",
                label: "Work Type",
                type: "Link",
                linkTarget: "Work Type",
              },
              {
                name: "asset",
                label: "Asset",
                type: "Link",
                linkTarget: "Asset",
              },
              {
                name: "work_subtype",
                label: "Work Subtype",
                type: "Link",
                linkTarget: "Work Subtype",
              },
              {
                name: "asset_name",
                label: "Asset Name",
                type: "Data",
              },
              {
                name: "bill_amount",
                label: "Expenditure Amount",
                type: "Currency",
              },
              {
                name: "have_asset",
                label: "Have Asset",
                type: "Check",
              },
              {
                name: "asset_no",
                label: "Asset No",
                type: "Data",
              },
              {
                name: "from_date",
                label: "From Date",
                type: "Date",
              },
              {
                name: "attach",
                label: "Attach",
                type: "Attach",
              },
              {
                name: "to_date",
                label: "To Date",
                type: "Date",
              },
              {
                name: "invoice_number",
                label: "Invoice Number",
                type: "Data",
              },
              {
                name: "expenditure_date",
                label: "Invoice Date",
                type: "Date",
              },
              {
                name: "remarks",
                label: "Work Details",
                type: "Text",
              },
            ],
          },

          {
            name: "saved_amount",
            label: "Saved Amount",
            type: "Currency",
          },
          {
            name: "work_description",
            label: "Work Description",
            type: "Text",
          },
        ],
      },
    ];
  }, []);

  /* -------------------------------------------------
  4. SUBMIT – with file uploading for child table
  ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }

    if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) {
      toast.error("Authentication required. Please log in.");
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
        router.push(`/tender/doctype/expenditure/${docName}`);
      } else {
        router.push(`/tender/doctype/expenditure`);
      }
      
    } catch (err: any) {
      console.error("Create error:", err);
      console.log("Full server error:", err.response?.data);
      toast.error("Failed to create Expenditure", {
        description:
          (err as Error).message ||
          "Check the browser console (F12) for the full server error.",
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
    />
  );
}