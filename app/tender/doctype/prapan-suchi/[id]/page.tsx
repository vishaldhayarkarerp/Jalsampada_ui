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

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

interface PrapanSuchi {
  name: string;
  fiscal_year?: string;
  lis_name?: string;
  type?: string; // Fund Head
  amount?: number;
  stage?: Array<{
    stage?: string;
  }>;
  work_name?: string;
  description?: string;
  docstatus: 0 | 1 | 2;
  modified: string;
}

export default function PrapanSuchiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Prapan Suchi";

  const [record, setRecord] = React.useState<PrapanSuchi | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // FETCH DOC
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
          `${API_BASE_URL}/${encodeURIComponent(doctypeName)}/${encodeURIComponent(docname)}`,
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

        setRecord(resp.data.data as PrapanSuchi);
      } catch (err: any) {
        console.error("API Error:", err);
        setError(
          err.response?.status === 404
            ? "Record not found"
            : err.response?.status === 403
            ? "Unauthorized"
            : "Failed to load record"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  // BUILD TABS – same pattern as Asset
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!record) return [];

    const fields = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        // @ts-ignore
        defaultValue: f.name in record ? record[f.name as keyof PrapanSuchi] : f.defaultValue,
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
          },
          {
            name: "lis_name",
            label: "LIS Name",
            type: "Link",
            linkTarget: "Lift Irrigation Scheme",
          },
          {
            name: "type",
            label: "Fund Head",
            type: "Link",
            linkTarget: "Fund Head",
          },
          {
            name: "amount",
            label: "Amount",
            type: "Currency",
          },
          {
            name: "stage",
            label: "Stage/Sub Scheme",
            type: "Table",
            columns: [
              {
                name: "stage",
                label: "Stage",
                type: "Link",
                linkTarget: "Stage No",
              },
            ],
          },
          {
            name: "work_name",
            label: "Name of Work",
            type: "Text",
          },
          {
            name: "description",
            label: "Description",
            type: "Text",
          },
        ]),
      },
    ];
  }, [record]);

  // SUBMIT – same cleaning pattern as Asset page
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }

    if (!record) {
      toast.error("Record not loaded. Cannot save.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = JSON.parse(JSON.stringify(data));

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

      finalPayload.modified = record.modified;
      finalPayload.docstatus = record.docstatus;

      const numericFields = ["amount"];
      numericFields.forEach((f) => {
        if (f in finalPayload) {
          finalPayload[f] = Number(finalPayload[f]) || 0;
        }
      });

      console.log("Sending this PAYLOAD to Frappe:", finalPayload);

      const resp = await axios.put(
        `${API_BASE_URL}/${encodeURIComponent(doctypeName)}/${encodeURIComponent(docname)}`,
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
        setRecord(resp.data.data as PrapanSuchi);
      }

      router.push(`/tender/doctype/prapan-suchi/${docname}`);
    } catch (err: any) {
      console.error("Save error:", err);
      console.log("Full server error:", err.response?.data);
      toast.error("Failed to save", {
        description:
          (err as Error).message ||
          "Check the browser console (F12) for the full server error.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  // UI STATES – same UX style as Asset
  if (loading) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading prapan suchi details...</p>
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
        <p>Record not found.</p>
      </div>
    );
  }

  // RENDER FORM – mirror Asset usage
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`Edit Prapan Suchi: ${record.name}`}
      description={`Update details for record ID: ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save Changes"}
      cancelLabel="Cancel"
    />
  );
}
