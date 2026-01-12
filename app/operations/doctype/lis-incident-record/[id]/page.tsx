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
   1. Issue (LIS Incident Record) interface
   ------------------------------------------------- */
interface IssueData {
    name: string;
    workflow_state?: string;
    naming_series?: string;
    custom_incident_datetime?: string;
    subject?: string;
    custom_lis?: string;
    custom_asset?: string;
    issue_type?: string;
    custom_stage?: string;
    custom_asset_no?: string;
    issue_split_from?: string;
    custom_reported_by?: string;
    raised_by?: string;
    priority?: string;
    status?: string;
    customer?: string;
    custom_designation_?: string;
    custom_incident_subject?: string;
    description?: string;
    custom_mechanical_failure?: 0 | 1;
    custom_electrical_failure?: 0 | 1;
    custom_flooding__waterlogging?: 0 | 1;
    custom_control_scada?: 0 | 1;
    custom_structural_damage?: 0 | 1;
    custom_fire__short_circuit?: 0 | 1;
    custom_personnel_injury?: 0 | 1;
    custom_other?: 0 | 1;
    custom_specify?: string;
    custom_attachments?: Array<{
        attachement?: string;
        attach_ayav?: string;
    }>;
    first_response_time?: number;
    first_responded_on?: string;
    avg_response_time?: number;
    custom_action_taken?: Array<{
        action?: string;
        taken_by?: string;
        time?: string;
        remarks?: string;
    }>;
    resolution_details?: string;
    opening_date?: string;
    opening_time?: string;
    sla_resolution_date?: string;
    resolution_time?: number;
    user_resolution_time?: number;
    custom_resolved_onsite?: 0 | 1;
    custom_escalated_to_higher_authority?: 0 | 1;
    custom_intervention_required?: 0 | 1;
    custom_resolution_date?: string;
    custom_equipment_replacement_pending?: 0 | 1;
    custom_under_investigation?: 0 | 1;
    custom_recommendations?: string;
    custom_reporting_and_approval?: Array<{
        name1?: string;
        designation?: string;
        signature?: string;
        date?: string;
    }>;
    custom_component_affected?: Array<{
        component?: string;
        asset_id?: string;
        description_of_damage?: string;
    }>;
    service_level_agreement?: string;
    response_by?: string;
    sla_resolution_by?: string;
    agreement_status?: string;
    service_level_agreement_creation?: string;
    on_hold_since?: string;
    total_hold_time?: number;
    lead?: string;
    contact?: string;
    email_account?: string;
    customer_name?: string;
    project?: string;
    company?: string;
    via_customer_portal?: 0 | 1;
    attachment?: string;
    content_type?: string;
    docstatus: 0 | 1 | 2;
    modified: string;
}

/* -------------------------------------------------
   2. Page component
   ------------------------------------------------- */
