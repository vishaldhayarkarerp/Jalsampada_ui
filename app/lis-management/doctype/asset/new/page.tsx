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

const API_BASE_URL = "http://103.219.1.138:4412//api/resource";

export default function NewRecordPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  const doctypeName = "Asset";

  /* -------------------------------------------------
     1. Define the BLANK form structure
     ------------------------------------------------- */
  const formTabs: TabbedLayout[] = [
    {
      name: "Details",
      fields: [
        
        { name: "asset_name", label: "Asset Name", type: "Text", required: true },
        { name: "asset_category", label: "Asset Category", type: "Link", linkTarget: "Asset Category" },
        { name: "custom_asset_no", label: "Asset No", type: "Data" },
        { name: "company", label: "Company", type: "Link", required: true, linkTarget: "Company" },
        { name: "location", label: "Location", type: "Link", required: true, linkTarget: "Location" },
        { name: "custom_lis_name", label: "Lift Irrigation Scheme", type: "Link", linkTarget: "Lift Irrigation Scheme" },
        { name: "custom_stage_no", label: "Stage No.", type: "Link", linkTarget: "Stage No" },
        { name: "custom_serial_number", label: "Serial Number", type: "Data" },
        { name: "is_existing_asset", label: "Is Existing Asset", type: "Check", defaultValue: false },
        { name: "is_composite_asset", label: "Is Composite Asset", type: "Check", defaultValue: false },
        { name: "is_composite_component", label: "Is Composite Component", type: "Check", defaultValue: false },
        { name: "section_purchase", label: "Purchase Details", type: "Section Break" },
        
        // --- FIX #1: Make 'purchase_date' required ---
        // This is required by your "ACC-ASS-.YYYY.-" naming_series
        { name: "purchase_date", label: "Purchase Date", type: "Date", required: true },
        // ---------------------------------------------
        
        { name: "gross_purchase_amount", label: "Net Purchase Amount", type: "Currency", required: true },
        { name: "asset_quantity", label: "Asset Quantity", type: "Int", min: 1, defaultValue: 1 },
        { name: "additional_asset_cost", label: "Additional Asset Cost", type: "Currency" },
      ],
    },
    // ... other tabs ...
    {
      name: "Insurance",
      fields: [
        { name: "policy_number", label: "Policy number", type: "Data" },
        { name: "insurance_start_date", label: "Insurance Start Date", type: "Date" },
        { name: "insurer", label: "Insurer", type: "Data" },
        { name: "insurance_end_date", label: "Insurance End Date", type: "Date" },
        { name: "insured_value", label: "Insured value", type: "Currency" },
        { name: "comprehensive_insurance", label: "Comprehensive Insurance", type: "Check", defaultValue: false },
      ],
    },
    {
      name: "Other Info",
      fields: [
        { name: "custodian", label: "Custodian", type: "Link", linkTarget: "Employee" },
        { name: "department", label: "Department", type: "Link", linkTarget: "Department" },
        { name: "installation_date", label: "Installation Date", type: "Date" },
        { name: "equipement_make", label: "Equipement Make", type: "Link", linkTarget: "Equipement Make" },
        { name: "equipement_model", label: "Equipement Model", type: "Link", linkTarget: "Equipement Model" },
        { name: "last_repair_date", label: "Last Repair Date", type: "Date" },
        { name: "equipement_capacity", label: "Equipement Capacity", type: "Link", linkTarget: "Equipement Capacity" },
        { name: "equipement_rating", label: "Equipement Rating", type: "Link", linkTarget: "Rating" },
        { name: "maintenance_required", label: "Maintenance Required", type: "Check", defaultValue: false },
        { name: "custom_previous_hours", label: "Previous Running Hours", type: "Float" },
        {
          name: "custom_condition",
          label: "Condition",
          type: "Select",
          options: [{ label: "Working", value: "Working" },{ label: "Under Repair", value: "Under Repair", }],

        },
        { name: "custom_description", label: "Description", type: "Small Text" },

        { name: "section_specifications", label: "Specification of Asset", type: "Section Break" },
        {
          name: "custom_asset_specifications",
          label: "Asset Specifications",
          type: "Table",
          columns: [
            { name: "specification_type", label: "Specification Type", type: "Text" },
            { name: "details", label: "Details", type: "Text" },
          ],
        },
      ],
    },
    {
      name: "Drawing Attachment",
      fields: [
        {
          name: "custom_drawing_attachment",
          label: "Drawing Attachment",
          type: "Table",
          columns: [
            { name: "name_of_document", label: "Name of Document", type: "Text" },
            { name: "attachment", label: "Attachment", type: "Link" },
          ],
        },
      ],
    },
    
  ];

 /* -------------------------------------------------
     2. SUBMIT (Create) - Removing 'frappe' object
     ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    
    if (!isDirty) {
      toast.info("Please fill out the form to create an asset.");
      return;
    }

    setIsSaving(true);
    
    let finalPayload: Record<string, any> = {}; 
    
    try {
      const allFields = formTabs.flatMap(tab => tab.fields);

      const nonDataFields = new Set<string>();
      allFields.forEach(field => {
        if (
          field.type === "Section Break" ||
          field.type === "Column Break" ||
          field.type === "Button" ||
          field.type === "Read Only"
        ) {
          nonDataFields.add(field.name);
        }
      });

      for (const key in data) {
        if (!nonDataFields.has(key)) {
          finalPayload[key] = data[key] === undefined ? null : data[key];
        }
      }

      finalPayload.doctype = doctypeName;
      finalPayload.naming_series = "ACC-ASS-.YYYY.-";
      
      const boolFields = [
        "is_existing_asset", "is_composite_asset", "is_composite_component",
        "calculate_depreciation", "is_fully_depreciated",
        "maintenance_required", "comprehensive_insurance",
      ];
      boolFields.forEach((f) => {
        if (f in finalPayload) finalPayload[f] = finalPayload[f] ? 1 : 0;
      });

      const numericFields = [
        "gross_purchase_amount", "additional_asset_cost",
        "asset_quantity", "opening_accumulated_depreciation",
        "opening_number_of_booked_depreciations",
        "custom_previous_hours", "insured_value"
      ];
      numericFields.forEach((f) => {
        finalPayload[f] = Number(finalPayload[f]) || 0; 
      });

      const dateFields = [
        "purchase_date", "insurance_start_date", "insurance_end_date",
        "installation_date", "last_repair_date"
      ];
      dateFields.forEach((f) => {
        if (finalPayload[f] === "") {
          finalPayload[f] = null;
        }
      });

      const requiredNameFields = [
        "custom_lis_name",
        "custom_stage_no",
        "asset_category",
        "custom_asset_no",
      ];
      const missingNameFields = requiredNameFields.filter((field) => !finalPayload[field]);

      if (missingNameFields.length) {
        toast.error("Please fill LIS, Stage, Asset Category and Asset No before saving.");
        return;
      }

      const lisPrefix = String(finalPayload.custom_lis_name).slice(0, 3).toUpperCase();
      const stagePrefix = String(finalPayload.custom_stage_no).toUpperCase();
      const categoryPrefix = String(finalPayload.asset_category).slice(0, 2).toUpperCase();
      const assetSuffix = String(finalPayload.custom_asset_no);
      const customDocName = `${lisPrefix}${stagePrefix}${categoryPrefix}${assetSuffix}`;

      finalPayload.name = customDocName;
      finalPayload.custom_doctype_name = customDocName;

      console.log("Sending this NEW DOC to Frappe:", finalPayload);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `token ${apiKey}:${apiSecret}`,
      };

      // --- THIS IS THE FIX ---
      // Get the CSRF token from local storage
      const storedCsrfToken = localStorage.getItem('csrfToken');
      if (storedCsrfToken) {
        headers['X-Frappe-CSRF-Token'] = storedCsrfToken;
      }
      // We have REMOVED the 'frappe.csrf_token' line that caused the crash
      // -----------------------

      const resp = await fetch(`${API_BASE_URL}/${doctypeName}`, {
        method: 'POST',
        headers: headers,
        credentials: 'include', 
        body: JSON.stringify(finalPayload), 
      });

      const responseData = await resp.json();

      if (!resp.ok) {
        console.log("Full server error:", responseData);
        throw new Error(responseData.exception || responseData._server_messages || "Failed to create asset");
      }
      
      toast.success("Asset created successfully!");
      
      router.push(`/lis-management/doctype/asset`);

    } catch (err: any) {
      console.error("Save error:", err);
      console.log("Full server error message:", err.message); 
      toast.error("Failed to create Asset", {
        description: err.message || "Check the browser console (F12) for the full server error."
      });
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
      title="Create New Asset"
      description="Fill out the details for the new asset"
      submitLabel={isSaving ? "Creating..." : "Create Asset"}
      cancelLabel="Cancel"
    />
  );
}