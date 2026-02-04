"use client";

import * as React from "react";
import axios from "axios";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DynamicForm, TabbedLayout } from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getApiMessages } from "@/lib/utils";

const API_BASE_URL = "http://103.219.3.169:2223/api/resource";
const DOCTYPE_NAME = "Asset Interchange";

interface AssetInterchangeData {
    name: string;
    lis_name?: string;
    stage?: string;
    posting_date?: string;
    which_asset_to_interchange?: "Motor" | "Pump";

    pump_asset?: string;
    pump_no?: string;
    current_motor_asset?: string;
    motor_no?: string;
    interchange_motor?: string;
    interchange_motor_no?: string;
    current_motor_no?: string;

    motor_asset?: string;
    motor_no_for_pump?: string;
    current_pump_asset?: string;
    current_pump_no?: string;
    interchange_pump?: string;
    interchange_pump_no?: string;

    docstatus: 0 | 1 | 2;
    modified: string;
}

export default function AssetInterchangeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
    const docname = decodeURIComponent(params.id as string);
    const searchParams = useSearchParams();
    const assetType = searchParams.get("asset");

    const [record, setRecord] = React.useState<AssetInterchangeData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [selectedAsset, setSelectedAsset] = React.useState<"Motor" | "Pump" | "">("");

    // 🟢 STATUS BADGE
    const getCurrentStatus = () => {
        if (!record) return "";
        if (record.docstatus === 2) return "Cancelled";
        if (record.docstatus === 1) return "Submitted";
        return "Draft";
    };

    // 🟢 FETCH RECORD
    const fetchDoc = async () => {
        if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) return;
        try {
            setLoading(true);
            const resp = await axios.get(`${API_BASE_URL}/${encodeURIComponent(DOCTYPE_NAME)}/${docname}`, {
                headers: { Authorization: `token ${apiKey}:${apiSecret}` },
            });
            const data = resp.data.data;
            setRecord(data);
            setSelectedAsset(data.which_asset_to_interchange || "");
        } catch {
            setError("Failed to load record");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { fetchDoc(); }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

    const handleAssetChange = (value: "Motor" | "Pump") => setSelectedAsset(value);

    // 🟢 SUBMIT DOC
    const handleSubmitDocument = async () => {
        if (!record) return;
        setIsSaving(true);
        try {
            const resp = await axios.put(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, {
                docstatus: 1,
                modified: record.modified
            }, { headers: { Authorization: `token ${apiKey}:${apiSecret}` } });

            const msg = getApiMessages(resp, null, "Document submitted!", "Submit failed");
            msg.success ? toast.success(msg.message) : toast.error(msg.message);
            setRecord(resp.data.data);
        } catch {
            toast.error("Failed to submit");
        } finally { setIsSaving(false); }
    };

    // 🟢 CANCEL DOC
    const handleCancelDocument = async () => {
        if (!record) return;
        setIsSaving(true);
        try {
            const resp = await axios.put(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, {
                docstatus: 2,
                modified: record.modified
            }, { headers: { Authorization: `token ${apiKey}:${apiSecret}` } });

            const msg = getApiMessages(resp, null, "Document cancelled!", "Cancel failed");
            msg.success ? toast.success(msg.message) : toast.error(msg.message);
            setRecord(resp.data.data);
        } catch {
            toast.error("Failed to cancel");
        } finally { setIsSaving(false); }
    };

    // 🟢 FORM
    const formTabs: TabbedLayout[] = React.useMemo(() => {
        if (!record) return [];
        const getValue = (f: keyof AssetInterchangeData) => record[f];

        return [{
            name: "Details",
            fields: [
                { name: "lis_name", label: "LIS Name", type: "Link", linkTarget: "Lift Irrigation Scheme", defaultValue: getValue("lis_name") },
                { name: "stage", label: "Stage", type: "Link", linkTarget: "Stage No", defaultValue: getValue("stage"), filterMapping: [{ sourceField: "lis_name", targetField: "lis_name" }] },
                { name: "posting_date", label: "Posting Date", type: "Date", defaultValue: getValue("posting_date") },
                {
                    name: "which_asset_to_interchange",
                    label: "Which Asset To Interchange?",
                    type: "Select",
                    options: [{ label: "Motor", value: "Motor" }, { label: "Pump", value: "Pump" }],
                    defaultValue: assetType || getValue("which_asset_to_interchange"),
                    onChange: handleAssetChange,
                },

                // 🔵 MOTOR SECTION
                { name: "motor_section", type: "Section Break", label: "Interchange Motor", displayDependsOn: { which_asset_to_interchange: "Motor" } },
                { name: "pump_asset", label: "Pump Asset", type: "Link", linkTarget: "Asset", displayDependsOn: { which_asset_to_interchange: "Motor" }, defaultValue: getValue("pump_asset") },
                { name: "pump_no", label: "Pump No", type: "Read Only", fetchFrom: { sourceField: "pump_asset", targetDoctype: "Asset", targetField: "custom_asset_no" }, displayDependsOn: { which_asset_to_interchange: "Motor" }, defaultValue: getValue("pump_no") },
                { name: "current_motor_asset", label: "Current Motor Asset", type: "Read Only", displayDependsOn: { which_asset_to_interchange: "Motor", pump_asset: true }, defaultValue: getValue("current_motor_asset") },
                { name: "current_motor_no", label: "Current Motor No", type: "Data", displayDependsOn: { which_asset_to_interchange: "Motor", pump_asset: true }, defaultValue: getValue("current_motor_no") },
                { name: "interchange_motor", label: "Interchange Motor", type: "Link", linkTarget: "Asset", displayDependsOn: { which_asset_to_interchange: "Motor", pump_asset: true }, defaultValue: getValue("interchange_motor") },
                { name: "interchange_motor_no", label: "Interchange Motor No", type: "Data", displayDependsOn: { which_asset_to_interchange: "Motor", pump_asset: true }, defaultValue: getValue("interchange_motor_no") },

                // 🔵 PUMP SECTION
                { name: "pump_section", type: "Section Break", label: "Interchange Pump", displayDependsOn: { which_asset_to_interchange: "Pump" } },
                { name: "motor_asset", label: "Motor Asset", type: "Link", linkTarget: "Asset", defaultValue: getValue("motor_asset"), displayDependsOn: { which_asset_to_interchange: "Pump" } },
                { name: "motor_no_for_pump", label: "Motor No", type: "Read Only", fetchFrom: { sourceField: "motor_asset", targetDoctype: "Asset", targetField: "custom_asset_no" }, defaultValue: getValue("motor_no_for_pump"), displayDependsOn: { which_asset_to_interchange: "Pump" } },
                { name: "current_pump_asset", label: "Current Pump Asset", type: "Read Only", defaultValue: getValue("current_pump_asset"), displayDependsOn: { which_asset_to_interchange: "Pump", motor_asset: true } },
                { name: "current_pump_no", label: "Current Pump No", type: "Data", defaultValue: getValue("current_pump_no"), displayDependsOn: { which_asset_to_interchange: "Pump", motor_asset: true } },
                { name: "interchange_pump", label: "Interchange Pump", type: "Link", linkTarget: "Asset", defaultValue: getValue("interchange_pump"), displayDependsOn: { which_asset_to_interchange: "Pump", motor_asset: true } },
                { name: "interchange_pump_no", label: "Interchange Pump No", type: "Data", defaultValue: getValue("interchange_pump_no"), displayDependsOn: { which_asset_to_interchange: "Pump", motor_asset: true } },
            ],
        }];
    }, [record, selectedAsset]);

    const handleSubmit = async (data: Record<string, any>, isDirty?: boolean) => {
        if (!record || !isDirty) { toast.info("No changes to save."); return; }
        setIsSaving(true);
        try {
            await axios.put(`${API_BASE_URL}/${DOCTYPE_NAME}/${docname}`, { ...data, modified: record.modified }, { headers: { Authorization: `token ${apiKey}:${apiSecret}` } });
            toast.success("Saved!");
            fetchDoc();
        } catch { toast.error("Save failed"); }
        finally { setIsSaving(false); }
    };

    if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;
    if (!record) return <div style={{ padding: "2rem" }}>Not found</div>;

    return (
        <DynamicForm
            tabs={formTabs}
            onSubmit={handleSubmit}
            onSubmitDocument={handleSubmitDocument}
            onCancelDocument={handleCancelDocument}
            onCancel={() => router.back()}
            title={`${DOCTYPE_NAME}: ${record.name}`}
            description="Update Asset Interchange"
            submitLabel={isSaving ? "Saving..." : "Save"}
            isSubmittable={true}
            docstatus={record.docstatus}
            initialStatus={getCurrentStatus()}
            deleteConfig={{ doctypeName: DOCTYPE_NAME, docName: docname, redirectUrl: "/assets/doctype/asset-interchange" }}
        />
    );
}