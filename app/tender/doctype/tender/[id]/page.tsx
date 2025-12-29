"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  DynamicForm,
  TabbedLayout,
  FormField,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

/* -------------------------------------------------
   1. Project/Tender data
------------------------------------------------- */

interface TenderProjectData {
  name: string;
  modified: string;
  docstatus: 0 | 1 | 2;

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

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Project";

  const [record, setRecord] = React.useState<TenderProjectData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
     4. FETCH (GET with token)
  ------------------------------------------------- */

  React.useEffect(() => {
    const fetchRecord = async () => {
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret || !docname) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const resp = await axios.get(`${API_BASE_URL}/${doctypeName}/${docname}`, {
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        setRecord(resp.data.data as TenderProjectData);
      } catch (err: any) {
        console.error("API Error:", err);
        setError(
          err.response?.status === 404
            ? `${doctypeName} not found`
            : err.response?.status === 403
            ? "Unauthorized"
            : `Failed to load ${doctypeName}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  /* -------------------------------------------------
     5. Build tabs
  ------------------------------------------------- */

  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!record) return [];

    const withDefaults = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        defaultValue:
          f.name in record
            ? // @ts-ignore
              record[f.name as keyof TenderProjectData]
            : f.defaultValue,
      }));

    // Details tab (from Fields-1.csv) [file:6]
    const detailsFields: FormField[] = withDefaults([
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
      },
      {
        name: "custom_tender_id",
        label: "Tender ID",
        type: "Data",
        required: true,
      },
      {
        name: "custom_work_order",
        label: "Work Order",
        type: "Data",
      },
      {
        name: "custom_prapan_suchi_amount",
        label: "Prapan Suchi Amount",
        type: "Currency",
      },
      {
        name: "expected_start_date",
        label: "Work Order Date",
        type: "Date",
      },
      {
        name: "custom_tender_amount",
        label: "Tender Amount",
        type: "Currency",
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
        name: "custom_expected_date",
        label: "Scheduled Completion Date",
        type: "Date",
        required: true,
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
        options:"Extension Period Details",
        columns: [
              { name: "extension_count", label: "Extension Count", type: "Data" },
              { name: "extension_upto", label: "Extension Upto", type: "Date" },
              { name: "sanction_letter", label: "Sanction Letter", type: "Small Text" },
              { name: "attach", label: "Attach", type: "Attach" },
            ],
        displayDependsOn: "custom_is_extension==1"
      },
      
    ]);

    // Documents Attachment tab (from Fields-1.csv – Tab Break) [file:6]
    const documentsFields: FormField[] = withDefaults([
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
    ]);

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
  }, [record]);

  /* -------------------------------------------------
     6. SUBMIT – with file upload for child tables
  ------------------------------------------------- */

  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }

    if (!record) {
      toast.error("Cannot save, data not loaded.");
      return;
    }

    if (!apiKey || !apiSecret) {
      toast.error("Missing API credentials.");
      return;
    }

    setIsSaving(true);
    try {
      // Deep copy form data to payload
      const payload: any = JSON.parse(JSON.stringify(data));
      const baseUrl = API_BASE_URL.replace("/api/resource", "");

      // Upload files for custom_work_order_document
      if (payload.custom_work_order_document) {
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

      // Preserve metadata
      finalPayload.modified = record.modified;
      finalPayload.docstatus = record.docstatus;

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

      // Send to Frappe
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

      toast.success("Changes saved!");
      if (resp.data && resp.data.data) {
        setRecord(resp.data.data as TenderProjectData);
      }

      router.push(`/tender/doctype/tender/${docname}`);
    } catch (err: any) {
      console.error("Save error:", err);
      const serverData = err.response?.data;
      const serverMessage =
        serverData?.exception ||
        serverData?._server_messages ||
        err.message ||
        "Check console for details.";

      console.log("Full server error:", serverData || serverMessage);

      toast.error("Failed to save", {
        description: serverMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* -------------------------------------------------
     7. UI states
  ------------------------------------------------- */

  if (loading) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading Project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        <p style={{ color: "var(--color-error)" }}>{error}</p>
        <button className="btn btn--primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        <p>{doctypeName} not found.</p>
      </div>
    );
  }

  /* -------------------------------------------------
     8. Render form
  ------------------------------------------------- */

  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`Edit Tender ${record.name}`}
      description={`Update details for record ID ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save Changes"}
      cancelLabel="Cancel"
    />
  );
}
