"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    DynamicForm,
    TabbedLayout,
    FormField,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

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
    const [formInitialized, setFormInitialized] = React.useState(false);

    // Status mapping function
    const getStatusDisplay = (docstatus: number | undefined) => {
        switch (docstatus) {
            case 0: return "Draft";
            case 1: return "Submitted";
            case 2: return "Cancelled";
            default: return "Draft";
        }
    };

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

                const headers: HeadersInit = {
                    'Authorization': `token ${apiKey}:${apiSecret}`,
                };

                const resp = await fetch(`${API_BASE_URL}/${doctypeName}/${docname}`, {
                    method: 'GET',
                    headers: headers,
                    credentials: 'include',
                });

                if (!resp.ok) {
                    throw new Error(`Failed to load ${doctypeName}`);
                }
                
                const responseData = await resp.json();
                setRecord(responseData.data);
            } catch (err: any) {
                console.error("API Error:", err);
                setError(
                    err.status === 404
                        ? "Gate Operation Logbook not found"
                        : err.status === 403
                            ? "Unauthorized"
                            : "Failed to load record"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchRecord();
    }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

    // Handle form initialization to set proper baseline values
    const handleFormInit = React.useCallback((methods: any) => {
        if (record && !formInitialized) {
            const formData = {
                lis_name: record.lis_name || "",
                stage: record.stage || "",
                gate_no: record.gate_no || "",
                gate_operation: record.gate_operation || "",
                lift_by: record.lift_by ?? "",
                lift_date: record.lift_date || "",
                lowered_by: record.lowered_by ?? "",
                lowered_date: record.lowered_date || "",
                instruction_reference: record.instruction_reference || "",
                remark: record.remark || "",
            };
            
            // Use setTimeout to ensure the form is fully initialized
            setTimeout(() => {
                methods.reset(formData);
                setFormInitialized(true);
            }, 100);
        }
    }, [record, formInitialized]);

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
                        ? // @ts-ignore
                        record[f.name as keyof GateOperationLogbookData]
                        : f.defaultValue,
            }));

        return [
            {
                name: "Details",
                fields: fields([
                    // Main information row
                    {
                        name: "lis_name",
                        label: "LIS Name",
                        type: "Link",
                        linkTarget: "Lift Irrigation Scheme",
                        required: true,
                    },
                  

                    {
                        name: "stage",
                        label: "Stage/ Sub Scheme",
                        type: "Link",
                        linkTarget: "Stage No",
                        required: true,
                        filterMapping: [
                            {
                                sourceField: "lis_name",
                                
                                targetField: "lis_name"
                            }
                        ],
                    },
                   

                    {
                        name: "gate_no",
                        label: "Gate No",
                        type: "Link",
                        linkTarget: "Gate",
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
                        required: true,
                    },

                    // Conditional Fields: Lift
                    {
                        name: "lift_by",
                        label: "Lift By (In Meters)",
                        type: "Float",
                        precision: 2,
                        displayDependsOn: "gate_operation=='Lift'",
                    },
                    {
                        name: "lift_date",
                        label: "Lift Date",
                        type: "DateTime",
                        displayDependsOn: "gate_operation=='Lift'",
                    },

                    // Conditional Fields: Lowered
                    {
                        name: "lowered_by",
                        label: "Lowered By (In Meters)",
                        type: "Float",
                        precision: 2,
                        displayDependsOn: "gate_operation=='Lowered'",
                    },
                    {
                        name: "lowered_date",
                        label: "Lowered Date",
                        type: "DateTime",
                        displayDependsOn: "gate_operation=='Lowered'",
                    },

                    // Final information
                    { name: "section_break_ttnk", label: "", type: "Section Break" },

                    {
                        name: "instruction_reference",
                        label: "Instruction Reference",
                        type: "Small Text",
                    },

                    {
                        name: "remark",
                        label: "Remark",
                        type: "Text",
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
            const payload: Record<string, any> = {
                lis_name: data.lis_name?.trim() || "",
                stage: data.stage?.trim() || "",
                gate_no: data.gate_no?.trim() || "",
                gate_operation: data.gate_operation || "",
                instruction_reference: data.instruction_reference?.trim() || "",
                remark: data.remark?.trim() || "",
                modified: record?.modified,
                docstatus: record?.docstatus,
            };

            // Include conditional fields only if relevant
            if (data.gate_operation === "Lift") {
                payload.lift_by = Number(data.lift_by) || 0;
                payload.lift_date = data.lift_date || "";
                payload.lowered_by = 0;
                payload.lowered_date = "";
            } else if (data.gate_operation === "Lowered") {
                payload.lowered_by = Number(data.lowered_by) || 0;
                payload.lowered_date = data.lowered_date || "";
                payload.lift_by = 0;
                payload.lift_date = "";
            }

            console.log("Sending payload:", payload);

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `token ${apiKey}:${apiSecret}`,
            };
            
            const storedCsrfToken = localStorage.getItem('csrfToken');
            if (storedCsrfToken) {
                headers['X-Frappe-CSRF-Token'] = storedCsrfToken;
            }

            const resp = await fetch(`${API_BASE_URL}/${doctypeName}/${docname}`, {
                method: 'PUT',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const responseData = await resp.json();

            if (!resp.ok) {
                console.log("Full server error:", responseData);
                throw new Error(responseData.exception || responseData._server_messages || "Failed to save");
            }

            toast.success("Gate Operation Logbook updated successfully!");

            if (responseData && responseData.data) {
                setRecord(responseData.data);
            }

            router.push(`/operations/doctype/gate-operation-logbook/${encodeURIComponent(docname)}`);

        } catch (err: any) {
            console.error("Save error:", err);
            console.log("Full server error:", err.message);
        toast.error("Failed to save", {
                description: (err as Error).message || "Check console for details.",
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
            onFormInit={handleFormInit}
            title={`${doctypeName}: ${record.name}`}
            description={`Record ID: ${docname}`}
            initialStatus={getStatusDisplay(record.docstatus)}
            docstatus={record.docstatus}
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