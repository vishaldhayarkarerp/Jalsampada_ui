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
import { getApiMessages } from "@/lib/utils";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

/* -------------------------------------------------
   1. Project/Tender data
------------------------------------------------- */

interface TenderProjectData {
  name?: string;
  modified?: string;
  docstatus?: 0 | 1 | 2;

  // Tender Details
  custom_fiscal_year?: string;
  custom_lis_name?: string;
  custom_prapan_suchi?: string;
  custom_tender_id?: string;
  custom_work_order?: string;
  custom_prapan_suchi_amount?: number | string;
  expected_start_date?: string;
  custom_tender_amount?: number | string;
  custom_posting_date?: string;
  custom_tender_status?: string;
  custom_expected_date?: string;
  custom_is_extension?: 0 | 1;

  // Document tables
  custom_work_order_document?: Array<{
    name_of_document?: string;
    attachment?: string | File;
  }>;

  custom_related_documents?: Array<{
    name_of_document?: string;
    attachment?: string | File;
  }>;
}

/* -------------------------------------------------
   2. Helper: upload a file to Frappe
------------------------------------------------- */

async function uploadFile(
  file: File,
  apiKey: string,
  apiSecret: string,
  baseUrl: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("is_private", "0");

  const resp = await axios.post(`${baseUrl}/api/method/upload_file`, formData, {
    headers: {
      Authorization: `token ${apiKey}:${apiSecret}`,
    },
    withCredentials: true,
  });

  if (resp.data && resp.data.message && resp.data.message.file_url) {
    return resp.data.message.file_url;
  }
  throw new Error("Invalid response from file upload");
}

/* -------------------------------------------------
   3. Page component
------------------------------------------------- */

