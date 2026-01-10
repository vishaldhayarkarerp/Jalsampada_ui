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
   1. Work Type data
------------------------------------------------- */

interface WorkTypeData {
  name: string;
  modified: string;
  docstatus: 0 | 1 | 2;

  // Work Type Details
  work_type_name?: string;
}

/* -------------------------------------------------
   2. Page component
------------------------------------------------- */

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Work Type";

  const [record, setRecord] = React.useState<WorkTypeData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
     3. FETCH (GET with token)
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

        setRecord(resp.data.data as WorkTypeData);
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
     4. Build tabs
  ------------------------------------------------- */

  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!record) return [];

    const withDefaults = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        defaultValue:
          f.name in record
            ? // @ts-ignore
              record[f.name as keyof WorkTypeData]
            : f.defaultValue,
      }));

    // Details tab
    const detailsFields: FormField[] = withDefaults([
      {
        name: "work_type_name",
        label: "Work Type Name",
        type: "Data",
        required: true,
      },
    ]);

    return [
      {
        name: "Details",
        fields: detailsFields,
      },
    ];
  }, [record]);

  /* -------------------------------------------------
     5. SUBMIT
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
        setRecord(resp.data.data as WorkTypeData);
      }

      router.push(`/tender/doctype/work-type/${docname}`);
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
     6. UI states
  ------------------------------------------------- */

  if (loading) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading Work Type details...</p>
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
     7. Render form
  ------------------------------------------------- */

  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`${doctypeName}: ${record.name}`}
      description={`Update details for record ID ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save"}
      cancelLabel="Cancel"
      deleteConfig={{
        doctypeName: doctypeName,
        docName: docname,
        redirectUrl: "/tender/doctype/work-type",
      }}
    />
  );
}
