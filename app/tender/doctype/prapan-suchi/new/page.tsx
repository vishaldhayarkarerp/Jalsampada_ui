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

interface PrapanSuchi {
  name?: string;
  fiscal_year?: string;
  lis_name?: string;
  type?: string; // Fund Head
  amount?: number;
  stage?: Array<{
    stage?: string;
  }>;
  work_name?: string;
  description?: string;
  docstatus?: 0 | 1 | 2;
  modified?: string;
}

export default function NewPrapanSuchiPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const doctypeName = "Prapan Suchi";
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
        ],
      },
    ];
  }, []);

  /* -------------------------------------------------
  4. SUBMIT handler (POST)
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

      // Numeric conversions
      const numericFields = ["amount"];
      numericFields.forEach((f) => {
        if (f in finalPayload) {
          finalPayload[f] = Number(finalPayload[f]) || 0;
        }
      });

      console.log("Sending this PAYLOAD to Frappe:", finalPayload);

      const response = await axios.post(`${API_BASE_URL}/${encodeURIComponent(doctypeName)}`, finalPayload, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      toast.success("Prapan Suchi created successfully!");

      // Navigate to the newly created record using name
      const docName = response.data.data.name;
      if (docName) {
        router.push(`/tender/doctype/prapan-suchi/${docName}`);
      } else {
        router.push(`/tender/doctype/prapan-suchi`);
      }
      
    } catch (err: any) {
      console.error("Create error:", err);
      console.log("Full server error:", err.response?.data);
      toast.error("Failed to create Prapan Suchi", {
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
      description="Create a new prapan suchi"
      submitLabel={isSaving ? "Creating..." : "Create Prapan Suchi"}
      cancelLabel="Cancel"
    />
  );
}