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

export default function NewSpareIndentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKey, apiSecret } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  // The actual DocType name is "Material Request"
  const doctypeName = "Material Request";

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
      toast.error("Failed to parse duplicate data", { duration: Infinity });
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
            name: "title",
            label: "Title",
            type: "Data",
            defaultValue: getValue("title"),
          },
          {
            name: "material_request_type",
            label: "Purpose",
            type: "Select",
            options: "Purchase\nMaterial Transfer\nMaterial Issue\nManufacture\nCustomer Provided",
            required: true,
            defaultValue: getValue("material_request_type", "Purchase"),
          },
          {
            name: "customer",
            label: "Customer",
            type: "Link",
            linkTarget: "Customer",
            defaultValue: getValue("customer"),
          },
          {
            name: "company",
            label: "Company",
            type: "Link",
            linkTarget: "Company",
            required: true,
            defaultValue: getValue("company"),
          },
          {
            name: "transaction_date",
            label: "Transaction Date",
            type: "Date",
            // 🟢 FIXED: Use valid ISO date string
            defaultValue: getValue("transaction_date", new Date().toISOString().split('T')[0]),
            required: true,
          },
          {
            name: "schedule_date",
            label: "Required By",
            type: "Date",
            defaultValue: getValue("schedule_date"),
          },
          {
            name: "buying_price_list",
            label: "Price List",
            type: "Link",
            linkTarget: "Price List",
            defaultValue: getValue("buying_price_list"),
          },

          // Warehouse & Scan
          { name: "warehouse_section", label: "Warehouse", type: "Section Break" },
          {
            name: "set_from_warehouse",
            label: "Set Source Warehouse",
            type: "Link",
            linkTarget: "Warehouse",
            defaultValue: getValue("set_from_warehouse"),
          },
          {
            name: "set_warehouse",
            label: "Set Target Warehouse",
            type: "Link",
            linkTarget: "Warehouse",
            defaultValue: getValue("set_warehouse"),
          },

          // Items Table
          { name: "items_section", label: "Items", type: "Section Break" },
          {
            name: "items",
            label: "Items",
            type: "Table",
            defaultValue: getValue("items", []),
            columns: [
              { name: "item_code", label: "Item Code", type: "Link", linkTarget: "Item" },
              { name: "item_name", label: "Item Name", type: "Data" },
              { name: "description", label: "Description", type: "Small Text" },
              { name: "qty", label: "Qty", type: "Float" },
              { name: "uom", label: "UOM", type: "Link", linkTarget: "UOM" },
              { name: "warehouse", label: "Warehouse", type: "Link", linkTarget: "Warehouse" },
              { name: "rate", label: "Rate", type: "Currency" },
              { name: "amount", label: "Amount", type: "Currency" },
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
    const hasValidData = isDirty || (duplicateData && data.company);
    
    if (!hasValidData) {
      toast.info("Please fill out the form.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const payload: Record<string, any> = { ...data };
      
      // Remove layout/break fields
      const nonDataFields = new Set([
        "warehouse_section", "items_section",
      ]);

      const finalPayload: Record<string, any> = {
        doctype: doctypeName,
      };

      for (const key in payload) {
        if (!nonDataFields.has(key)) {
          finalPayload[key] = payload[key];
        }
      }

      // Ensure numeric values in child table
      if (finalPayload.items) {
        finalPayload.items = finalPayload.items.map((row: any) => ({
          ...row,
          qty: Number(row.qty) || 0,
          rate: Number(row.rate) || 0,
          amount: Number(row.amount) || 0,
        }));
      }

      console.log("Sending NEW Material Request payload:", finalPayload);
      
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
        body: JSON.stringify(finalPayload), 
      });

      const responseData = await resp.json();

      if (!resp.ok) {
        console.log("Full server error:", responseData);
        throw new Error(responseData.exception || responseData._server_messages || "Failed to create document");
      }
      
      toast.success("Material Request created successfully!");
      
      router.push(`/operations/doctype/spare-indent`);

    } catch (err: any) {
      console.error("Save error:", err);
      
      if (err.response?.data?.exc_type === "DuplicateEntryError") {
        toast.error("Duplicate Entry Error", {
          description: "This record may already exist.",
          duration: Infinity
        });
      } else {
        toast.error("Failed to create record", {
          description: err.message || "Check console for details.",
          duration: Infinity
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
      title="New Material Request"
      description="Create a new Material Request (Spare Indent)"
      submitLabel={isSaving ? "Saving..." : "Create"}
      cancelLabel="Cancel"
    />
  );
}