export default function LisIncidentRecordDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

    const docname = params.id as string;
    const doctypeName = "Issue";

    const [record, setRecord] = React.useState<IssueData | null>(null);
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
                        ? "LIS Incident Record not found"
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
       4. Form structure - NO depends_on anywhere
       ------------------------------------------------- */
    const formTabs: TabbedLayout[] = React.useMemo(() => {
        if (!record) return [];

        const fields = (list: FormField[]): FormField[] =>
            list.map((f) => ({
                ...f,
                defaultValue:
                    f.name in record
                        ? record[f.name as keyof IssueData]
                        : f.defaultValue,
            }));

        return [
            {
                name: "Details",
                fields: fields([
                   
                    { name: "custom_incident_datetime", label: "Incident Date and Time", type: "DateTime" },
                    { name: "subject", label: "Incident Subject", type: "Data", required: true },
                    
                    { name: "custom_lis", label: "Lift Irrigation Scheme", type: "Link", linkTarget: "Lift Irrigation Scheme" },
                    { name: "custom_asset", label: "Asset", type: "Link", linkTarget: "Asset" },
                    { name: "issue_type", label: "Issue Type", type: "Link", linkTarget: "Issue Type" },
                    
                    { name: "custom_stage", label: "Stage/ Sub Scheme", type: "Link", linkTarget: "Stage No" },
                    { name: "custom_asset_no", label: "Asset No", type: "Data" },
                    { name: "issue_split_from", label: "Issue Split From", type: "Link", linkTarget: "Issue" },
                    { name: "custom_reported_by", label: "Reported By", type: "Link", linkTarget: "Employee" },
                    { name: "raised_by", label: "Raised By (Email)", type: "Data" },
                    
                    { name: "priority", label: "Priority", type: "Link", linkTarget: "Issue Priority" },
                    {
                        name: "status",
                        label: "Status",
                        type: "Select",
                        options: "Open\nReplied\nOn Hold\nResolved\nClosed",
                    },
                    { name: "customer", label: "Customer", type: "Link", linkTarget: "Customer" },
                    { name: "custom_designation_", label: "Designation", type: "Link", linkTarget: "Designation" },

                    // Incident Subject & Description
                    { name: "custom_section_break_iczk0", label: "", type: "Section Break" },
                    { name: "custom_incident_subject", label: "Incident Subject", type: "Small Text" },
                    { name: "sb_details", label: "Description", type: "Section Break" },
                    { name: "description", label: "Description of Incident", type: "Text" },

                    // Type of Incident
                    { name: "custom_type_of_incident", label: "Type of Incident", type: "Section Break" },
                    { name: "custom_mechanical_failure", label: "Mechanical Failure", type: "Check" },
                    { name: "custom_electrical_failure", label: "Electrical Failure", type: "Check" },
                    { name: "custom_flooding__waterlogging", label: "Flooding / Waterlogging", type: "Check" },
                    { name: "custom_control_scada", label: "Control Panel/ SCADA Malfunction", type: "Check" },
                    
                    { name: "custom_structural_damage", label: "Structural Damage", type: "Check" },
                    { name: "custom_fire__short_circuit", label: "Fire / Short Circuit", type: "Check" },
                    { name: "custom_personnel_injury", label: "Personnel Injury", type: "Check" },
                    { name: "custom_other", label: "Other", type: "Check" },
                    { name: "custom_specify", label: "Specify", type: "Small Text" },

                    // Attachments
                    { name: "custom_photos__attachments", label: "Photos / Attachments", type: "Section Break" },
                    {
                        name: "custom_attachments",
                        label: "Attachments",
                        type: "Table",
                        columns: [
                            { name: "attachement", label: "Attachment Description", type: "Data" },
                            { name: "attach_ayav", label: "Attach File", type: "Attach" },
                        ],
                    },

                    // SLA & Response
                    { name: "service_level_section", label: "Service Level Agreement Details", type: "Section Break" },
                    { name: "service_level_agreement", label: "Service Level Agreement", type: "Link", linkTarget: "Service Level Agreement" },
                    { name: "first_response_time", label: "First Response Time", type: "Duration" },
                    { name: "first_responded_on", label: "First Responded On", type: "DateTime" },
                    
                    { name: "avg_response_time", label: "Average Response Time", type: "Duration" },

                    // Immediate Action Taken
                    { name: "custom_immediate_action_taken", label: "Immediate Action Taken", type: "Section Break" },
                    {
                        name: "custom_action_taken",
                        label: "Action Taken",
                        type: "Table",
                        columns: [
                            { name: "action", label: "Action", type: "Text" },
                            { name: "taken_by", label: "Taken By", type: "Link", linkTarget: "User" },
                            { name: "time", label: "Time", type: "Time" },
                            { name: "remarks", label: "Remarks", type: "Text" },
                        ],
                    },

                    // Resolution Details
                    { name: "section_break_19", label: "Resolution Details", type: "Section Break" },
                    { name: "resolution_details", label: "Resolution Details", type: "Text" },
                  
                    { name: "opening_date", label: "Opening Date", type: "Date" },
                    { name: "opening_time", label: "Opening Time", type: "Time" },
                    { name: "sla_resolution_date", label: "Resolution Date", type: "DateTime" },
                    { name: "resolution_time", label: "Resolution Time", type: "Duration" },
                    { name: "user_resolution_time", label: "User Resolution Time", type: "Duration" },

                    // Status of Resolution
                    { name: "custom_status_of_resolution", label: "Status of Resolution", type: "Section Break" },
                    { name: "custom_resolved_onsite", label: "Resolved on-site", type: "Check" },
                    { name: "custom_escalated_to_higher_authority", label: "Escalated to higher authority", type: "Check" },
                    { name: "custom_intervention_required", label: "Service Provider Intervention Required", type: "Check" },
                    { name: "custom_resolution_date", label: "Resolution Date", type: "Date" },
                  
                    { name: "custom_equipment_replacement_pending", label: "Spare Part / Equipment Replacement Pending", type: "Check" },
                    { name: "custom_under_investigation", label: "Under Investigation", type: "Check" },

                    // Affected Components
                    {
                        name: "custom_component_affected",
                        label: "Components Affected",
                        type: "Table",
                        columns: [
                            {
                                name: "component",
                                label: "Component Category",
                                type: "Link",
                                linkTarget: "Asset Category",
                            },
                            {
                                name: "asset_id",
                                label: "Specific Asset",
                                type: "Link",
                                linkTarget: "Asset",
                            },
                            {
                                name: "description_of_damage",
                                label: "Description of Damage",
                                type: "Text",
                            },
                        ],
                    },

                    // Preventive Action / Recommendations
                    { name: "custom_preventive_action", label: "Preventive Action / Recommendations", type: "Section Break" },
                    { name: "custom_recommendations", label: "Recommendations", type: "Long Text" },

                    // Reporting and Approval
                    {
                        name: "custom_reporting_and_approval",
                        label: "Reporting and Approval",
                        type: "Table",
                        columns: [
                            { name: "name1", label: "Name", type: "Link", linkTarget: "Employee" },
                            { name: "designation", label: "Designation", type: "Link", linkTarget: "Designation" },
                            { name: "signature", label: "Signature", type: "Attach" },
                            { name: "date", label: "Date", type: "Date" },
                        ],
                    },

                    // Reference / Additional Info
                    { name: "additional_info", label: "Reference", type: "Section Break" },
                    { name: "lead", label: "Lead", type: "Link", linkTarget: "Lead" },
                    { name: "contact", label: "Contact", type: "Link", linkTarget: "Contact" },
                    { name: "email_account", label: "Email Account", type: "Link", linkTarget: "Email Account" },
                  
                    { name: "customer_name", label: "Customer Name", type: "Data" },
                    { name: "project", label: "Project", type: "Link", linkTarget: "Project" },
                    { name: "company", label: "Company", type: "Link", linkTarget: "Company" },
                    { name: "via_customer_portal", label: "Via Customer Portal", type: "Check" },
                    { name: "attachment", label: "Attachment", type: "Attach" },
                    { name: "content_type", label: "Content Type", type: "Data" },
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

            // Remove layout fields (column/section breaks)
            const nonDataFields = new Set([
                "subject_section",  "cb00",
                , "custom_section_break_iczk0",
                "sb_details", "custom_type_of_incident", "custom_column_break_tq8lj",
                "custom_photos__attachments", 
                "custom_immediate_action_taken", "section_break_19", 
                "custom_status_of_resolution", 
                "custom_preventive_action", "additional_info",
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

            // Convert check fields to 0/1
            const checkFields = [
                "custom_mechanical_failure", "custom_electrical_failure", "custom_flooding__waterlogging",
                "custom_control_scada", "custom_structural_damage", "custom_fire__short_circuit",
                "custom_personnel_injury", "custom_other",
                "custom_resolved_onsite", "custom_escalated_to_higher_authority",
                "custom_intervention_required", "custom_equipment_replacement_pending",
                "custom_under_investigation", "via_customer_portal"
            ];
            checkFields.forEach(field => {
                if (field in finalPayload) {
                    finalPayload[field] = finalPayload[field] ? 1 : 0;
                }
            });

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

            toast.success("LIS Incident Record updated successfully!");
            if (resp.data?.data) {
                setRecord(resp.data.data);
            }

            router.push(`/operations/doctype/lis-incident-record/${encodeURIComponent(docname)}`);

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
    if (loading) return <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>Loading LIS Incident Record...</div>;
    if (error) return (
        <div className="module active" style={{ padding: "2rem" }}>
            <p style={{ color: "var(--color-error)" }}>{error}</p>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
    );
    if (!record) return <div className="module active" style={{ padding: "2rem" }}>LIS Incident Record not found.</div>;

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
                redirectUrl: "/lis-management/doctype/issue"
            }}
        />
    );
}