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

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";
const API_METHOD_URL = "http://103.219.1.138:4412/api/method";

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

  // 🟢 State to store form methods
  const [formMethods, setFormMethods] = React.useState<UseFormReturn<any> | null>(null);

  React.useEffect(() => {
    if (!formMethods || !apiKey || !apiSecret) return;

    const { watch, setValue } = formMethods;

    // Watch for changes in "lis_name"
    const subscription = watch(async (value, { name, type }) => {
      // Only run if the specific field "lis_name" changed
      if (name === "lis_name") {
        const lisName = value.lis_name;

        // 1. If LIS Name is cleared, clear the stages table
        if (!lisName) {
          setValue("stage", [], { shouldDirty: true });
          return;
        }

        // 2. Fetch Stages from Custom API
        try {
          const resp = await axios.get(`${API_METHOD_URL}/quantlis_management.api.fetch_lis_name_stage`, {
            params: { lis_name: lisName },
            headers: { Authorization: `token ${apiKey}:${apiSecret}` },
            withCredentials: true,
          });

          const rawList = resp.data.message || [];

          // 3. Format for Child Table
          const formattedStages = rawList.map((item: any, idx: number) => ({
            doctype: "Stage Multiselect",
            stage: item.stage,
            idx: idx + 1
          }));

          // 4. Update the form field
          setValue("stage", formattedStages, { shouldDirty: true });

        } catch (error: any) {
          console.error("Failed to fetch stages:", error);
          const messages = getApiMessages(
            null,
            error,
            "Stages fetched successfully",
            "Could not fetch stages for the selected LIS."
          );

          toast.error(messages.message, { description: messages.description });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [formMethods, apiKey, apiSecret]);

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
        const messages = getApiMessages(
          null,
          err,
          "Record loaded successfully",
          "Failed to load record",
          (error) => {
            // Custom handler for load errors with status codes
            if (error.response?.status === 404) return "Record not found";
            if (error.response?.status === 403) return "Unauthorized";
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
            type: "Table MultiSelect",
            linkTarget: "Stage No",
            filterMapping: [
              { sourceField: "lis_name", targetField: "lis_name" }
            ]
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

      // Process stage field to ensure proper Frappe child table format
      if (finalPayload.stage && Array.isArray(finalPayload.stage)) {
        finalPayload.stage = finalPayload.stage.map((item, index) => {
          // If item is a string, convert to proper child table object
          if (typeof item === 'string') {
            return {
              doctype: "Stage Multiselect",
              stage: item,
              idx: index + 1
            };
          }
          // If item is already an object, ensure it has required fields
          if (typeof item === 'object' && item !== null) {
            return {
              ...item,
              doctype: "Stage Multiselect",
              idx: item.idx || (index + 1)
            };
          }
          // Fallback for any other type
          return {
            doctype: "Stage Multiselect",
            stage: String(item),
            idx: index + 1
          };
        });
      }

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

      // Handle successful response with ultra-simple handler
      const messages = getApiMessages(resp, null, "Changes saved!", "Failed to save");

      if (messages.success) {
        toast.success(messages.message, { description: messages.description });
      }

      if (resp.data && resp.data.data) {
        setRecord(resp.data.data as PrapanSuchi);
      }

      router.push(`/tender/doctype/prapan-suchi/${docname}`);
    } catch (err: any) {
      console.error("Save error:", err);
      console.log("Full server error:", err.response?.data);

      const messages = getApiMessages(null, err, "Changes saved!", "Failed to save");

      toast.error(messages.message, { description: messages.description });
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
      submitLabel={isSaving ? "Saving..." : "Save"}
      cancelLabel="Cancel"
      deleteConfig={{
        doctypeName: doctypeName,
        docName: docname,
        redirectUrl: "/tender/doctype/prapan-suchi",
      }}
      // 🟢 Capture form methods
      onFormInit={(methods) => setFormMethods(methods)}
    />
  );
}