"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DynamicForm,
  TabbedLayout,
  FormField,
} from "@/components/DynamicFormComponent";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API_BASE_URL = "http://192.168.1.30:4429//api/resource";

export default function NewRecordPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  const doctypeName = "Lift Irrigation Scheme";

  /* -------------------------------------------------
     1. Define the BLANK form structure
     ------------------------------------------------- */
  const formTabs: TabbedLayout[] = [
    {
      name: "Details",
      fields: [
        {
          name: "lis_name",
          label: "Lift Irrigation Scheme Name",
          type: "Data",
          required: true,
          description: "This name will be used as the ID for the new record."
        },
      ],
    },
  ];

  /* -------------------------------------------------
     2. SUBMIT (Create) - Using 'fetch' and CSRF Token
     ------------------------------------------------- */
  const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {
    
    if (!isDirty) {
      toast.info("Please fill out the form.");
      return;
    }
    setIsSaving(true);
    
    try {
      // Build the payload
      const finalPayload = {
        doctype: doctypeName,
        lis_name: data.lis_name,
        // Frappe will automatically set 'name' = 'lis_name'
        // because of your "Auto Name: field:lis_name" setting
      };

      console.log("Sending this NEW DOC to Frappe:", finalPayload);
      
      // --- This is the working method from your "Healthcare" app ---
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `token ${apiKey}:${apiSecret}`,
      };

      // Add the CSRF token (the "PIN") from browser storage
      const storedCsrfToken = localStorage.getItem('csrfToken');
      if (storedCsrfToken) {
        headers['X-Frappe-CSRF-Token'] = storedCsrfToken;
      }
      // -----------------------------------------------------------

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
      
      toast.success("Lift Irrigation Scheme created!");
      
      // Go to the main list page for this doctype
      router.push(`/lis-management/doctype/lift-irrigation-scheme`);

    } catch (err: any) {
      console.error("Save error:", err);
      console.log("Full server error message:", err.message); 
      toast.error("Failed to create document", {
        description: err.message || "Check the browser console (F12) for details."
      });
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
      title="New Lift Irrigation Scheme"
      description="Create a new LIS record"
      submitLabel={isSaving ? "Creating..." : "Create"}
      cancelLabel="Cancel"
    />
  );
}