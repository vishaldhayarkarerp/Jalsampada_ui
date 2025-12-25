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

/* -------------------------------------------------
 1. Asset Category type – mirrors the API
 ------------------------------------------------- */
interface AssetCategoryData {
  name?: string;
  asset_category_name?: string;
  custom_specifications?: Array<{
    specification_type: string;
    details: string;
  }>;
}

/* -------------------------------------------------
 2. Page component
 ------------------------------------------------- */
export default function NewAssetCategoryPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const doctypeName = "Asset Category";
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
  3. Form tabs configuration
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    return [
      {
        name: "Details",
        fields: [
          { name: "asset_category_name", label: "Category Name", type: "Data", required: true },
          {
            name: "custom_specifications",
            label: "Specifications",
            type: "Table",
            columns: [
               { name: "specification_type", label: "Specification Type", type: "Link", linkTarget: "Specifications" },
              { name: "details", label: "Details", type: "Text" },
            ],
          },
        ],
      }
    ];
  }, []);

  /* -------------------------------------------------
  4. SUBMIT
  ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>) => {
    if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) {
      toast.error("Authentication required. Please log in.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...data };

      // Remove auto-generated name field if present
      if (payload.name === "Will be auto-generated") {
        delete payload.name;
      }

      const response = await axios.post(`${API_BASE_URL}/${doctypeName}`, payload, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      toast.success("Asset Category created successfully!");
      
      // Navigate to the newly created record using asset_category_name
      const newCategoryName = response.data.data.asset_category_name || response.data.data.name;
      router.push(`/lis-management/doctype/asset-category/${newCategoryName}`);
      
    } catch (err: any) {
      console.error("Create error:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to create Asset Category. Check console for details.";
      toast.error(`Error: ${errorMessage}`);
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
      description="Create a new asset category with specifications"
      submitLabel={isSaving ? "Creating..." : "Create Asset Category"}
      cancelLabel="Cancel"
    />
  );
}