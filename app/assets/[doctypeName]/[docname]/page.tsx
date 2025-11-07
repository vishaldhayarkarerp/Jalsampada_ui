"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DynamicForm, FormField } from "@/components/DynamicFormComponent";

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctypeName = params.doctypeName as string;
  const docname = params.docname as string;

  // Define your form fields
  const formFields: FormField[] = [
    // Column 1
    {
      name: "asset_name",
      label: "Asset Name",
      type: "Text",
      required: true,
      placeholder: "Enter asset name",
      description: "The name or identifier of the asset"
    },
    {
      name: "asset_id",
      label: "Asset ID",
      type: "Barcode",
      required: true,
      placeholder: "Scan or enter barcode",
      description: "Unique barcode identifier"
    },
    {
      name: "category",
      label: "Category",
      type: "Select",
      required: true,
      options: [
        { label: "Pump", value: "pump" },
        { label: "Motor", value: "motor" },
        { label: "Generator", value: "generator" },
        { label: "Valve", value: "valve" }
      ],
      description: "Asset category"
    },
    {
      name: "purchase_date",
      label: "Purchase Date",
      type: "Date",
      required: true,
      description: "Date of purchase"
    },
    {
      name: "purchase_cost",
      label: "Purchase Cost",
      type: "Currency",
      required: true,
      placeholder: "0.00",
      description: "Initial purchase cost in INR"
    },
    {
      name: "installation_datetime",
      label: "Installation Date & Time",
      type: "DateTime",
      description: "When the asset was installed"
    },

    // Column 2
    {
      name: "manufacturer",
      label: "Manufacturer",
      type: "Text",
      placeholder: "Enter manufacturer name"
    },
    {
      name: "model_number",
      label: "Model Number",
      type: "Small Text",
      placeholder: "Enter model number"
    },
    {
      name: "serial_number",
      label: "Serial Number",
      type: "Data",
      placeholder: "Enter serial number",
      description: "Manufacturer's serial number"
    },
    {
      name: "warranty_years",
      label: "Warranty Period (Years)",
      type: "Int",
      min: 0,
      max: 20,
      placeholder: "0"
    },
    {
      name: "efficiency_rating",
      label: "Efficiency Rating",
      type: "Percent",
      min: 0,
      max: 100,
      placeholder: "0",
      description: "Operating efficiency percentage"
    },
    {
      name: "condition_rating",
      label: "Condition Rating",
      type: "Rating",
      description: "Rate the current condition of the asset"
    },

    // Section Break
    {
      name: "section_technical",
      label: "Technical Specifications",
      type: "Section Break",
      description: "Enter detailed technical information about the asset"
    },

    // Technical Specifications
    {
      name: "capacity",
      label: "Capacity",
      type: "Float",
      step: 0.1,
      placeholder: "0.0",
      description: "Capacity in relevant units"
    },
    {
      name: "power_rating",
      label: "Power Rating (kW)",
      type: "Float",
      step: 0.1,
      placeholder: "0.0"
    },
    {
      name: "operating_voltage",
      label: "Operating Voltage",
      type: "Int",
      placeholder: "0",
      description: "Voltage in V"
    },
    {
      name: "operating_hours",
      label: "Operating Hours",
      type: "Duration",
      description: "Total operating hours"
    },

    // Maintenance Section
    {
      name: "section_maintenance",
      label: "Maintenance Information",
      type: "Section Break",
      description: "Maintenance schedule and status"
    },

    {
      name: "last_maintenance",
      label: "Last Maintenance Date",
      type: "Date",
      description: "Date of last maintenance"
    },
    {
      name: "next_maintenance",
      label: "Next Maintenance Date",
      type: "Date",
      description: "Scheduled next maintenance"
    },
    {
      name: "maintenance_interval",
      label: "Maintenance Interval (Days)",
      type: "Int",
      min: 1,
      placeholder: "30",
      description: "Days between maintenance"
    },
    {
      name: "is_operational",
      label: "Operational Status",
      type: "Check",
      defaultValue: true,
      description: "Is the asset currently operational?"
    },

    // Additional Details
    {
      name: "section_additional",
      label: "Additional Details",
      type: "Section Break"
    },

    {
      name: "location",
      label: "Location",
      type: "Text",
      placeholder: "Building / Room / Area",
      description: "Physical location of the asset"
    },
    {
      name: "status_color",
      label: "Status Indicator Color",
      type: "Color",
      defaultValue: "#10b981",
      description: "Visual status indicator"
    },
    {
      name: "qr_code",
      label: "QR Code",
      type: "Barcode",
      placeholder: "Scan QR code"
    },
    {
      name: "documentation_link",
      label: "Documentation Link",
      type: "Link",
      placeholder: "https://",
      description: "Link to manuals or documentation"
    },

    // Detailed Information
    {
      name: "description",
      label: "Description",
      type: "Long Text",
      rows: 4,
      placeholder: "Enter detailed description...",
      description: "Detailed information about the asset"
    },
    {
      name: "technical_notes",
      label: "Technical Notes",
      type: "Markdown Editor",
      rows: 6,
      placeholder: "Enter technical notes in markdown...",
      description: "Technical documentation in markdown format"
    },
    {
      name: "configuration_code",
      label: "Configuration Code",
      type: "Code",
      rows: 8,
      placeholder: "// Enter configuration code...",
      description: "Configuration or calibration code"
    },

    // Password Protected Settings
    {
      name: "admin_password",
      label: "Admin Password",
      type: "Password",
      placeholder: "Enter password",
      description: "Password for admin access"
    },

    // Parts Table
    {
      name: "section_parts",
      label: "Spare Parts Inventory",
      type: "Section Break",
      description: "Track spare parts for this asset"
    },
    {
      name: "spare_parts",
      label: "Spare Parts",
      type: "Table",
      columns: [
        { name: "part_name", label: "Part Name", type: "text" },
        { name: "part_number", label: "Part Number", type: "text" },
        { name: "quantity", label: "Quantity", type: "number" },
        { name: "cost", label: "Cost (₹)", type: "number" }
      ],
      description: "List of spare parts"
    },

    // Maintenance History Table
    {
      name: "section_history",
      label: "Maintenance History",
      type: "Section Break"
    },
    {
      name: "maintenance_history",
      label: "Maintenance Records",
      type: "Table MultiSelect",
      columns: [
        { name: "date", label: "Date", type: "date" },
        { name: "type", label: "Type", type: "text" },
        { name: "cost", label: "Cost (₹)", type: "number" },
        { name: "notes", label: "Notes", type: "text" }
      ],
      description: "Historical maintenance records"
    },

    // Read-only fields
    {
      name: "created_by",
      label: "Created By",
      type: "Read Only",
      readOnlyValue: "System Administrator"
    },
    {
      name: "last_modified",
      label: "Last Modified",
      type: "Read Only",
      readOnlyValue: new Date().toLocaleString()
    },

    // Custom button
    {
      name: "generate_report",
      label: "Generate Asset Report",
      type: "Button",
      buttonLabel: "Generate Report",
      action: () => {
        console.log("Generating report...");
        alert("Report generation started!");
      }
    },

    // Digital Signature
    {
      name: "approval_signature",
      label: "Approval Signature",
      type: "Signature",
      description: "Signature of approving authority"
    }
  ];

  const handleSubmit = (data: Record<string, any>) => {
    console.log("Form submitted:", data);
    // Handle form submission - API call, etc.
    alert("Form submitted successfully!");
    router.push(`/assets/${doctypeName}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <DynamicForm
      fields={formFields}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`Edit ${doctypeName} Record`}
      description={`Update details for record ID: ${docname}`}
      submitLabel="Save Changes"
      cancelLabel="Cancel"
    />
  );
}