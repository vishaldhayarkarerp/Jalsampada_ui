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
   1. Gate Operation Logbook interface
   ------------------------------------------------- */
interface GateOperationLogbookData {
    name: string;
    lis_name?: string;              // Link to Lift Irrigation Scheme
    stage?: string;                 // Link to Stage No
    gate_no?: string;               // Link to Gate
    gate_operation?: "Lift" | "Lowered"; // Select
    lift_by?: number;               // Float - meters
    lowered_by?: number;            // Float - meters
    lift_date?: string;             // DateTime
    lowered_date?: string;          // DateTime
    instruction_reference?: string; // Small Text
    remark?: string;                // Text
    // System fields
    docstatus: 0 | 1 | 2;
    modified: string;
}

/* -------------------------------------------------
   2. Page component
   ------------------------------------------------- */
export default function GateOperationLogbookDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

    const docname = params.id as string;
    const doctypeName = "Gate Operation Logbook"; // ← Change if your actual DocType name is different

    const [record, setRecord] = React.useState<GateOperationLogbookData | null>(null);
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
                        ? "Gate Operation Logbook not found"
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

        return [
            {
                name: "Details",
                fields: [
                    // Main information row
                    {
                        name: "lis_name",
                        label: "LIS Name",
                        type: "Link",
                        linkTarget: "Lift Irrigation Scheme",
                        defaultValue: record.lis_name || "",
                        inListView: true,
                        required: true,
                    },
                  

                    {
                        name: "stage",
                        label: "Stage/ Sub Scheme",
                        type: "Link",
                        linkTarget: "Stage No",
                        defaultValue: record.stage || "",
                        inListView: true,
                        required: true,
                    },
                   

                    {
                        name: "gate_no",
                        label: "Gate No",
                        type: "Link",
                        linkTarget: "Gate",
                        defaultValue: record.gate_no || "",
                        inListView: true,
                        required: true,
                    },

                    // Gate Operations Section
                    {
                        name: "gate_operations_section",
                        label: "Gate Operations",
                        type: "Section Break",
                    },

                    {
                        name: "gate_operation",
                        label: "Gate Operation",
                        type: "Select",
                        options: "Lift\nLowered",
                        defaultValue: record.gate_operation || "",
                        required: true,
                        inListView: true,
                    },

                    {
                        name: "lift_by",
                        label: "Lift By (In Meters)",
                        type: "Float",
                        precision: 2,
                        defaultValue: record.lift_by ?? "",
                        depends_on: 'eval:doc.gate_operation=="Lift"',
                    },
                    {
                        name: "lowered_by",
                        label: "Lowered By (In Meters)",
                        type: "Float",
                        precision: 2,
                        defaultValue: record.lowered_by ?? "",
                        depends_on: 'eval:doc.gate_operation=="Lowered"',
                    },

                    {
                        name: "lift_date",
                        label: "Lift Date",
                        type: "DateTime",
                        defaultValue: record.lift_date || "Now",
                        depends_on: 'eval:doc.gate_operation=="Lift"',
                    },
                    {
                        name: "lowered_date",
                        label: "Lowered Date",
                        type: "DateTime",
                        defaultValue: record.lowered_date || "Now",
                        depends_on: 'eval:doc.gate_operation=="Lowered"',
                    },

                    // Final information
                    { name: "section_break_ttnk", label: "", type: "Section Break" },

                    {
                        name: "instruction_reference",
                        label: "Instruction Reference",
                        type: "Small Text",
                        defaultValue: record.instruction_reference || "",
                        inListView: true,
                    },

                    {
                        name: "remark",
                        label: "Remark",
                        type: "Text",
                        defaultValue: record.remark || "",
                    },
                ],
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
            const payload: Partial<GateOperationLogbookData> = {
                lis_name: data.lis_name?.trim() || "",
                stage: data.stage?.trim() || "",
                gate_no: data.gate_no?.trim() || "",
                gate_operation: data.gate_operation || "",
                instruction_reference: data.instruction_reference?.trim() || "",
                remark: data.remark?.trim() || "",
                modified: record?.modified,
                docstatus: record?.docstatus,
            };

            // // Include conditional fields only if relevant
            // if (data.gate_operation === "Lift") {
            //     payload.lift_by = Number(data.lift_by) || null;
            //     payload.lift_date = data.lift_date || "Now";
            //     payload.lowered_by = null;
            //     payload.lowered_date = null;
            // } else if (data.gate_operation === "Lowered") {
            //     payload.lowered_by = Number(data.lowered_by) || null;
            //     payload.lowered_date = data.lowered_date || "Now";
            //     payload.lift_by = null;
            //     payload.lift_date = null;
            // }

            console.log("Sending payload:", payload);

            const resp = await axios.put(
                `${API_BASE_URL}/${doctypeName}/${docname}`,
                payload,
                {
                    headers: {
                        Authorization: `token ${apiKey}:${apiSecret}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );

            toast.success("Gate Operation Logbook updated successfully!");

            if (resp.data?.data) {
                setRecord(resp.data.data);
            }

            router.push(`/operations/doctype/gate-operation-logbook/${encodeURIComponent(docname)}`);

        } catch (err: any) {
            console.error("Save error:", err);
            toast.error("Failed to Save", {
                description: err.response?.data?.message || err.message || "Unknown error"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => router.back();

    /* -------------------------------------------------
       6. UI STATES
       ------------------------------------------------- */
    if (loading) return <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>Loading Gate Operation Logbook...</div>;

    if (error) return (
        <div className="module active" style={{ padding: "2rem" }}>
            <p style={{ color: "var(--color-error)" }}>{error}</p>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
    );

    if (!record) return <div className="module active" style={{ padding: "2rem" }}>Record not found.</div>;

    /* -------------------------------------------------
       7. RENDER
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
                redirectUrl: "/operations/doctype/gate-operation-logbook"
            }}
        />
    );
}