export default function NewTenderPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const doctypeName = "Project";
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
  4. Form tabs configuration
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    // Details tab (from Fields-1.csv) [file:6]
    const detailsFields: FormField[] = [
       {
        name: "custom_fiscal_year",
        label: "Fiscal Year",
        type: "Link",
        linkTarget: "Fiscal Year",
      },
      {
        name: "custom_lis_name",
        label: "LIS Name",
        type: "Link",
        linkTarget: "Lift Irrigation Scheme",
      },
      {
        name: "custom_prapan_suchi",
        label: "Name of Work",
        type: "Link",
        linkTarget: "Prapan Suchi",
        searchField: "work_name",
        filterMapping: [
          { sourceField: "custom_lis_name", targetField: "lis_name" },
          { sourceField: "custom_fiscal_year", targetField: "fiscal_year" },
        ]
      },
      {
        name: "custom_prapan_suchi_amount",
        label: "Prapan Suchi Amount",
        type: "Currency",
        fetchFrom: {
          sourceField: "custom_prapan_suchi",
          targetDoctype: "Prapan Suchi",
          targetField: "amount"
        }
      },
      {
        name: "custom_stage",
        label: "Stage/ Sub Scheme",
        type: "Table MultiSelect",
        linkTarget: "Stage No",
        filterMapping: [
          { sourceField: "lift_irrigation_scheme", targetField: "lis_name" }
        ],
        fetchFrom: {
          sourceField: "custom_prapan_suchi",
          targetDoctype: "Prapan Suchi",
          targetField: "stage"
        }
      },
      {
        name: "custom_tender_id",
        label: "Tender ID",
        type: "Data",
        required: true,
      },
      {
        name: "custom_tender_amount",
        label: "Tender Amount",
        type: "Currency",
        required: true,
      },
      
      {
        name: "custom_work_order",
        label: "Work Order",
        type: "Data",
      },
      {
        name: "expected_start_date",
        label: "Work Order Date",
        type: "Date",
      },
      {
        name: "custom_expected_date",
        label: "Scheduled Completion Date",
        type: "Date",
        required: true,
      },
      {
        name: "custom_posting_date",
        label: "Posting Date",
        type: "Date",
      },
      {
        name: "custom_tender_status",
        label: "Status",
        type: "Select",
        options: "Ongoing\nCompleted\nCancelled",
        defaultValue: "Ongoing",
      },
      {
        name: "custom_is_extension",
        label: "Is Extension",
        type: "Check",
      },
      {
        name: "custom_tender_extension_history",
        label: "Tender Extension Details",
        type: "Table",
        options: "Extension Period Details",
        columns: [
          { name: "extension_count", label: "Extension Count", type: "Data" },
          { name: "extension_upto", label: "Extension Upto", type: "Date", },
          { name: "sanction_letter", label: "Sanction Letter", type: "Data" },
          { name: "attach", label: "Attach", type: "Attach" },
        ],
        displayDependsOn: "custom_is_extension==1"
      },
      {
        name: "section_break0",
        label: "Tender Description",
        type: "Section Break",
      },
      {
        name: "notes",
        label: "Description",
        type: "Long Text",
      },
      {
        name: "custom_tender_extension_history",
        label: "Contractor Details",
        type: "Section Break",
      },
      {
        name: "custom_contractor_name",
        label: "Contractor Name",
        type: "Link",
        linkTarget: "Supplier",
      },
      {
        name: "custom_mobile_no",
        label: "Mobile No",
        type: "Read Only",
        fetchFrom: {
          sourceField: "custom_contractor_name",
          targetDoctype: "Contractor",
          targetField: "phone"
        }
      },
      {
        name: "custom_supplier_address",
        label: "Contractor Address",
        type: "Read Only",
        fetchFrom: {
          sourceField: "custom_contractor_name",
          targetDoctype: "Contractor",
          targetField: "address"
        }
      },
      {
        name: "custom_email_id",
        label: "Email ID",
        type: "Read Only",
        fetchFrom: {
          sourceField: "custom_contractor_name",
          targetDoctype: "Contractor",
          targetField: "email_address"
        },
      },


    ];

    // Documents Attachment tab (from Fields-1.csv – Tab Break) [file:6]
    const documentsFields: FormField[] = [
      {
        name: "custom_work_order_document",
        label: "Work Order Documents",
        type: "Table",
        columns: [
          {
            name: "name_of_document",
            label: "Name of Document",
            type: "Text",
          },
          {
            name: "attachment",
            label: "Attachment",
            type: "Attach",
          },
        ],
      },
      {
        name: "custom_related_documents",
        label: "Related Documents",
        type: "Table",
        columns: [
          {
            name: "name_of_document",
            label: "Name of Document",
            type: "Text",
          },
          {
            name: "attachment",
            label: "Attachment",
            type: "Attach",
          },
        ],
      },
    ];

    return [
      {
        name: "Details",
        fields: detailsFields,
      },
      {
        name: "Documents Attachment",
        fields: documentsFields,
      },
    ];
  }, []);

  /* -------------------------------------------------
  5. SUBMIT – with file upload for child tables
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
      // Deep copy form data to payload
      const payload: any = JSON.parse(JSON.stringify(data));
      const baseUrl = API_BASE_URL.replace("/api/resource", "");

      // Upload files for custom_work_order_document
      if (payload.custom_work_order_document) {
        toast.info("Uploading work order documents...");
        await Promise.all(
          payload.custom_work_order_document.map(
            async (row: any, index: number) => {
              const original =
                data.custom_work_order_document?.[index]?.attachment;
              if (original instanceof File) {
                const fileUrl = await uploadFile(
                  original,
                  apiKey,
                  apiSecret,
                  baseUrl
                );
                row.attachment = fileUrl;
              }
            }
          )
        );
      }

      // Upload files for custom_related_documents
      if (payload.custom_related_documents) {
        toast.info("Uploading related documents...");
        await Promise.all(
          payload.custom_related_documents.map(
            async (row: any, index: number) => {
              const original =
                data.custom_related_documents?.[index]?.attachment;
              if (original instanceof File) {
                const fileUrl = await uploadFile(
                  original,
                  apiKey,
                  apiSecret,
                  baseUrl
                );
                row.attachment = fileUrl;
              }
            }
          )
        );
      }

      // Clean non-data fields (Section Break, Column Break, etc.)
      const nonDataFields = new Set<string>();
      formTabs.forEach((tab) => {
        tab.fields.forEach((field) => {
          if (
            field.type === "Section Break" ||
            field.type === "Column Break" ||
            field.type === "Button" ||
            field.type === "Read Only"
          ) {
            nonDataFields.add(field.name);
          }
        });
      });

      const finalPayload: any = {};
      for (const key in payload) {
        if (!nonDataFields.has(key)) {
          finalPayload[key] = payload[key];
        }
      }

      // Convert checkboxes to 0/1
      const boolFields = ["custom_is_extension"];
      boolFields.forEach((f) => {
        if (f in finalPayload) {
          finalPayload[f] = finalPayload[f] ? 1 : 0;
        }
      });

      // Ensure posting date is a valid date or null (avoid "Today") [web:1][file:6]
      if (finalPayload.custom_posting_date === "Today") {
        finalPayload.custom_posting_date = new Date()
          .toISOString()
          .slice(0, 10);
      }

      // Numeric conversions
      const numericFields = [
        "custom_prapan_suchi_amount",
        "custom_tender_amount"
      ];
      numericFields.forEach((f) => {
        if (f in finalPayload) {
          finalPayload[f] = Number(finalPayload[f]) || 0;
        }
      });

      console.log("Sending this PAYLOAD to Frappe:", finalPayload);

      // Send to Frappe
      const response = await axios.post(`${API_BASE_URL}/${doctypeName}`, finalPayload, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      const messages = getApiMessages(response, null, "Tender created successfully!", "Failed to create Tender");
      if (messages.success) {
        toast.success(messages.message, { description: messages.description });
      } else {
        toast.error(messages.message, { description: messages.description, duration: Infinity});
      }

      // Navigate to the newly created record using name
      const docName = response.data.data.name;
      if (docName) {
        router.push(`/tender/doctype/tender/${encodeURIComponent(docName)}`);
      } else {
        router.push(`/tender/doctype/tender`);
      }

    } catch (err: any) {
      console.error("Create error:", err);

      const serverData = err.response?.data;
      const serverMessage = serverData?.exception || serverData?.message || err.message || "Unknown error";

      const messages = getApiMessages(
        null,
        err,
        "Tender created successfully!",
        "Failed to create Tender",
        (error) => {
          // Custom handler for create errors
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
          return "Failed to create Tender";
        }
      );

      if (!messages.success) {
        toast.error(messages.message, { description: messages.description, duration: Infinity});
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* -------------------------------------------------
  6. RENDER FORM
  ------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`New ${doctypeName}`}
      description="Create a new tender/project"
      submitLabel={isSaving ? "Saving..." : "New Tender"}
      cancelLabel="Cancel"
      doctype={doctypeName}

    />
  );
}