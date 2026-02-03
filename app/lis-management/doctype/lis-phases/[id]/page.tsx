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

const API_BASE_URL = "http://103.219.3.169:2223/api/resource";

interface LISPhaseData {
  name: string;
  lis_phase: string;
  lis_name: string;
}

export default function LISPhaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = decodeURIComponent(params.id as string);
  const doctypeName = "LIS Phases";

  const [lisDoc, setLisDoc] = React.useState<LISPhaseData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const fetchLIS = async () => {
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) return;

      try {
        const resp = await axios.get(
          `${API_BASE_URL}/${encodeURIComponent(doctypeName)}/${encodeURIComponent(docname)}`,
          {
            headers: { Authorization: `token ${apiKey}:${apiSecret}` },
            withCredentials: true,
          }
        );

        setLisDoc(resp.data.data);
      } catch {
        setError("Record not found");
      } finally {
        setLoading(false);
      }
    };

    fetchLIS();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!lisDoc) return [];

    const bind = (f: FormField[]): FormField[] =>
      f.map((x) => ({
        ...x,
        defaultValue: lisDoc[x.name as keyof LISPhaseData],
      }));

    return [
      {
        name: "Details",
        fields: bind([
          {
            name: "lis_name",
            label: "Lift Irrigation Scheme",
            type: "Link",
            linkTarget: "Lift Irrigation Scheme",
            required: true,
          },
          { name: "lis_phase", label: "LIS Phase", type: "Data", required: true },

        ]),
      },
    ];
  }, [lisDoc]);

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSaving(true);
    try {
      await axios.put(
        `${API_BASE_URL}/${encodeURIComponent(doctypeName)}/${encodeURIComponent(docname)}`,
        {
          lis_phase: data.lis_phase,
          lis_name: data.lis_name,
        },
        {
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      toast.success("Saved");
      router.push(`/lis-management/doctype/lis-phases/${encodeURIComponent(data.lis_phase)}`);
    } catch {
      toast.error("Save failed", { duration: Infinity });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="module active">Loading...</div>;
  if (error) return <div className="module active">{error}</div>;

  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      title={`${doctypeName}: ${lisDoc?.lis_phase || docname}`}
      submitLabel={isSaving ? "Saving..." : "Save"}
      cancelLabel="Cancel"
      deleteConfig={{
        doctypeName: doctypeName, // e.g. "Asset" or "Project"
        docName: docname,         // usually params.id
        redirectUrl: "/lis-management/doctype/lis-phases" // The list page to go to
      }}
    />
  );
}
