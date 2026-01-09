"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DynamicForm,
  TabbedLayout,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

export default function NewLogSheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKey, apiSecret } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  const doctypeName = "Log Sheet";

  // Parse duplicate data from URL parameters
  const duplicateData = React.useMemo(() => {
    const duplicateParam = searchParams.get('duplicate');
    if (!duplicateParam) return null;
    
    try {
      const decodedData = JSON.parse(atob(decodeURIComponent(duplicateParam)));
      console.log("Parsed duplicate data:", decodedData);
      return decodedData;
    } catch (error) {
      console.error("Error parsing duplicate data:", error);
      toast.error("Failed to parse duplicate data");
      return null;
    }
  }, [searchParams]);

  // Show notification if we have duplicate data (only once)
  const notificationShown = React.useRef(false);
  React.useEffect(() => {
    if (duplicateData && !notificationShown.current) {
      toast.success("Form populated with duplicate data. Modify as needed and save.");
      notificationShown.current = true;
    }
  }, [duplicateData]);

  /* -------------------------------------------------
     1. Define the form structure
     ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    // Helper function to get value from duplicate data or fallback to default
    const getValue = (fieldName: string, defaultValue: any = undefined) => {
      return duplicateData?.[fieldName] ?? defaultValue;
    };

    return [
      {
        name: "Main",
        fields: [
          // 1st row
          { 
            name: "lis", 
            label: "LIS", 
            type: "Link", 
            linkTarget: "Lift Irrigation Scheme",
            defaultValue: getValue("lis"),
          },
          { 
            name: "date", 
            label: "Date", 
            type: "Date", 
            required: true,
            defaultValue: getValue("date"), // Note: "Today" keyword is usually handled by frontend logic if passed
          },

          // 2nd row
          { 
            name: "stage", 
            label: "Stage/ Sub Scheme", 
            type: "Link", 
            linkTarget: "Stage No",
            defaultValue: getValue("stage"),
          },
          { 
            name: "time", 
            label: "Time", 
            type: "Time", 
            defaultValue: getValue("time"),
          },

          // 3rd row
          { 
            name: "asset", 
            label: "Asset", 
            type: "Link", 
            linkTarget: "Asset",
            defaultValue: getValue("asset"),
          },
          { 
            name: "operator_id", 
            label: "Operator ID", 
            type: "Link", 
            linkTarget: "User",
            defaultValue: getValue("operator_id"),
          },

          // 4th row
          { 
            name: "logbook", 
            label: "Pump No", 
            type: "Link", 
            linkTarget: "Logbook Ledger",
            defaultValue: getValue("logbook"),
          },
          { 
            name: "operator_name", 
            label: "Operator Name", 
            type: "Data",
            defaultValue: getValue("operator_name"),
          },

          // Remarks
          { name: "section_break_mgrv", label: "", type: "Section Break" },
          { 
            name: "remark", 
            label: "Remark", 
            type: "Text",
            defaultValue: getValue("remark"),
          },
        ],
      },
      {
        name: "Readings",
        fields: [
          // Water & Pressure
          { 
            name: "water_level", 
            label: "Water Level", 
            type: "Float",
            defaultValue: getValue("water_level"),
          },
          { 
            name: "pressure_guage", 
            label: "Pressure Guage Reading", 
            type: "Float",
            defaultValue: getValue("pressure_guage"),
          },

          // Voltage Section
          { name: "voltage_section", label: "Voltage Reading", type: "Section Break" },
          { name: "br", label: "BR", type: "Float", defaultValue: getValue("br") },
          { name: "ry", label: "RY", type: "Float", defaultValue: getValue("ry") },
          { name: "yb", label: "YB", type: "Float", defaultValue: getValue("yb") },

          // Current Section
          { name: "current_reading_section", label: "Current Reading", type: "Section Break" },
          { name: "r", label: "R", type: "Float", defaultValue: getValue("r") },
          { name: "y", label: "Y", type: "Float", defaultValue: getValue("y") },
          { name: "b", label: "B", type: "Float", defaultValue: getValue("b") },

          // Temperature Table
          { name: "section_break_qzro", label: "", type: "Section Break" },
          {
            name: "temperature_readings",
            label: "Temperature Readings",
            type: "Table",
            defaultValue: getValue("temperature_readings", []),
            columns: [
              {
                name: "temperature",
                label: "Temperature",
                type: "Data",
              },
              {
                name: "temp_value",
                label: "Temp Value",
                type: "Float",
              },
            ],
          },
        ],
      },
    ];
  }, [duplicateData]);

  /* -------------------------------------------------
     2. SUBMIT (Create)
     ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    // Check if we have valid data to submit
    const hasValidData = isDirty || (duplicateData && data.date);
    
    if (!hasValidData) {
      toast.info("Please fill out the form.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const payload: Record<string, any> = { ...data };
      
      // Cleanup section breaks if necessary (though DynamicForm usually handles extraction)
      delete payload.section_break_mgrv;
      delete payload.voltage_section;
      delete payload.current_reading_section;
      delete payload.section_break_qzro;

      payload.doctype = doctypeName;

      // Ensure numeric values for floats
      const floatFields = [
          "water_level", "pressure_guage",
          "br", "ry", "yb",
          "r", "y", "b"
      ];
      floatFields.forEach(field => {
          if (field in payload) {
              payload[field] = Number(payload[field]) || 0;
          }
      });

      console.log("Sending NEW Log Sheet payload:", payload);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `token ${apiKey}:${apiSecret}`,
      };

      const storedCsrfToken = localStorage.getItem('csrfToken');
      if (storedCsrfToken) {
        headers['X-Frappe-CSRF-Token'] = storedCsrfToken;
      }

      const resp = await fetch(`${API_BASE_URL}/${doctypeName}`, {
        method: 'POST',
        headers: headers,
        credentials: 'include', 
        body: JSON.stringify(payload), 
      });

      const responseData = await resp.json();

      if (!resp.ok) {
        console.log("Full server error:", responseData);
        throw new Error(responseData.exception || responseData._server_messages || "Failed to create document");
      }
      
      toast.success("Log Sheet created successfully!");
      
      router.push(`/operations/doctype/logsheet`);

    } catch (err: any) {
      console.error("Save error:", err);
      
      if (err.response?.data?.exc_type === "DuplicateEntryError") {
        toast.error("Duplicate Entry Error", {
          description: "This Log Sheet record may already exist."
        });
      } else {
        toast.error("Failed to create Log Sheet", {
          description: err.message || "Check console for details."
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* -------------------------------------------------
     3. RENDER FORM
     ------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title="New Log Sheet"
      description="Create a new Log Sheet record"
      submitLabel={isSaving ? "Saving..." : "Create"}
      cancelLabel="Cancel"
    />
  );
}