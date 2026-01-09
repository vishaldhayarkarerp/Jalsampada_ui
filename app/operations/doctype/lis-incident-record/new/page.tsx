"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DynamicForm,
  TabbedLayout,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

export default function NewLisIncidentRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKey, apiSecret } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  // The actual DocType name in ERPNext/Frappe is "Issue"
  const doctypeName = "Issue";

  // Parse duplicate data from URL parameters
  const duplicateData = React.useMemo(() => {
    const duplicateParam = searchParams.get('duplicate');
    if (!duplicateParam) return null;
    
    try {
      const decodedData = JSON.parse(atob(decodeURIComponent(duplicateParam)));
      console.log("Parsed duplicate data:", decodedData);
      return decodedData;
    } catch (error) {
      console.error("Error parsing duplicate data:", error);
      toast.error("Failed to parse duplicate data");
      return null;
    }
  }, [searchParams]);

  // Show notification if we have duplicate data (only once)
  const notificationShown = React.useRef(false);
  React.useEffect(() => {
    if (duplicateData && !notificationShown.current) {
      toast.success("Form populated with duplicate data. Modify as needed and save.");
      notificationShown.current = true;
    }
  }, [duplicateData]);

  /* -------------------------------------------------
     1. Define the form structure
     ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    // Helper function to get value from duplicate data or fallback to default
    const getValue = (fieldName: string, defaultValue: any = undefined) => {
      return duplicateData?.[fieldName] ?? defaultValue;
    };

    return [
      {
        name: "Details",
        fields: [
          { name: "custom_incident_datetime", label: "Incident Date and Time", type: "DateTime", defaultValue: getValue("custom_incident_datetime") },
          { name: "subject", label: "Incident Subject", type: "Data", required: true, defaultValue: getValue("subject") },
          
          { name: "custom_lis", label: "Lift Irrigation Scheme", type: "Link", linkTarget: "Lift Irrigation Scheme", defaultValue: getValue("custom_lis") },
          { name: "custom_asset", label: "Asset", type: "Link", linkTarget: "Asset", defaultValue: getValue("custom_asset") },
          { name: "issue_type", label: "Issue Type", type: "Link", linkTarget: "Issue Type", defaultValue: getValue("issue_type") },
          
          { name: "custom_stage", label: "Stage/ Sub Scheme", type: "Link", linkTarget: "Stage No", defaultValue: getValue("custom_stage") },
          { name: "custom_asset_no", label: "Asset No", type: "Data", defaultValue: getValue("custom_asset_no") },
          { name: "issue_split_from", label: "Issue Split From", type: "Link", linkTarget: "Issue", defaultValue: getValue("issue_split_from") },
          { name: "custom_reported_by", label: "Reported By", type: "Link", linkTarget: "Employee", defaultValue: getValue("custom_reported_by") },
          { name: "raised_by", label: "Raised By (Email)", type: "Data", defaultValue: getValue("raised_by") },
          
          { name: "priority", label: "Priority", type: "Link", linkTarget: "Issue Priority", defaultValue: getValue("priority") },
          {
            name: "status",
            label: "Status",
            type: "Select",
            options: "Open\nReplied\nOn Hold\nResolved\nClosed",
            defaultValue: getValue("status", "Open"),
          },
          { name: "customer", label: "Customer", type: "Link", linkTarget: "Customer", defaultValue: getValue("customer") },
          { name: "custom_designation_", label: "Designation", type: "Link", linkTarget: "Designation", defaultValue: getValue("custom_designation_") },

          // Incident Subject & Description
          { name: "custom_section_break_iczk0", label: "", type: "Section Break" },
          { name: "custom_incident_subject", label: "Incident Subject", type: "Small Text", defaultValue: getValue("custom_incident_subject") },
          { name: "sb_details", label: "Description", type: "Section Break" },
          { name: "description", label: "Description of Incident", type: "Text", defaultValue: getValue("description") },

          // Type of Incident
          { name: "custom_type_of_incident", label: "Type of Incident", type: "Section Break" },
          { name: "custom_mechanical_failure", label: "Mechanical Failure", type: "Check", defaultValue: getValue("custom_mechanical_failure") },
          { name: "custom_electrical_failure", label: "Electrical Failure", type: "Check", defaultValue: getValue("custom_electrical_failure") },
          { name: "custom_flooding__waterlogging", label: "Flooding / Waterlogging", type: "Check", defaultValue: getValue("custom_flooding__waterlogging") },
          { name: "custom_control_scada", label: "Control Panel/ SCADA Malfunction", type: "Check", defaultValue: getValue("custom_control_scada") },
          
          { name: "custom_structural_damage", label: "Structural Damage", type: "Check", defaultValue: getValue("custom_structural_damage") },
          { name: "custom_fire__short_circuit", label: "Fire / Short Circuit", type: "Check", defaultValue: getValue("custom_fire__short_circuit") },
          { name: "custom_personnel_injury", label: "Personnel Injury", type: "Check", defaultValue: getValue("custom_personnel_injury") },
          { name: "custom_other", label: "Other", type: "Check", defaultValue: getValue("custom_other") },
          { name: "custom_specify", label: "Specify", type: "Small Text", defaultValue: getValue("custom_specify") },

          // Attachments
          { name: "custom_photos__attachments", label: "Photos / Attachments", type: "Section Break" },
          {
            name: "custom_attachments",
            label: "Attachments",
            type: "Table",
            defaultValue: getValue("custom_attachments", []),
            columns: [
              { name: "attachement", label: "Attachment Description", type: "Data" },
              { name: "attach_ayav", label: "Attach File", type: "Attach" },
            ],
          },

          // SLA & Response
          { name: "service_level_section", label: "Service Level Agreement Details", type: "Section Break" },
          { name: "service_level_agreement", label: "Service Level Agreement", type: "Link", linkTarget: "Service Level Agreement", defaultValue: getValue("service_level_agreement") },
          { name: "first_response_time", label: "First Response Time", type: "Duration", defaultValue: getValue("first_response_time") },
          { name: "first_responded_on", label: "First Responded On", type: "DateTime", defaultValue: getValue("first_responded_on") },
          { name: "avg_response_time", label: "Average Response Time", type: "Duration", defaultValue: getValue("avg_response_time") },

          // Immediate Action Taken
          { name: "custom_immediate_action_taken", label: "Immediate Action Taken", type: "Section Break" },
          {
            name: "custom_action_taken",
            label: "Action Taken",
            type: "Table",
            defaultValue: getValue("custom_action_taken", []),
            columns: [
              { name: "action", label: "Action", type: "Text" },
              { name: "taken_by", label: "Taken By", type: "Link", linkTarget: "User" },
              { name: "time", label: "Time", type: "Time" },
              { name: "remarks", label: "Remarks", type: "Text" },
            ],
          },

          // Resolution Details
          { name: "section_break_19", label: "Resolution Details", type: "Section Break" },
          { name: "resolution_details", label: "Resolution Details", type: "Text", defaultValue: getValue("resolution_details") },
        
          { name: "opening_date", label: "Opening Date", type: "Date", defaultValue: getValue("opening_date") },
          { name: "opening_time", label: "Opening Time", type: "Time", defaultValue: getValue("opening_time") },
          { name: "sla_resolution_date", label: "Resolution Date", type: "DateTime", defaultValue: getValue("sla_resolution_date") },
          { name: "resolution_time", label: "Resolution Time", type: "Duration", defaultValue: getValue("resolution_time") },
          { name: "user_resolution_time", label: "User Resolution Time", type: "Duration", defaultValue: getValue("user_resolution_time") },

          // Status of Resolution
          { name: "custom_status_of_resolution", label: "Status of Resolution", type: "Section Break" },
          { name: "custom_resolved_onsite", label: "Resolved on-site", type: "Check", defaultValue: getValue("custom_resolved_onsite") },
          { name: "custom_escalated_to_higher_authority", label: "Escalated to higher authority", type: "Check", defaultValue: getValue("custom_escalated_to_higher_authority") },
          { name: "custom_intervention_required", label: "Service Provider Intervention Required", type: "Check", defaultValue: getValue("custom_intervention_required") },
          { name: "custom_resolution_date", label: "Resolution Date", type: "Date", defaultValue: getValue("custom_resolution_date") },
        
          { name: "custom_equipment_replacement_pending", label: "Spare Part / Equipment Replacement Pending", type: "Check", defaultValue: getValue("custom_equipment_replacement_pending") },
          { name: "custom_under_investigation", label: "Under Investigation", type: "Check", defaultValue: getValue("custom_under_investigation") },

          // Affected Components
          {
            name: "custom_component_affected",
            label: "Components Affected",
            type: "Table",
            defaultValue: getValue("custom_component_affected", []),
            columns: [
              { name: "component", label: "Component Category", type: "Link", linkTarget: "Asset Category" },
              { name: "asset_id", label: "Specific Asset", type: "Link", linkTarget: "Asset" },
              { name: "description_of_damage", label: "Description of Damage", type: "Text" },
            ],
          },

          // Preventive Action / Recommendations
          { name: "custom_preventive_action", label: "Preventive Action / Recommendations", type: "Section Break" },
          { name: "custom_recommendations", label: "Recommendations", type: "Long Text", defaultValue: getValue("custom_recommendations") },

          // Reporting and Approval
          {
            name: "custom_reporting_and_approval",
            label: "Reporting and Approval",
            type: "Table",
            defaultValue: getValue("custom_reporting_and_approval", []),
            columns: [
              { name: "name1", label: "Name", type: "Link", linkTarget: "Employee" },
              { name: "designation", label: "Designation", type: "Link", linkTarget: "Designation" },
              { name: "signature", label: "Signature", type: "Attach" },
              { name: "date", label: "Date", type: "Date" },
            ],
          },

          // Reference / Additional Info
          { name: "additional_info", label: "Reference", type: "Section Break" },
          { name: "lead", label: "Lead", type: "Link", linkTarget: "Lead", defaultValue: getValue("lead") },
          { name: "contact", label: "Contact", type: "Link", linkTarget: "Contact", defaultValue: getValue("contact") },
          { name: "email_account", label: "Email Account", type: "Link", linkTarget: "Email Account", defaultValue: getValue("email_account") },
        
          { name: "customer_name", label: "Customer Name", type: "Data", defaultValue: getValue("customer_name") },
          { name: "project", label: "Project", type: "Link", linkTarget: "Project", defaultValue: getValue("project") },
          { name: "company", label: "Company", type: "Link", linkTarget: "Company", defaultValue: getValue("company") },
          { name: "via_customer_portal", label: "Via Customer Portal", type: "Check", defaultValue: getValue("via_customer_portal") },
          { name: "attachment", label: "Attachment", type: "Attach", defaultValue: getValue("attachment") },
          { name: "content_type", label: "Content Type", type: "Data", defaultValue: getValue("content_type") },
        ],
      },
    ];
  }, [duplicateData]);

  /* -------------------------------------------------
     2. SUBMIT (Create)
     ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    // Check if we have valid data to submit
    const hasValidData = isDirty || (duplicateData && data.subject);
    
    if (!hasValidData) {
      toast.info("Please fill out the form.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const payload = { ...data };

      // Remove layout fields (column/section breaks)
      const nonDataFields = new Set([
        "custom_section_break_iczk0", "sb_details", "custom_type_of_incident",
        "custom_photos__attachments", "service_level_section", "custom_immediate_action_taken",
        "section_break_19", "custom_status_of_resolution", "custom_preventive_action",
        "additional_info",
      ]);

      const finalPayload: Record<string, any> = {
        doctype: doctypeName,
      };

      for (const key in payload) {
        if (!nonDataFields.has(key)) {
          finalPayload[key] = payload[key];
        }
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

      console.log("Sending NEW Issue payload:", finalPayload);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `token ${apiKey}:${apiSecret}`,
      };

      const storedCsrfToken = localStorage.getItem('csrfToken');
      if (storedCsrfToken) {
        headers['X-Frappe-CSRF-Token'] = storedCsrfToken;
      }

      const resp = await fetch(`${API_BASE_URL}/${doctypeName}`, {
        method: 'POST',
        headers: headers,
        credentials: 'include', 
        body: JSON.stringify(finalPayload), 
      });

      const responseData = await resp.json();

      if (!resp.ok) {
        console.log("Full server error:", responseData);
        throw new Error(responseData.exception || responseData._server_messages || "Failed to create document");
      }
      
      toast.success("LIS Incident Record created successfully!");
      
      router.push(`/operations/doctype/lis-incident-record`);

    } catch (err: any) {
      console.error("Save error:", err);
      
      if (err.response?.data?.exc_type === "DuplicateEntryError") {
        toast.error("Duplicate Entry Error", {
          description: "This record may already exist."
        });
      } else {
        toast.error("Failed to create record", {
          description: err.message || "Check console for details."
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* -------------------------------------------------
     3. RENDER FORM
     ------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title="New LIS Incident Record"
      description="Report a new incident or issue"
      submitLabel={isSaving ? "Saving..." : "Create"}
      cancelLabel="Cancel"
    />
  );
}