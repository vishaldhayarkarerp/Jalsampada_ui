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

const API_BASE_URL = "http://103.219.1.138:4412//api/resource";

/* -------------------------------------------------
 1. Asset Category type – mirrors the API
 ------------------------------------------------- */
// Updated to match your screenshots
interface AssetCategoryData {
  name: string;
  asset_category_name?: string; // Frappe often has a 'asset_category_name' field
  custom_specifications?: Array<{ // The child table
    specification_type: string;
    details: string;
  }>;
}

/* -------------------------------------------------
 2. Page component
 ------------------------------------------------- */
export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const docname = params.id as string;
  const doctypeName = "Asset Category"; // <-- CHANGED

  const [category, setCategory] = React.useState<AssetCategoryData | null>(null); // <-- CHANGED
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
  3. FETCH CATEGORY
  ------------------------------------------------- */
  React.useEffect(() => {
    const fetchCategory = async () => {
      if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret || !docname) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const resp = await axios.get(`${API_BASE_URL}/${doctypeName}/${docname}`, {
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });

        setCategory(resp.data.data);
      } catch (err: any) {
        console.error("API Error:", err);
        setError(
          err.response?.status === 404
            ? `${doctypeName} not found`
            : err.response?.status === 403
              ? "Unauthorized"
              : `Failed to load ${doctypeName}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  /* -------------------------------------------------
  4. Build tabs **once** when data is ready
  ------------------------------------------------- */
  // Updated tabs based on your fields
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!category) return [];

    const fields = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        defaultValue:
          f.name in category
            ? // @ts-ignore
            category[f.name as keyof AssetCategoryData]
            : f.defaultValue,
      }));

    return [
      {
        name: "Details",
        fields: fields([
          // In Frappe, 'name' is often the ID, 'asset_category_name' is the editable field
          { name: "asset_category_name", label: "Category Name", type: "Data", required: true, defaultValue: category.name },
          {
            name: "custom_specifications", // This is the field name for the child table
            label: "Specifications",
            type: "Table",
            columns: [
              { name: "specification_type", label: "Specification Type", type: "Link", linkTarget: "Specifications" },
              { name: "details", label: "Details", type: "Text" },
            ],
          },
          // { name: "name", label: "Category ID (Read Only)", type: "Read Only", readOnlyValue: category.name },
        ]),
      },
    ];
  }, [category]);

  /* -------------------------------------------------
  5. SUBMIT
  ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>) => {
    setIsSaving(true);
    try {
      const payload = { ...data };

      // Ensure 'name' isn't overwritten if it's not the editable field
      // If 'category_name' is your main field, 'name' might be read-only
      // This submit handler assumes the form data is correct

      await axios.put(`${API_BASE_URL}/${doctypeName}/${docname}`, payload, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      toast.success("Changes saved successfully!");
      const categoryName = category?.asset_category_name || category?.name;
      if (categoryName) {
        router.push(`/lis-management/doctype/asset-category/${categoryName}`);
      } else {
        router.push(`/lis-management/doctype/asset-category`);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* -------------------------------------------------
  6. UI STATES
  ------------------------------------------------- */
  if (loading) {
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading {doctypeName} details...</p>
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

  if (!category) {
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        <p>{doctypeName} not found.</p>
      </div>
    );
  }

  /* -------------------------------------------------
  7. RENDER FORM
  ------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`Edit ${doctypeName}: ${category.name}`}
      description={`Update details for record ID: ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save Changes"}
      cancelLabel="Cancel"
    />
  );
}
