"use client";

import * as React from "react";
import {
  DynamicForm,
  TabbedLayout,
} from "@/components/DynamicFormComponent";
import { UseFormReturn } from "react-hook-form";

export default function ParameterChecklistPage() {
  const doctypeName = "Device Type";
  const [isSaving, setIsSaving] = React.useState(false);

  // (Optional) keep form methods if needed later
  const [formMethods, setFormMethods] =
    React.useState<UseFormReturn<any> | null>(null);

  /* -------------------------------------------------
     Form tabs configuration (UI only)
  ------------------------------------------------- */
  const formTabs: TabbedLayout[] = React.useMemo(() => {
    return [
      {
        name: "Details",
        fields: [
          {
            name: "device_type",
            label: "Device Type",
            type: "Text",
            required: true,
          },
        ],
      },
    ];
  }, []);

  /* -------------------------------------------------
     UI-only submit / cancel handlers
  ------------------------------------------------- */
  const handleSubmit = async (
    data: Record<string, any>,
    isDirty: boolean
  ) => {
    if (!isDirty) {
      console.log("No changes to submit");
      return;
    }

    setIsSaving(true);

    // UI-only: just log data
    console.log("Form submitted with data:", data);

    // Simulate save delay
    setTimeout(() => {
      setIsSaving(false);
      console.log("Save complete (UI only)");
    }, 500);
  };

  const handleCancel = () => {
    console.log("Form cancelled");
  };

  /* -------------------------------------------------
     RENDER UI
  ------------------------------------------------- */
  return (
    <DynamicForm
      tabs={formTabs}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      title={`New ${doctypeName}`}
      description="Maintenance Device Type"
      submitLabel={isSaving ? "Saving..." : "Save"}
      cancelLabel="Cancel"
      onFormInit={(methods) => setFormMethods(methods)}
    />
  );
}