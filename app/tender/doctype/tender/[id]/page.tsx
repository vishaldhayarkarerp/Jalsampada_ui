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
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getApiMessages } from "@/lib/utils";

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

  // Extension Child Table
  custom_tender_extension_history?: Array<{
    extension_count?: string;
    extension_upto?: string;
    sanction_letter?: string;
    attach?: string;
  }>;

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
  const doctypeName = "Project"; // Note: This doctype is named 'Project' in Frappe

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
     5. VALIDATION LOGIC (Extension Check)
  ------------------------------------------------- */

  const overdueWarning = React.useMemo(() => {
    if (!record || !record.custom_tender_status) return null;

    if (record.custom_tender_status !== "Ongoing") return null;

    let finalDateStr = record.custom_expected_date;

    if (record.custom_is_extension && record.custom_tender_extension_history?.length) {
      const dates = record.custom_tender_extension_history
        .map((row) => row.extension_upto)
        .filter((d): d is string => !!d);

      if (dates.length > 0) {
        dates.sort().reverse();
        finalDateStr = dates[0];
      }
    }

    if (!finalDateStr) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const finalDate = new Date(finalDateStr);
    finalDate.setHours(0, 0, 0, 0);

    if (finalDate.getTime() < today.getTime()) {
      return `Extension required for ${record.name} - date was ${finalDateStr}`;
    }

    return null;
  }, [record]);

  /* -------------------------------------------------
     6. Build tabs
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
        filterMapping: [
          { sourceField: "custom_lis_name", targetField: "lis_name" },
        ]
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
        options: "Extension Period Details",
        columns: [
          { name: "extension_count", label: "Extension Count", type: "Data" },
          { name: "extension_upto", label: "Extension Upto", type: "Date", },
          { name: "sanction_letter", label: "Sanction Letter", type: "Data" },
          { name: "attach", label: "Attach", type: "Attach" },
        ],
        displayDependsOn: "custom_is_extension==1"
      },

    ]);

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
     7. SUBMIT
  ------------------------------------------------- */

  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("NoChangesToSave.");
      return;
    }

    if (!record) {
      toast.error("CannotSave,DataNotLoaded.");
      return;
    }

    if (!apiKey || !apiSecret) {
      toast.error("MissingAPICredentials.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = JSON.parse(JSON.stringify(data));
      const baseUrl = API_BASE_URL.replace("/api/resource", "");

      // Handle file uploads
      if (payload.custom_work_order_document) {
        await Promise.all(
          payload.custom_work_order_document.map(async (row: any, index: number) => {
            const original = data.custom_work_order_document?.[index]?.attachment;
            if (original instanceof File) {
              row.attachment = await uploadFile(original, apiKey, apiSecret, baseUrl);
            }
          })
        );
      }

      if (payload.custom_related_documents) {
        await Promise.all(
          payload.custom_related_documents.map(async (row: any, index: number) => {
            const original = data.custom_related_documents?.[index]?.attachment;
            if (original instanceof File) {
              row.attachment = await uploadFile(original, apiKey, apiSecret, baseUrl);
            }
          })
        );
      }

      if (payload.custom_tender_extension_history) {
        await Promise.all(
          payload.custom_tender_extension_history.map(async (row: any, index: number) => {
            const original = data.custom_tender_extension_history?.[index]?.attach;
            if (original instanceof File) {
              row.attach = await uploadFile(original, apiKey, apiSecret, baseUrl);
            }
          })
        );
      }

      const nonDataFields = new Set<string>();
      formTabs.forEach((tab) => {
        tab.fields.forEach((field) => {
          if (["Section Break", "Column Break", "Button", "Read Only"].includes(field.type)) {
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

      finalPayload.modified = record.modified;
      finalPayload.docstatus = record.docstatus;

      const boolFields = ["custom_is_extension"];
      boolFields.forEach((f) => {
        if (f in finalPayload) finalPayload[f] = finalPayload[f] ? 1 : 0;
      });

      if (finalPayload.custom_posting_date === "Today") {
        finalPayload.custom_posting_date = new Date().toISOString().slice(0, 10);
      }

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

      const messages = getApiMessages(resp, null, "Changes saved!", "Failed to save");
      if (messages.success) {
        toast.success(messages.message, { description: messages.description });
      } else {
        toast.error(messages.message, { description: messages.description });
      }

      if (resp.data && resp.data.data) {
        setRecord(resp.data.data as TenderProjectData);
      }

      // Return appropriate status based on docstatus
      const savedStatus = resp.data.data.docstatus === 0 ? "Draft" :
        resp.data.data.docstatus === 1 ? "Submitted" : "Cancelled";

      router.push(`/tender/doctype/tender/${docname}`);
      return { status: savedStatus };
    } catch (err: any) {
      console.error("Save error:", err);

      const messages = getApiMessages(
        null,
        err,
        "Changes saved!",
        "Failed to save",
        (error) => {
          // Custom handler for save errors
          if (error.response?.status === 404) return "Record not found";
          if (error.response?.status === 403) return "Unauthorized";
          if (error.response?.status === 417) return "Expectation Failed";
          return "Failed to save";
        }
      );

      if (!messages.success) {
        toast.error(messages.message, { description: messages.description });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* -------------------------------------------------
     8. UI states
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
     9. Render form
  ------------------------------------------------- */

  return (
    <div className="space-y-4">
      {overdueWarning && (
        <Alert variant="destructive" className="mb-4 border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-800 dark:text-orange-300 ml-2">Action Required</AlertTitle>
          <AlertDescription className="ml-2">
            {overdueWarning}
          </AlertDescription>
        </Alert>
      )}

      <DynamicForm
        tabs={formTabs}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        title={`Tender : ${record.name}`}
        description={`Update details for record ID ${docname}`}
        submitLabel={isSaving ? "Saving..." : "Save"}
        cancelLabel="Cancel"
        initialStatus={record.docstatus === 0 ? "Draft" : record.docstatus === 1 ? "Submitted" : "Cancelled"}
        docstatus={record.docstatus}
        // 🟢 SIMPLY PASS THE CONFIG
        deleteConfig={{
          doctypeName: doctypeName, // "Project"
          docName: docname,
          redirectUrl: "/tender/doctype/tender"
        }}
      />
    </div>
  );
}