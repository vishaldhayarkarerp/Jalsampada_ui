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
   1. Log Sheet type – mirrors fields from CSV
   ------------------------------------------------- */
interface LogSheetData {
    name: string;
    lis?: string;                    // Link → Lift Irrigation Scheme
    date?: string;                   // Date
    stage?: string;                  // Link → Stage No
    time?: string;                   // Time
    asset?: string;                  // Link → Asset
    operator_id?: string;            // Link → User
    logbook?: string;                // Link → Logbook Ledger (Pump No)
    operator_name?: string;          // Data (fetched)
    water_level?: number;            // Float (2 precision)
    pressure_guage?: number;         // Float (2 precision)
    br?: number;                     // Float – Voltage BR
    ry?: number;                     // Float – Voltage RY
    yb?: number;                     // Float – Voltage YB
    r?: number;                      // Float – Current R
    y?: number;                      // Float – Current Y
    b?: number;                      // Float – Current B
    temperature_readings?: Array<{
        name?: string;               // Optional - row name/id from Frappe
        temperature?: number;        // Temperature field
        temp_value?: number;         // Temp Value field
    }>;                              // Table → Temperature Reading Details
    remark?: string;                 // Text
    amended_from?: string;           // Link → Log Sheet
    // System fields
    docstatus: 0 | 1 | 2;
    modified: string;
}

/* -------------------------------------------------
   2. Page component
   ------------------------------------------------- */
export default function LogSheetDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

    const docname = params.id as string;
    const doctypeName = "Log Sheet";

    const [record, setRecord] = React.useState<LogSheetData | null>(null);
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
                        ? "Log Sheet not found"
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
       4. Build form tabs structure
       ------------------------------------------------- */
    const formTabs: TabbedLayout[] = React.useMemo(() => {
        if (!record) return [];

        const fields = (list: FormField[]): FormField[] =>
            list.map((f) => ({
                ...f,
                defaultValue:
                    f.name in record
                        ? // @ts-ignore
                        record[f.name as keyof LogSheetData]
                        : f.defaultValue,
            }));

        return [
            {
                name: "Main",
                fields: fields([
                    // 1st row
                    { name: "lis", label: "LIS", type: "Link", linkTarget: "Lift Irrigation Scheme",     },
                    { name: "date", label: "Date", type: "Date", defaultValue: "Today", required: true },
                   

                    // 2nd row
                    { name: "stage", label: "Stage/ Sub Scheme", type: "Link", linkTarget: "Stage No" },
                    { name: "time", label: "Time", type: "Time", defaultValue: "Now" },
                  

                    // 3rd row
                    { name: "asset", label: "Asset", type: "Link", linkTarget: "Asset" },
                    { name: "operator_id", label: "Operator ID", type: "Link", linkTarget: "User" },
                  

                    // 4th row
                    { name: "logbook", label: "Pump No", type: "Link", linkTarget: "Logbook Ledger" },
                    { name: "operator_name", label: "Operator Name", type: "Data" },

                    // Remarks
                    { name: "section_break_mgrv", label: "", type: "Section Break" },
                    { name: "remark", label: "Remark", type: "Text" },
                ]),
            },

            {
                name: "Readings",
                fields: fields([
                    // Water & Pressure
                    { name: "water_level", label: "Water Level", type: "Float"  },
                  
                    { name: "pressure_guage", label: "Pressure Guage Reading", type: "Float" },

                    // Voltage Section
                    { name: "voltage_section", label: "Voltage Reading", type: "Section Break" },
                    { name: "br", label: "BR", type: "Float" },
                  
                    { name: "ry", label: "RY", type: "Float" },
                  
                    { name: "yb", label: "YB", type: "Float" },

                    // Current Section
                    { name: "current_reading_section", label: "Current Reading", type: "Section Break" },
                    { name: "r", label: "R", type: "Float" },
                  
                    { name: "y", label: "Y", type: "Float" },
                  
                    { name: "b", label: "B", type: "Float" },

                    // Temperature Table
                    { name: "section_break_qzro", label: "", type: "Section Break" },
                    {
                        name: "temperature_readings",
                        label: "Temperature Readings",
                        type: "Table",
                        columns: [
                            {
                                name: "temperature",
                                label: "Temperature",
                                type: "Data",
                                
                            },
                            {
                                name: "temp_value",
                                label: "Temp Value",
                                type: "Float",
                            },
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

            // Remove layout fields (breaks/sections)
            const nonDataFields = new Set([
                "section_break_mgrv", "voltage_section", "current_reading_section",
                "section_break_qzro",
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

            // Ensure numeric values
            const floatFields = [
                "water_level", "pressure_guage",
                "br", "ry", "yb",
                "r", "y", "b"
            ];
            floatFields.forEach(field => {
                if (field in finalPayload) {
                    finalPayload[field] = Number(finalPayload[field]) || 0;
                }
            });

            console.log("Sending payload to Frappe:", finalPayload);

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

            toast.success("Changes saved successfully!");
            if (resp.data?.data) {
                setRecord(resp.data.data);
            }

            router.push(`/operations/doctype/logsheet/${docname}`);

        } catch (err: any) {
            console.error("Save error:", err);
            toast.error("Failed to save changes", {
                description: err.response?.data?.message || err.message || "Unknown error"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => router.back();

    /* -------------------------------------------------
       6. UI RENDERING STATES
       ------------------------------------------------- */
    if (loading) {
        return (
            <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
                <p>Loading Log Sheet details...</p>
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

    if (!record) {
        return (
            <div className="module active" style={{ padding: "2rem" }}>
                <p>Log Sheet record not found.</p>
            </div>
        );
    }

    /* -------------------------------------------------
       7. FINAL RENDER
       ------------------------------------------------- */
    return (
        <DynamicForm
            tabs={formTabs}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            title={`Edit Log Sheet: ${record.name}`}
            description={`Record ID: ${docname}`}
            submitLabel={isSaving ? "Saving..." : "Save Changes"}
            cancelLabel="Cancel"
        />
    );
}