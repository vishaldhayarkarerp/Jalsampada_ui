"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  DynamicForm,
  TabbedLayout,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API_BASE_URL = "http://103.219.1.138:4412//api/resource";

interface LISPhaseData {
  lis_phase?: string;
  lis_name?: string;
}

export default function NewLISPhasePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const doctypeName = "LIS Phases";
  const [isSaving, setIsSaving] = React.useState(false);

  const formTabs: TabbedLayout[] = React.useMemo(() => [
    {
      name: "Details",
      fields: [
        {
          name: "lis_name",
          label: "Lift Irrigation Scheme",
          type: "Link",
          linkTarget: "Lift Irrigation Scheme",
          required: false,
          description: "Links to Lift Irrigation Scheme"
        },
        {
          name: "lis_phase",
          label: "LIS Phase",
          type: "Data",
          required: true
        }
      ]
    }
  ], []);

  const handleSubmit = async (data: Record<string, any>) => {
    if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) {
      toast.error("Authentication required. Please log in.", { duration: Infinity });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        lis_phase: data.lis_phase,
        lis_name: data.lis_name || null
      };

      const response = await axios.post(
        `${API_BASE_URL}/${doctypeName}`,
        payload,
        {
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      toast.success("LIS Phase created successfully!");

      // Use lis_phase as ID if name is not returned
      const lisPhase = response.data.data.lis_phase || response.data.data.name;
      router.push(`/lis-management/doctype/lis-phases/${encodeURIComponent(lisPhase)}`);

    } catch (err: any) {
      console.error("Create error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.status === 409 ? "LIS Phase already exists" : "Failed to create LIS Phase. Duplicate Entry");
      toast.error(`Error: ${errorMessage}`, { duration: Infinity });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`New LIS Phase`}
      description="Create a new LIS Phase"
      submitLabel={isSaving ? "Saving..." : "New LIS Phase"}
      cancelLabel="Cancel"
    />
  );
}
