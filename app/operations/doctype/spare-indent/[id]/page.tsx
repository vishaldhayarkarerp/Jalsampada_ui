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
   1. Material Request interface
   ------------------------------------------------- */
interface MaterialRequestData {
    name: string;
    naming_series?: string;
    title?: string;
    material_request_type?: string;
    customer?: string;
    company?: string;
    transaction_date?: string;
    schedule_date?: string;
    buying_price_list?: string;
    amended_from?: string;
    scan_barcode?: string;
    last_scanned_warehouse?: string;
    set_from_warehouse?: string;
    set_warehouse?: string;
    items?: Array<{
        // Material Request Item fields (simplified - add more as per your actual child doctype)
        item_code?: string;
        item_name?: string;
        description?: string;
        qty?: number;
        uom?: string;
        warehouse?: string;
        rate?: number;
        amount?: number;
    }>;
    status?: string;
    per_ordered?: number;
    transfer_status?: string;
    per_received?: number;
    letter_head?: string;
    select_print_heading?: string;
    job_card?: string;
    work_order?: string;
    docstatus: 0 | 1 | 2;
    modified: string;
}

/* -------------------------------------------------
   2. Page component
   ------------------------------------------------- */
export default function MaterialRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

    const docname = params.id as string;
    const doctypeName = "Material Request";

    const [record, setRecord] = React.useState<MaterialRequestData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);

    /* -------------------------------------------------
       3. FETCH RECORD
       ------------------------------------------------- */
    React.useEffect(() => {
        const fetchRecord = async () => {
            if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret || !docname) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const resp = await axios.get(`${API_BASE_URL}/${doctypeName}/${docname}`, {
                    headers: {
                        Authorization: `token ${apiKey}:${apiSecret}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                });

                setRecord(resp.data.data);
            } catch (err: any) {
                console.error("API Error:", err);
                setError(
                    err.response?.status === 404
                        ? "Material Request not found"
                        : err.response?.status === 403
                            ? "Unauthorized"
                            : "Failed to load record"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchRecord();
    }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

    /* -------------------------------------------------
       4. Form structure
       ------------------------------------------------- */
    const formTabs: TabbedLayout[] = React.useMemo(() => {
        if (!record) return [];

        const fields = (list: FormField[]): FormField[] =>
            list.map((f) => ({
                ...f,
                defaultValue:
                    f.name in record
                        ? record[f.name as keyof MaterialRequestData]
                        : f.defaultValue,
            }));

        return [
            {
                name: "Details",
                fields: fields([
                   
                    {
                        name: "title",
                        label: "Title",
                        type: "Data",
                    },
                    {
                        name: "material_request_type",
                        label: "Purpose",
                        type: "Select",
                        options: "Purchase\nMaterial Transfer\nMaterial Issue\nManufacture\nCustomer Provided",
                        required: true,
                    },
                    {
                        name: "customer",
                        label: "Customer",
                        type: "Link",
                        linkTarget: "Customer",
                    },
                    {
                        name: "company",
                        label: "Company",
                        type: "Link",
                        linkTarget: "Company",
                        required: true,
                    },
                    {
                        name: "transaction_date",
                        label: "Transaction Date",
                        type: "Date",
                        defaultValue: "Today",
                        required: true,
                    },
                    {
                        name: "schedule_date",
                        label: "Required By",
                        type: "Date",
                    },
                    {
                        name: "buying_price_list",
                        label: "Price List",
                        type: "Link",
                        linkTarget: "Price List",
                    },

                    // Warehouse & Scan
                    { name: "warehouse_section", label: "Warehouse", type: "Section Break" },
                   
                    {
                        name: "set_from_warehouse",
                        label: "Set Source Warehouse",
                        type: "Link",
                        linkTarget: "Warehouse",
                    },
                    {
                        name: "set_warehouse",
                        label: "Set Target Warehouse",
                        type: "Link",
                        linkTarget: "Warehouse",
                    },

                    // Items Table
                    { name: "items_section", label: "Items", type: "Section Break" },
                    {
                        name: "items",
                        label: "Items",
                        type: "Table",
                        columns: [
                            // Common Material Request Item fields
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
                ]),
            },
            
        ];
    }, [record]);

    /* -------------------------------------------------
       5. SUBMIT HANDLER
       ------------------------------------------------- */
    const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
        if (!isDirty) {
            toast.info("No changes to save.");
            return;
        }

        setIsSaving(true);

        try {
            const payload = { ...data };

            // Remove layout/break fields
            const nonDataFields = new Set([
                "column_break_2", "warehouse_section", "column_break5",
                "items_section", "terms_section_break", "status_section",
                "column_break2", "printing_details", "column_break_31",
                "reference", "column_break_35",
            ]);

            const finalPayload: Record<string, any> = {};
            for (const key in payload) {
                if (!nonDataFields.has(key)) {
                    finalPayload[key] = payload[key];
                }
            }

            // Preserve system fields
            if (record) {
                finalPayload.modified = record.modified;
                finalPayload.docstatus = record.docstatus;
            }

            // Convert numeric fields
            ["per_ordered", "per_received"].forEach(field => {
                if (field in finalPayload) finalPayload[field] = Number(finalPayload[field]) || 0;
            });

            // Items table - ensure numbers
            if (finalPayload.items) {
                finalPayload.items = finalPayload.items.map((row: any) => ({
                    ...row,
                    qty: Number(row.qty) || 0,
                    rate: Number(row.rate) || 0,
                    amount: Number(row.amount) || 0,
                }));
            }

            console.log("Sending payload:", finalPayload);

            const resp = await axios.put(
                `${API_BASE_URL}/${doctypeName}/${docname}`,
                finalPayload,
                {
                    headers: {
                        Authorization: `token ${apiKey}:${apiSecret}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );

            toast.success("Material Request updated successfully!");
            if (resp.data?.data) {
                setRecord(resp.data.data);
            }

            router.push(`/operations/doctype/spare-indent/${encodeURIComponent(docname)}`);

        } catch (err: any) {
            console.error("Save error:", err);
            toast.error("Failed to Save", {
                description: err.response?.data?.message || err.message || "Unknown error",
                duration: Infinity
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => router.back();

    /* -------------------------------------------------
       6. UI STATES
       ------------------------------------------------- */
    if (loading) return <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>Loading Material Request...</div>;
    if (error) return (
        <div className="module active" style={{ padding: "2rem" }}>
            <p style={{ color: "var(--color-error)" }}>{error}</p>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
    );
    if (!record) return <div className="module active" style={{ padding: "2rem" }}>Material Request not found.</div>;

    /* -------------------------------------------------
       7. RENDER FORM
       ------------------------------------------------- */
    return (
        <DynamicForm
            tabs={formTabs}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            title={`${doctypeName}: ${record.name}`}
            description={`Record ID: ${docname}`}
            submitLabel={isSaving ? "Saving..." : "Save"}
            cancelLabel="Cancel"
            deleteConfig={{
                doctypeName: doctypeName,
                docName: docname,
                redirectUrl: "/operations/doctype/spare-indent"
            }}
        />
    );
}