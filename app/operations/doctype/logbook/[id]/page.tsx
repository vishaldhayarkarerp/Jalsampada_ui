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

/* -------------------------------------------------
   1. Logbook type
------------------------------------------------- */
interface LogbookData {
  name: string;
  date?: string;
  location?: string;

  start_pump?: 0 | 1;
  stop_pump?: 0 | 1;
  stop_datetime?: string;
  operator_id_1?: string;
  operator_name_1?: string;
  pump_stop_reason?: string;

  primary_list?: Array<{
    pump?: string;
    pump_no?: number;
    check?: 0 | 1;
  }>;

  secondary_list?: Array<{
    pump?: string;
    pump_no?: number;
  }>;

  docstatus: 0 | 1 | 2;
  modified: string;
}

/* -------------------------------------------------
   2. Page Component
------------------------------------------------- */
export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Logbook";

  const [logbook, setLogbook] = React.useState<LogbookData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
     3. Fetch Logbook
  ------------------------------------------------- */
  React.useEffect(() => {
    const fetchData = async () => {
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) return;

      try {
        const resp = await axios.get(
          `${API_BASE_URL}/${doctypeName}/${docname}`,
          {
            headers: {
              Authorization: `token ${apiKey}:${apiSecret}`,
            },
          }
        );
       
        setLogbook(resp.data.data);
      } catch {
        setError("Failed to load Logbook");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  /* -------------------------------------------------
     4. Tabs
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!logbook) return [];

    const fields = (list: FormField[]) =>
      list.map((f) => ({
        ...f,
        defaultValue:
          f.name in logbook
            ? logbook[f.name as keyof LogbookData]
            : f.defaultValue,
      }));

    return [
      {
        name: "Details",
        fields: fields([
          // { name: "location", label: "Location", type: "Link", linkTarget: "Location" },

          { name: "start_pump", label: "Start Pump", type: "Check" },
          {
            name: "stop_pump",
            label: "Stop Pump",
            type: "Check",
            
          },
          { name: "stop_datetime", label: "Stop Datetime", type: "DateTime" },

          { name: "operator_id_1", label: "Operator ID", type: "Link", linkTarget: "Employee" },
          { name: "operator_name_1", label: "Operator Name", type: "Data" },

          {
  name: "pump_stop_reason",
  label: "Pump Stop Reason",
  type: "Link",
  linkTarget: "Pump Stop Reasons",
}

        ]),
      },
      {
        name: "Primary List",
        fields: fields([
          {
            name: "primary_list",
            label: "Primary List",
            type: "Table",
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Int" },
              { name: "check", label: "Check", type: "Check" },
            ],
          },
        ]),
      },
      {
        name: "Secondary List",
        fields: fields([
          {
            name: "secondary_list",
            label: "Secondary List",
            type: "Table",
            columns: [
              { name: "pump", label: "Pump", type: "Link", linkTarget: "Asset" },
              { name: "pump_no", label: "Pump No", type: "Int" },
            ],
          },
        ]),
      },
    ];
  }, [logbook]);

  /* -------------------------------------------------
     5. Submit
  ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    if (!isDirty) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);

    try {
      const payload = { ...data };
      payload.modified = logbook?.modified;
      payload.docstatus = logbook?.docstatus;

      if (payload.primary_list) {
        payload.primary_list.forEach((r: any) => {
          r.check = r.check ? 1 : 0;
        });
      }

      await axios.put(
        `${API_BASE_URL}/${doctypeName}/${docname}`,
        payload,
        {
          headers: {
            Authorization: `token ${apiKey}:${apiSecret}`,
          },
        }
      );

      toast.success("Logbook updated");
      router.back();
    } catch {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!logbook) return <p>Not found</p>;

  /* -------------------------------------------------
     6. Render
  ------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      title={`Edit Logbook: ${logbook.name}`}
      submitLabel={isSaving ? "Saving..." : "Save"}
    />
  );
}
