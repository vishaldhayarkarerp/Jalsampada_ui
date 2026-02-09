"use client";

import * as React from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
    DynamicForm,
    TabbedLayout,
    FormField,
} from "@/components/DynamicFormComponent";
import { getApiMessages } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

/* -------------------------------------------------
1. Stock Reconciliation type interfaces
------------------------------------------------- */

interface StockReconciliationItemRow {
    item_code?: string;          // Link -> Item
    store_location?: string;     // Link -> Store Location
    quantity?: number;           // Float
    stock_uom?: string;          // Data
    valuation_rate?: number;     // Currency
    barcode?: string;           // Data
    item_group?: string;        // Data
    amount?: number;            // Currency
}

interface StockReconciliationData {
    name: string;
    naming_series?: string;                      // Select
    purpose?: "Opening Stock" | "Stock Reconciliation"; // Select
    posting_date?: string;                // Date
    posting_time?: string;                // Time
    set_posting_time?: 0 | 1;       // Check
    set_warehouse?: string;           // Link -> Warehouse
    scan_barcode?: string;                // Data
    scan_mode?: 0 | 1;                    // Check
    items?: StockReconciliationItemRow[]; // Table -> Items
    difference_account?: string;          // Link -> Account
    cost_center?: string;                 // Link -> Cost Center

    docstatus: 0 | 1 | 2 | number; // Draft, Submitted, Cancelled
    modified: string;
}

/* -------------------------------------------------
2. Page component
------------------------------------------------- */

