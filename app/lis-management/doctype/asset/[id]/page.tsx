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

const API_BASE_URL = "http://103.219.1.138:4429/api/resource";

/* -------------------------------------------------
   1. Asset type – mirrors the API exactly
   ------------------------------------------------- */
interface AssetData {
  name: string;
  naming_series?: string;
  asset_name?: string;
  asset_category?: string;
  custom_asset_no?: string;
  location?: string;
  custom_lis_name?: string;
  custom_stage_no?: string;
  custom_serial_number?: string;
  status?: string;
  company?: string;
  asset_owner?: string;
  asset_owner_company?: string;
  is_existing_asset?: 0 | 1;
  is_composite_asset?: 0 | 1;
  is_composite_component?: 0 | 1;
  purchase_date?: string;
  gross_purchase_amount?: number;
  asset_quantity?: number;
  calculate_depreciation?: 0 | 1;
  opening_accumulated_depreciation?: number;
  opening_number_of_booked_depreciations?: number;
  is_fully_depreciated?: 0 | 1;
  depreciation_method?: string;
  value_after_depreciation?: number;
  maintenance_required?: 0 | 1;
  custom_previous_hours?: number;
  custom_condition?: string;

  // Insurance fields (may be missing)
  policy_number?: string;
  insurance_start_date?: string;
  insurer?: string;
  insurance_end_date?: string;
  insured_value?: number;
  comprehensive_insurance?: 0 | 1;

  // Other-info fields (may be missing)
  custodian?: string;
  department?: string;
  equipement_make?: string;
  equipement_model?: string;
  installation_date?: string;
  equipement_capacity?: string;
  last_repair_date?: string;
  equipement_rating?: string;

