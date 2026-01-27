"use client";

import * as React from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
    DynamicForm,
    TabbedLayout,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { fetchAssetsFromLisAndStage } from "../services";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";
// Backend DocType name
const DOCTYPE_NAME = "Material Request";

export default function SpareIndentDetailPage() {
    const params = useParams();
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
    const docname = params.id as string;

    const [record, setRecord] = React.useState<any | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [formMethods, setFormMethods] = React.useState<UseFormReturn<any> | null>(null);

    // 🟢 1. FETCH RECORD
    const fetchRecord = async () => {
        if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) return;
        try {
            setLoading(true);
            const resp = await axios.get(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, {
                headers: { Authorization: `token ${apiKey}:${apiSecret}` },
            });
            setRecord(resp.data.data);
        } catch (err: any) {
            toast.error("Failed to load record.");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { fetchRecord(); }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

    // 🟢 HELPER: GET CURRENT STATUS
    const getCurrentStatus = () => {
        if (!record) return "";
        // Priority: DocStatus -> Workflow State -> Status field
        if (record.docstatus === 2) return "Cancelled";
        if (record.docstatus === 1) return record.status || "Submitted";
        // If Draft
        if (formMethods?.formState.isDirty) return "Not Saved";
        return record.workflow_state || record.status || "Draft";
    };

    // 🟢 FORM DEFINITION
    const formTabs: TabbedLayout[] = React.useMemo(() => {
        if (!record) return [];
        const getVal = (key: string, def?: any) => record[key] ?? def;

        return [
            {
                name: "Details",
                fields: [
                    {
                        name: "material_request_type",
                        label: "Purpose",
                        type: "Select",
                        options: [
                            { label: "Material Issue", value: "Material Issue" },
                            { label: "Material Transfer", value: "Material Transfer" },
                        ],
                        defaultValue: getVal("material_request_type"),
                        required: true,
                    },

                    {
                        name: "transaction_date",
                        label: "Date",
                        type: "Date",
                        defaultValue: getVal("transaction_date"),
                        required: true,
                    },
                    {
                        name: "schedule_date",
                        label: "Required By",
                        type: "Date",
                        defaultValue: getVal("schedule_date"),
                        required: true,
                    },
                    {
                        name: "custom_prepared_by",
                        label: "Prepared By",
                        type: "Link",
                        linkTarget: "Employee",
                        defaultValue: getVal("custom_prepared_by"),
                    },
                    {
                        name: "custom_designation",
                        label: "Designation",
                        type: "Data",
                        readOnly: true,
                        defaultValue: getVal("custom_designation"),
                    },
                    {
                        name: "buying_price_list",
                        label: "Price List",
                        type: "Link",
                        linkTarget: "Price List",
                        defaultValue: getVal("buying_price_list"),
                    },
                    { name: "custom_section_break_9pzmb", label: "LIS Details", type: "Section Break" },
                    {
                        name: "custom_lis_name",
                        label: "LIS Name",
                        type: "Link",
                        linkTarget: "Lift Irrigation Scheme",
                        defaultValue: getVal("custom_lis_name"),
                    },
                    {
                        name: "custom_stage",
                        label: "Stage",
                        type: "Link",
                        linkTarget: "Stage No",
                        defaultValue: getVal("custom_stage"),
                        filterMapping: [{ sourceField: "custom_lis_name", targetField: "lis_name" }]
                    },
                    {
                        name: "custom_asset_category",
                        label: "Asset category",
                        type: "Link",
                        linkTarget: "Asset Category",
                        defaultValue: getVal("custom_asset_category"),
                    },

                    {
                        name: "custom_assets",
                        label: "Assets",
                        type: "Table MultiSelect",
                        linkTarget: "Asset",
                        defaultValue: getVal("custom_assets"),
                    },

                    // ── Items / Warehouse Section ───────────────────────────────────
                    { name: "warehouse_section", label: "Items", type: "Section Break" },
                    {
                        name: "scan_barcode",
                        label: "Scan Barcode",
                        type: "Data",
                        placeholder: "Barcode",
                        defaultValue: getVal("scan_barcode"),
                    },

                    {
                        name: "set_warehouse",
                        label: "Set Target Warehouse",
                        type: "Link",
                        linkTarget: "Warehouse",
                        defaultValue: getVal("set_warehouse"),
                    },
                    {
                        name: "set_from_warehouse",
                        label: "Set Source Warehouse",
                        type: "Link",
                        linkTarget: "Warehouse",
                        defaultValue: getVal("set_from_warehouse"),
                        displayDependsOn: "material_request_type == 'Material Transfer'",
                    },

                    {
                        name: "items",
                        label: "Items",
                        type: "Table",
                        required: true,
                        defaultValue: getVal("items", []),
                        columns: [
                            { name: "item_code", label: "Item Code", type: "Link", linkTarget: "Item", required: true },
                            { name: "item_name", label: "Item Name", type: "Data", readOnly: true },
                            { name: "description", label: "Description", type: "Text" },
                            { name: "qty", label: "Quantity", type: "Float", required: true },
                            { name: "uom", label: "UOM", type: "Link", linkTarget: "UOM" },
                            { name: "warehouse", label: "Target Warehouse", type: "Link", linkTarget: "Warehouse" },
                            { name: "rate", label: "Rate", type: "Currency", precision: 2 },
                            { name: "amount", label: "Amount", type: "Currency", readOnly: true, precision: 2 },
                        ],
                    },
                    // ── Approval Section ────────────────────────────────────────────
                    { name: "custom_approval_section", label: "Approval Section", type: "Section Break" },
                    {
                        name: "custom_recommended_by",
                        label: "Recommended By (Incharge/JE)",
                        type: "Link",
                        linkTarget: "User",
                        defaultValue: getVal("custom_recommended_by"),
                    },
                    {
                        name: "custom_verified_by",
                        label: "Verified By (DE)",
                        type: "Link",
                        linkTarget: "Employee",
                        defaultValue: getVal("custom_verified_by"),
                    },
                    {
                        name: "custom_approved_by",
                        label: "Approved By (EE)",
                        type: "Link",
                        linkTarget: "Employee",
                        defaultValue: getVal("custom_approved_by"),
                    },
                    {
                        name: "custom_name1",
                        label: "Name",
                        type: "Data",
                        readOnly: true,
                        defaultValue: getVal("custom_name1"),
                    },
                    {
                        name: "custom_name2",
                        label: "Name",
                        type: "Data",
                        readOnly: true,
                        defaultValue: getVal("custom_name2"),
                    },
                    {
                        name: "custom_name3",
                        label: "Name",
                        type: "Data",
                        readOnly: true,
                        defaultValue: getVal("custom_name3"),
                    },
                    { name: "custom_date1", label: "Date", type: "Date", defaultValue: getVal("custom_date1") },
                    { name: "custom_date2", label: "Date", type: "Date", defaultValue: getVal("custom_date2") },
                    { name: "custom_date3", label: "Date", type: "Date", defaultValue: getVal("custom_date3") },
                ],
            },

            // ── Terms Tab ───────────────────────────────────────────────────────
            {
                name: "Terms",
                fields: [
                    {
                        name: "tc_name",
                        label: "Terms",
                        type: "Link",
                        linkTarget: "Terms and Conditions",
                        defaultValue: getVal("tc_name"),
                    },
                    {
                        name: "terms",
                        label: "Terms and Conditions Content",
                        type: "Markdown Editor",
                        defaultValue: getVal("terms"),
                    },
                ],
            },

            // ── More Info / Status Tab ──────────────────────────────────────────
            {
                name: "More Info",
                fields: [
                    {
                        name: "letter_head",
                        label: "Letter Head",
                        type: "Link",
                        linkTarget: "Letter Head",
                        defaultValue: getVal("letter_head"),
                    },
                    {
                        name: "select_print_heading",
                        label: "Print Heading",
                        type: "Link",
                        linkTarget: "Print Heading",
                        defaultValue: getVal("select_print_heading"),
                    }
                ],
            },
        ];
    }, [record]);

    // 🟢 UPDATE (SAVE) HANDLER
    const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
        if (!isDirty) { toast.info("No changes to save."); return; }

        setIsSaving(true);
        try {
            // Preserve docstatus and modified timestamp
            const payload: Record<string, any> = {
                ...data,
                modified: record?.modified,
                docstatus: record?.docstatus
            };

            await axios.put(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, payload, {
                headers: { Authorization: `token ${apiKey}:${apiSecret}` },
            });
            toast.success("Spare Indent updated successfully!");
            fetchRecord();
        } catch (err: any) {
            toast.error("Failed to update record", { duration: Infinity });
        } finally {
            setIsSaving(false);
        }
    };

    // 🟢 ASSET FETCHING EFFECT
    React.useEffect(() => {
        if (!formMethods || !apiKey || !apiSecret) return;

        const subscription = formMethods.watch(async (values, { name }) => {
            if (name !== "custom_asset_category") return;

            const customLisName = values.custom_lis_name;
            const customStage = values.custom_stage;
            const customAssetCategory = values.custom_asset_category;

            if (!customLisName || !customStage || !customAssetCategory) return;

            try {
                const assets = await fetchAssetsFromLisAndStage(
                    {
                        custom_lis_name: customLisName,
                        custom_stage: customStage,
                        custom_asset_category: customAssetCategory,
                    },
                    apiKey,
                    apiSecret
                );

                formMethods.setValue("custom_assets", assets, { shouldDirty: true });
            } catch (error) {
                console.error("Failed to fetch assets:", error);
                toast.error("Failed to load assets", { duration: Infinity });
            }
        });

        return () => subscription.unsubscribe();
    }, [apiKey, apiSecret, formMethods]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Indent...</div>;
    if (!record) return <div className="p-8 text-center">Record not found.</div>;

    return (
        <DynamicForm
            tabs={formTabs}
            onSubmit={handleSubmit}
            title={`Spare Indent: ${record.name}`}
            submitLabel={isSaving ? "Saving..." : "Save Changes"}
            docstatus={record.docstatus}
            initialStatus={getCurrentStatus()}
            onFormInit={setFormMethods}
            deleteConfig={{
                doctypeName: DOCTYPE_NAME,
                docName: docname,
                redirectUrl: "/operations/doctype/spare-indent"
            }}
        />
    );
}