export default function StockReconciliationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

    const docname = params.id as string;
    const doctypeName = "Stock Reconciliation";

    const [stockReconciliation, setStockReconciliation] = React.useState<StockReconciliationData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const isProgrammaticUpdate = React.useRef(false);
    const [formVersion, setFormVersion] = React.useState(0);
    const [formInstance, setFormInstance] = React.useState<any>(null);
    const [editDateTime, setEditDateTime] = React.useState<boolean>(false);

    // NEW: Track which button to show
    const [activeButton, setActiveButton] = React.useState<"SAVE" | "SUBMIT" | "CANCEL" | null>(null);
    const [formDirty, setFormDirty] = React.useState(false);

    /* -------------------------------------------------
    3. FETCH DOCUMENT
    ------------------------------------------------- */

    React.useEffect(() => {
        const fetchDoc = async () => {
            if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret || !docname) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const resp = await axios.get(
                    `${API_BASE_URL}/${doctypeName}/${docname}`,
                    {
                        headers: {
                            Authorization: `token ${apiKey}:${apiSecret}`,
                            "Content-Type": "application/json",
                        },
                        withCredentials: true,
                        maxBodyLength: Infinity,
                        maxContentLength: Infinity,
                    }
                );

                const data = resp.data.data as StockReconciliationData;
                setStockReconciliation(data);
                setEditDateTime(data.set_posting_time === 1);

                // Initialize button state based on document status
                if (data.docstatus === 0) { // Draft
                    setActiveButton("SUBMIT");
                } else if (data.docstatus === 1) { // Submitted
                    setActiveButton("CANCEL");
                }

                setFormDirty(false);
            } catch (err: any) {
                console.error("API Error:", err);

                const messages = getApiMessages(
                    null,
                    err,
                    "Record loaded successfully",
                    "Failed to load record",
                    (error) => {
                        if (error.response?.status === 404) return "Record not found";
                        if (error.response?.status === 403) return "Unauthorized";
                        if (error.response?.status === 417) {
                            const serverMessages = error.response?.data?._server_messages;
                            if (serverMessages) {
                                try {
                                    const parsed = JSON.parse(serverMessages);
                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                        const messageObj = typeof parsed[0] === 'string' ? JSON.parse(parsed[0]) : parsed[0];
                                        return messageObj.message || error.response?.data?.exception || "Validation failed";
                                    }
                                } catch (e) {
                                    console.error("Failed to parse server messages:", e);
                                }
                            }
                            return error.response?.data?.exception || "Validation failed - Server cannot meet requirements";
                        }
                        return "Failed to load record";
                    }
                );

                setError(messages.description || messages.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDoc();
    }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

    React.useEffect(() => {
        if (!formInstance) return;

        const subscription = formInstance.watch((value: any, { name }: { name?: string }) => {
            // Watch for set_posting_time checkbox changes
            if (name === "set_posting_time" || name === undefined) {
                const isEditable = formInstance.getValues("set_posting_time");
                setEditDateTime(!!isEditable);
            }

            // Watch for form changes to mark as dirty
            if (name && !isProgrammaticUpdate.current) {
                setFormDirty(true);
                // When form becomes dirty, show SAVE button
                if (stockReconciliation?.docstatus === 0) {
                    setActiveButton("SAVE");
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [formInstance, stockReconciliation?.docstatus]);

    const handleFormInit = React.useCallback((form: any) => {
        setFormInstance(form);
    }, []);

    /* -------------------------------------------------
    4. Build tabs once when data is ready
    ------------------------------------------------- */

    const formTabs: TabbedLayout[] = React.useMemo(() => {
        if (!stockReconciliation) return [];

        const fields = (list: FormField[]): FormField[] =>
            list.map((f) => ({
                ...f,
                defaultValue:
                    f.name in stockReconciliation
                        ? stockReconciliation[f.name as keyof StockReconciliationData]
                        : f.defaultValue,
            }));

       return [
            {
                name: "Details",
                fields: [
                    {
                        name: "naming_series",
                        label: "Series",
                        type: "Select",
                        options: [
                            { label: "MAT-REC-", value: "MAT-REC-" },
                            { label: "STK-REC-", value: "STK-REC-" },
                            { label: "INV-REC-", value: "INV-REC-" },
                        ],
                        defaultValue: "MAT-REC-",
                        required: true,
                    },
                    {
                        name: "purpose",
                        label: "Purpose",
                        type: "Select",
                        options: [
                            { label: "Opening Stock", value: "Opening Stock" },
                            { label: "Stock Reconciliation", value: "Stock Reconciliation" },
                        ],
                        required: true,
                        defaultValue: "Stock Reconciliation",
                    },

                    {
                        name: "posting_date",
                        label: "Posting Date",
                        type: editDateTime ? "Date" : "Read Only",
                        fieldColumns: 1,
                        defaultValue: stockReconciliation.posting_date ? stockReconciliation?.posting_date?.split("T")[0] : undefined,
                    },
                    {
                        name: "posting_time",
                        label: "Posting Time",
                        type: editDateTime ? "Time" : "Read Only",
                        fieldColumns: 1,
                        defaultValue: stockReconciliation.posting_time ? stockReconciliation?.posting_time?.split("T")[1]?.split(".")[0] : undefined,
                    },
                    {
                        name: "set_posting_time",
                        label: "Edit Posting Date and Time",
                        type: "Check",
                        fieldColumns: 1,
                    },


                    {
                        name: "set_warehouse",
                        label: "Default Warehouse",
                        type: "Link",
                        linkTarget: "Warehouse",
                        fieldColumns: 1,
                    },
                    {
                        name: "scan_barcode",
                        label: "Scan Barcode",
                        type: "Data",
                        fieldColumns: 1,
                    },
                    {
                        name: "scan_mode",
                        label: "Scan Mode",
                        type: "Check",
                        fieldColumns: 1,
                    },
                    {
                        name: "items",
                        label: "Items",
                        type: "Table",
                        showDownloadUpload: true,
                        columns: [
                            { name: "item_code", 
                                label: "Item Code", 
                                type: "Link", 
                                linkTarget: "Item", 
                                required: true 
                            },
                            {
                                name: "store_location",
                                label: "Store Location",
                                type: "Link",
                                linkTarget: "Store Location",
                                filterMapping: [
                                    { sourceField: "parent.set_warehouse", targetField: "warehouse" }
                                ]
                            },
                           
                            {
                                name: "current_qty",
                                label: "Current Qty",
                                type: "Float",
                                defaultValue: 0,
                                readOnly: true
                            },
                            {
                                name: "qty",
                                label: "Quantity",
                                type: "Float",
                                required: true,
                                defaultValue: 0
                            },
                            {
                                name: "stock_uom",
                                label: "Stock UOM",
                                type: "Link",
                                linkTarget: "UOM",
                                fetchFrom: { sourceField: "stock_uom", targetDoctype: "Item", targetField: "item_code" }
                            },
                            {
                                name: "valuation_rate",
                                label: "Valuation Rate",
                                type: "Currency",
                                precision: 2,
                                defaultValue: "0.00",
                                fetchFrom: { sourceField: "valuation_rate", targetDoctype: "Item", targetField: "item_code" }
                            },
                            {
                                name: "barcode",
                                label: "Barcode",
                                type: "Data"
                            },
                            {
                                name: "item_group",
                                label: "Item Group",
                                type: "Link",
                                linkTarget: "Item Group",
                                fetchFrom: { sourceField: "item_group", targetDoctype: "Item", targetField: "item_code" }
                            },
                            {
                                name: "amount",
                                label: "Amount",
                                type: "Currency",
                                defaultValue: "0.00",
                                precision: 2,
                                formula: "qty * valuation_rate",
                                readOnly: true
                            },
                             {
                                name: "use_serial_batch_fields",
                                label: "Use Serial No/ Batch Fields",
                                type: "Check",
                                defaultValue: false
                            },
                            {
                                name: "reconcile_all_serial_batches",
                                label: "Reconcile all serial Nos/Batches",
                                type: "Check",
                                displayDependsOn: "use_serial_batch_fields==false"
                            },
                            {
                                name: "serial_batch_no_type",
                                label: "Serial/Batch No",
                                type: "Select",
                                options: [
                                    { label: "Serial No", value: "Serial No" },
                                    { label: "Batch No", value: "Batch No" }
                                ],
                                displayDependsOn: "use_serial_batch_fields==false"
                            },
                            //   { 
                            //     name: "add_serial_batch_no_button", 
                            //     label: "Add Serial/Batch No", 
                            //     type: "Button",
                            //     buttonType: "route",
                            //     routePath: "/operations/doctype/serial-no", // Change this to your actual route
                            //     displayDependsOn: "use_serial_batch_fields==false",
                            //     buttonVariant: "outline"
                            //   },
                        ],
                    },
                    {
                        name: "cb3",
                        label: "",
                        type: "Section Break",
                    },
                    {
                        name: "difference_account",
                        label: "Difference Account",
                        type: "Link",
                        linkTarget: "Account",
                    },
                    {
                        name: "cost_center",
                        label: "Cost Center",
                        type: "Link",
                        linkTarget: "Cost Center",
                    },
                ],
            },
        ];
    }, [stockReconciliation, editDateTime]);

    /* -------------------------------------------------
    5. SUBMIT – Save only (no submit functionality)
    ------------------------------------------------- */

    const handleSubmit = async (
        data: Record<string, any>,
        isDirty: boolean
    ): Promise<{ status?: string } | void> => {
        if (!isDirty) {
            toast.info("No changes to save.");
            return;
        }

        // 🟢 CLIENT-SIDE VALIDATION LOGIC 🟢
        // Validate required fields
        if (!data.naming_series) {
            toast.error("Validation Failed", {
                description: "Series is required.",
                duration: Infinity
            });
            return;
        }

        if (!data.purpose) {
            toast.error("Validation Failed", {
                description: "Purpose is required.",
                duration: Infinity
            });
            return;
        }

        // Validate posting date and time if editing is enabled
        if (data.set_posting_time) {
            if (!data.posting_date) {
                toast.error("Validation Failed", {
                    description: "Posting Date is required when editing is enabled.",
                    duration: Infinity
                });
                return;
            }

            if (!data.posting_time) {
                toast.error("Validation Failed", {
                    description: "Posting Time is required when editing is enabled.",
                    duration: Infinity
                });
                return;
            }
        }

        // Validate items table
        const items = data.items || [];
        if (items.length === 0) {
            toast.error("Validation Failed", {
                description: "At least one item is required in the Items table.",
                duration: Infinity
            });
            return;
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.item_code) {
                toast.error("Validation Failed", {
                    description: `Item Code is required for row ${i + 1}.`,
                    duration: Infinity
                });
                return;
            }

            if (item.quantity === undefined || item.quantity === null || item.quantity <= 0) {
                toast.error("Validation Failed", {
                    description: `Quantity must be greater than 0 for row ${i + 1}.`,
                    duration: Infinity
                });
                return;
            }
        }

        // If validation passes, proceed to save
        setIsSaving(true);
        isProgrammaticUpdate.current = true;

        try {
            const payload: Record<string, any> = JSON.parse(JSON.stringify(data));

            // Clean payload: remove non-data fields
            const allFields = formTabs.flatMap((tab) => tab.fields);
            const nonDataFields = new Set<string>();
            allFields.forEach((field) => {
                if (
                    field.type === "Section Break" ||
                    field.type === "Column Break" ||
                    field.type === "Button" ||
                    field.type === "Read Only"
                ) {
                    nonDataFields.add(field.name);
                }
            });

            const finalPayload: Record<string, any> = {};
            for (const key in payload) {
                if (!nonDataFields.has(key)) {
                    finalPayload[key] = payload[key];
                }
            }

            if (!stockReconciliation) {
                alert("Error: Record data not loaded. Cannot save.");
                setIsSaving(false);
                return;
            }

            finalPayload.modified = stockReconciliation.modified;
            finalPayload.docstatus = stockReconciliation.docstatus;

            // Boolean conversions
            const boolFields = [
                "set_posting_time",
                "scan_mode",
            ];
            boolFields.forEach((f) => {
                if (f in finalPayload) {
                    finalPayload[f] = finalPayload[f] ? 1 : 0;
                }
            });

            // Numeric conversions
            const numericFields = [
                "quantity",
                "valuation_rate",
                "amount",
            ];
            numericFields.forEach((f) => {
                if (f in finalPayload) {
                    finalPayload[f] = Number(finalPayload[f]) || 0;
                }
            });

            // Child table numeric conversions
            if (Array.isArray(finalPayload.items)) {
                finalPayload.items = finalPayload.items.map(
                    (row: any) => {
                        return {
                            ...row,
                            quantity: Number(row.quantity) || 0,
                            valuation_rate: Number(row.valuation_rate) || 0,
                            amount: Number(row.amount) || 0,
                        };
                    }
                );
            }

            // Send payload
            console.log("Sending this PAYLOAD to Frappe:", finalPayload);

            const resp = await axios.put(
                `${API_BASE_URL}/${doctypeName}/${docname}`,
                finalPayload,
                {
                    headers: {
                        Authorization: `token ${apiKey}:${apiSecret}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                }
            );

            // Handle successful response
            const messages = getApiMessages(resp, null, "Changes saved!", "Failed to save");

            if (messages.success) {
                toast.success(messages.message, { description: messages.description });
            } else {
                toast.error(messages.message, { description: messages.description, duration: Infinity });
            }

            if (resp.data && resp.data.data) {
                // Update state with new data
                const updatedData = resp.data.data as StockReconciliationData;
                setStockReconciliation(updatedData);
                setEditDateTime(updatedData.set_posting_time === 1);
                setFormDirty(false);

                // Update button state after save
                if (updatedData.docstatus === 0) { // Still draft
                    setActiveButton("SUBMIT");
                }

                // Force DynamicForm remount
                setFormVersion((v) => v + 1);
            }

            // Return appropriate status based on docstatus
            const savedStatus = resp.data.data.docstatus === 0 ? "Draft" : "Submitted";

            return { status: savedStatus };
        } catch (err: any) {
            console.error("Save error:", err);
            console.log("Full server error:", err.response?.data);

            const messages = getApiMessages(
                null,
                err,
                "Changes saved!",
                "Failed to save",
                (error) => {
                    if (error.response?.status === 404) return "Record not found";
                    if (error.response?.status === 403) return "Unauthorized";
                    if (error.response?.status === 417) {
                        const serverMessages = error.response?.data?._server_messages;
                        if (serverMessages) {
                            try {
                                const parsed = JSON.parse(serverMessages);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    const messageObj = typeof parsed[0] === 'string' ? JSON.parse(parsed[0]) : parsed[0];
                                    return messageObj.message || error.response?.data?.exception || "Validation failed";
                                }
                            } catch (e) {
                                console.error("Failed to parse server messages:", e);
                            }
                        }
                        return error.response?.data?.exception || "Validation failed - Server cannot meet requirements";
                    }
                    return "Failed to save record";
                }
            );

            toast.error(messages.message, { description: messages.description, duration: Infinity });
        } finally {
            setIsSaving(false);
            isProgrammaticUpdate.current = false;
        }
    };

    const handleCancel = async () => {
        if (!apiKey || !apiSecret) {
            toast.error("Authentication required");
            return;
        }

        try {
            await axios.post(
                `http://103.219.1.138:4412/api/method/frappe.client.cancel`,
                {
                    doctype: "Stock Reconciliation",
                    name: docname,
                },
                {
                    headers: {
                        Authorization: `token ${apiKey}:${apiSecret}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast.success("Document cancelled successfully");

            // Update local state without reload
            const updatedStockReconciliation = { ...stockReconciliation!, docstatus: 1 };
            setStockReconciliation(updatedStockReconciliation);
            setActiveButton(null); // Remove cancel button after cancellation
        } catch (err) {
            console.error(err);
            toast.error("Failed to cancel document");
        }
    };

    /* -------------------------------------------------
    6. UI STATES
    ------------------------------------------------- */

    if (loading) {
        return <div>Loading stock reconciliation details...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col gap-2">
                <div>{error}</div>
                <button
                    className="border px-3 py-1 rounded"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!stockReconciliation) {
        return <div>Stock Reconciliation not found.</div>;
    }

    const handleSubmitDocument = async () => {
        if (!formInstance) return;

        const formData = formInstance.getValues();
        if (!apiKey || !apiSecret || !isInitialized || !isAuthenticated) {
            toast.error("Authentication required");
            return;
        }

        setIsSaving(true);

        try {
            // Prepare payload similar to handleSubmit
            const payload: Record<string, any> = JSON.parse(JSON.stringify(formData));

            // Convert numeric fields
            const numericFields = [
                "quantity",
                "valuation_rate",
                "amount",
            ];
            numericFields.forEach((f) => {
                if (f in payload) payload[f] = Number(payload[f]) || 0;
            });

            // Child table numeric conversions
            if (Array.isArray(payload.items)) {
                payload.items = payload.items.map((row: any) => ({
                    ...row,
                    quantity: Number(row.quantity) || 0,
                    valuation_rate: Number(row.valuation_rate) || 0,
                    amount: Number(row.amount) || 0,
                }));
            }

            // Set docstatus to 1 (submitted)
            payload.docstatus = 1;

            const response = await axios.put(
                `${API_BASE_URL}/Stock Reconciliation/${encodeURIComponent(docname)}`,
                payload,
                {
                    headers: { Authorization: `token ${apiKey}:${apiSecret}` },
                }
            );

            toast.success("Document submitted successfully!");

            // Update local state without reload
            const updatedData = response.data.data as StockReconciliationData;
            setStockReconciliation(updatedData);
            setEditDateTime(updatedData.set_posting_time === 1);
            setFormDirty(false);

            // Update button to CANCEL after submission
            setActiveButton("CANCEL");

            // Force form remount with new docstatus
            setFormVersion((v) => v + 1);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to submit document");
        } finally {
            setIsSaving(false);
        }
    };

    const isSubmitted = stockReconciliation.docstatus === 1;
    const isDraft = stockReconciliation.docstatus === 0;

    // Determine submit label based on active button
    const getSubmitLabel = () => {
        if (isSaving) {
            switch (activeButton) {
                case "SAVE": return "Saving...";
                case "SUBMIT": return "Submitting...";
                case "CANCEL": return "Cancelling...";
                default: return "Processing...";
            }
        }

        switch (activeButton) {
            case "SAVE": return "Save";
            case "SUBMIT": return "Submit";
            case "CANCEL": return "Cancel";
            default: return undefined;
        }
    };

    const formKey = `${stockReconciliation.name}-${stockReconciliation.docstatus}-${formVersion}`;

    /* -------------------------------------------------
    7. RENDER FORM
    ------------------------------------------------- */

    return (
        <DynamicForm
            key={formKey}
            title={`Stock Reconciliation ${stockReconciliation.name}`}
            tabs={formTabs}
            onSubmit={activeButton === "SAVE" ? handleSubmit : async () => { }}
            onSubmitDocument={activeButton === "SUBMIT" ? handleSubmitDocument : undefined}
            onCancelDocument={activeButton === "CANCEL" ? handleCancel : undefined}
            isSubmittable={activeButton === "SUBMIT"}
            docstatus={stockReconciliation.docstatus}
            initialStatus={isDraft ? "Draft" : "Submitted"}
            onFormInit={handleFormInit}
            doctype={doctypeName}
            submitLabel={getSubmitLabel()}
            deleteConfig={{
                doctypeName: doctypeName,
                docName: docname,
                redirectUrl: "/operations/doctype/stock-reconciliation",
            }}
        />
    );
}