  // Child tables
  finance_books?: Array<{
    finance_book?: string;
    depreciation_method?: string;
    rate?: number;
  }>;
  custom_drawing_attachment?: Array<{
    name_of_document?: string;
    attachment?: string;
  }>;
  custom_asset_specifications?: Array<{
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
  const doctypeName = "Asset";

  const [asset, setAsset] = React.useState<AssetData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  /* -------------------------------------------------
     3. FETCH ASSET
     ------------------------------------------------- */
  React.useEffect(() => {
    const fetchAsset = async () => {
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

        setAsset(resp.data.data);
      } catch (err: any) {
        console.error("API Error:", err);
        setError(
          err.response?.status === 404
            ? "Asset not found"
            : err.response?.status === 403
              ? "Unauthorized"
              : "Failed to load asset"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

  /* -------------------------------------------------
     4. Build tabs **once** when asset is ready
     ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    if (!asset) return [];

    const bool = (v?: 0 | 1) => v === 1;

    const fields = (list: FormField[]): FormField[] =>
      list.map((f) => ({
        ...f,
        defaultValue:
          f.name in asset
            ? // @ts-ignore – asset has the key
            asset[f.name as keyof AssetData]
            : f.defaultValue,
      }));

    return [
      {
        name: "Details",
        fields: fields([
          {
            name: "naming_series",
            label: "Series",
            type: "Select",
            options: [{ label: "ACC-ASS-.YYYY.-", value: "ACC-ASS-.YYYY.-" }],
          },
          { name: "status", label: "Status", type: "Read Only" },
          { name: "asset_name", label: "Asset Name", type: "Text", required: true },
          { name: "company", label: "Company", type: "Link", required: true },
          { name: "asset_category", label: "Asset Category", type: "Link" },
          {
            name: "asset_owner",
            label: "Asset Owner",
            type: "Select",
            options: [{ label: "Company", value: "Company" }],
          },
          { name: "custom_asset_no", label: "Asset No", type: "Data" },
          { name: "asset_owner_company", label: "Asset Owner Company", type: "Link" },
          { name: "location", label: "Location", type: "Link", required: true },
          { name: "is_existing_asset", label: "Is Existing Asset", type: "Check" },
          { name: "custom_lis_name", label: "Lift Irrigation Scheme", type: "Data" },
          { name: "is_composite_asset", label: "Is Composite Asset", type: "Check" },
          { name: "custom_stage_no", label: "Stage No.", type: "Data" },
          { name: "is_composite_component", label: "Is Composite Component", type: "Check" },
          { name: "custom_serial_number", label: "Serial Number", type: "Data" },
          { name: "section_purchase", label: "Purchase Details", type: "Section Break" },
          { name: "purchase_date", label: "Purchase Date", type: "Date" },
          { name: "gross_purchase_amount", label: "Net Purchase Amount", type: "Currency", required: true },
          { name: "asset_quantity", label: "Asset Quantity", type: "Int", min: 1 },
        ]),
      },

      {
        name: "Insurance",
        fields: fields([
          { name: "policy_number", label: "Policy number", type: "Data" },
          { name: "insurance_start_date", label: "Insurance Start Date", type: "Date" },
          { name: "insurer", label: "Insurer", type: "Data" },
          { name: "insurance_end_date", label: "Insurance End Date", type: "Date" },
          { name: "insured_value", label: "Insured value", type: "Currency" },
          { name: "comprehensive_insurance", label: "Comprehensive Insurance", type: "Check" },
        ]),
      },

      {
        name: "Other Info",
        fields: fields([
          { name: "custodian", label: "Custodian", type: "Data" },
          { name: "department", label: "Department", type: "Data" },
          { name: "equipement_make", label: "Equipement Make", type: "Data" },
          { name: "maintenance_required", label: "Maintenance Required", type: "Check" },
          { name: "equipement_model", label: "Equipement Model", type: "Data" },
          { name: "installation_date", label: "Installation Date", type: "Date" },
          { name: "equipement_capacity", label: "Equipement Capacity", type: "Data" },
          { name: "last_repair_date", label: "Last Repair Date", type: "Date" },
          { name: "equipement_rating", label: "Equipement Rating", type: "Data" },
          { name: "custom_previous_hours", label: "Previous Running Hours", type: "Float" },
          {
            name: "custom_condition",
            label: "Condition",
            type: "Select",
            options: [{ label: "Working", value: "Working" }],
          },
          { name: "section_specifications", label: "Specification of Asset", type: "Section Break" },
          {
            name: "custom_asset_specifications",
            label: "Asset Specifications",
            type: "Table",
            columns: [
              { name: "specification_type", label: "Specification Type", type: "text" },
              { name: "details", label: "Details", type: "text" },
            ],
          },
        ]),
      },

      {
        name: "Drawing Attachment",
        fields: fields([
          {
            name: "custom_drawing_attachment",
            label: "Drawing Attachment",
            type: "Table",
            columns: [
              { name: "name_of_document", label: "Name of Document", type: "text" },
              { name: "attachment", label: "Attachment", type: "Link" },
            ],
          },
        ]),
      },

      {
        name: "Depreciation",
        fields: fields([
          { name: "calculate_depreciation", label: "Calculate Depreciation", type: "Check" },
          { name: "opening_accumulated_depreciation", label: "Opening Accumulated Depreciation", type: "Currency" },
          { name: "opening_number_of_booked_depreciations", label: "Opening Booked Depreciations", type: "Int" },
          { name: "is_fully_depreciated", label: "Is Fully Depreciated", type: "Check" },
          {
            name: "depreciation_method",
            label: "Depreciation Method",
            type: "Select",
            options: [
              { label: "Straight Line", value: "Straight Line" },
              { label: "Written Down Value", value: "Written Down Value" },
            ],
          },
          { name: "value_after_depreciation", label: "Value After Depreciation", type: "Currency" },
          {
            name: "finance_books",
            label: "Finance Books",
            type: "Table",
            columns: [
              { name: "finance_book", label: "Finance Book", type: "text" },
              { name: "depreciation_method", label: "Depreciation Method", type: "text" },
              { name: "rate", label: "Rate (%)", type: "number" },
            ],
          },
        ]),
      },
    ];
  }, [asset]);

  /* -------------------------------------------------
     5. SUBMIT – convert booleans → 0/1
     ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>) => {
    setIsSaving(true);
    try {
      const payload = { ...data };

      const boolFields = [
        "is_existing_asset",
        "is_composite_asset",
        "is_composite_component",
        "calculate_depreciation",
        "is_fully_depreciated",
        "maintenance_required",
        "comprehensive_insurance",
      ];

      boolFields.forEach((f) => {
        if (f in payload) payload[f] = payload[f] ? 1 : 0;
      });

      await axios.put(`${API_BASE_URL}/${doctypeName}/${docname}`, payload, {
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      alert("Changes saved!");
      router.push(`/lis-management/doctype/${doctypeName}`);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save. Check console for details.");
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
        <p>Loading asset details...</p>
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

  if (!asset) {
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        <p>Asset not found.</p>
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
      title={`Edit Asset: ${asset.name}`}
      description={`Update details for record ID: ${docname}`}
      submitLabel={isSaving ? "Saving..." : "Save Changes"}
      cancelLabel="Cancel"
    />
  );
}