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

export default function NewWarehousePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKey, apiSecret } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  const doctypeName = "Warehouse";

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
        name: "Details",
        fields: [
          {
            name: "warehouse_name",
            label: "Warehouse Name",
            type: "Data",
            required: true,
            defaultValue: getValue("warehouse_name"),
            description: "Name of the new warehouse",
          },
          {
            name: "parent_warehouse",
            label: "Parent Warehouse",
            type: "Link",
            linkTarget: "Warehouse",
            defaultValue: getValue("parent_warehouse"),
            description: "Parent warehouse (only if this is not a group)",
          },
          {
            name: "company",
            label: "Company",
            type: "Link",
            required: true,
            linkTarget: "Company",
            defaultValue: getValue("company"),
          },
          {
            name: "warehouse_type",
            label: "Warehouse Type",
            type: "Select",
            options: [
              { label: "Normal", value: "Normal" },
              { label: "View", value: "View" },
              { label: "Transit", value: "Transit" },
              { label: "Manufacturing", value: "Manufacturing" },
              { label: "Sub-Contracted", value: "Sub-Contracted" },
            ],
            defaultValue: getValue("warehouse_type"),
          },
          {
            name: "account",
            label: "Account",
            type: "Link",
            linkTarget: "Account",
            defaultValue: getValue("account"),
            description: "Linked account for accounting purposes",
          },
          {
            name: "is_group",
            label: "Is Group",
            type: "Check",
            defaultValue: getValue("is_group", 0),
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
    const hasValidData = isDirty || (duplicateData && data.warehouse_name);
    
    if (!hasValidData) {
      toast.info("Please fill out the form.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const payload: Record<string, any> = { ...data };
      payload.doctype = doctypeName;

      // Convert boolean to ERPNext format (0/1)
      if ("is_group" in payload) {
        payload.is_group = payload.is_group ? 1 : 0;
      }

      console.log("Sending NEW Warehouse payload:", payload);
      
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
      
      toast.success("Warehouse created successfully!");
      
      router.push(`/operations/doctype/warehouse`);

    } catch (err: any) {
      console.error("Save error:", err);
      
      if (err.response?.data?.exc_type === "DuplicateEntryError") {
        toast.error("Duplicate Entry Error", {
          description: "A Warehouse with this name already exists."
        });
      } else {
        toast.error("Failed to create Warehouse", {
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
      title="New Warehouse"
      description="Create a new Warehouse record"
      submitLabel={isSaving ? "Saving..." : "Create"}
      cancelLabel="Cancel"
    />
  );
}