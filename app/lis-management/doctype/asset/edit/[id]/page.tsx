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
   1. Asset type – mirrors the API exactly
   ------------------------------------------------- */
interface AssetData {
    name: string;
    naming_series?: string;
    asset_name?: string;
    asset_category?: string;
    custom_asset_no?: string;
    location?: string;
    custom_lis_name?: string;
    custom_stage_no?: string;
    custom_serial_number?: string;
    status?: string;
    company?: string;
    asset_owner?: string;
    asset_owner_company?: string;
    is_existing_asset?: 0 | 1;
    is_composite_asset?: 0 | 1;
    is_composite_component?: 0 | 1;
    purchase_date?: string;
    gross_purchase_amount?: number;
    asset_quantity?: number;
    calculate_depreciation?: 0 | 1;
    opening_accumulated_depreciation?: number;
    opening_number_of_booked_depreciations?: number;
    is_fully_depreciated?: 0 | 1;
    depreciation_method?: string;
    value_after_depreciation?: number;
    maintenance_required?: 0 | 1;
    custom_previous_hours?: number;
    custom_condition?: string;
    docstatus: 0 | 1 | 2;
    modified: string;
    additional_asset_cost?: number;
    total_asset_cost?: number;

    // Insurance fields (may be missing)
    policy_number?: string;
    insurance_start_date?: string;
    insurer?: string;
    insurance_end_date?: string;
    insured_value?: number;
    comprehensive_insurance?: 0 | 1;

    // Other-info fields (may be missing)
    custodian?: string;
    department?: string;
    custom_equipement_make?: string;
    custom_equipement_model?: string;
    installation_date?: string;
    custom_equipement_capacity?: string;
    last_repair_date?: string;
    custom_equipement_rating?: string;

    // Child tables
    finance_books?: Array<{
        finance_book?: string;
        depreciation_method?: string;
        rate?: number;
    }>;
    custom_drawing_attachment?: Array<{
        name_of_document?: string;
        attachment?: string | File; // Can be a string (URL) or a new File
    }>;
    custom_asset_specifications?: Array<{
        specification_type: string;
        details: string;
    }>;
}

/**
 * --- NEW HELPER FUNCTION ---
 * Uploads a single file to Frappe's 'upload_file' method
 * and returns the server URL.
 */
async function uploadFile(
    file: File,
    apiKey: string,
    apiSecret: string,
    methodUrl: string
): Promise<string> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("is_private", "0"); // 0 = Public, 1 = Private

    try {
        // Note: The base URL for this MUST be the root, not /api/resource
        const resp = await axios.post(
            `${methodUrl.replace("/api/resource", "")}/api/method/upload_file`,
            formData,
            {
                headers: {
                    Authorization: `token ${apiKey}:${apiSecret}`,
                },
                withCredentials: true,
            }
        );

        if (resp.data && resp.data.message) {
            return resp.data.message.file_url; // This is the /files/filename.jpg URL
        } else {
            throw new Error("Invalid response from file upload");
        }
    } catch (err) {
        console.error("File upload failed:", err);
        throw err;
    }
}

/* -------------------------------------------------
   2. Page component
   ------------------------------------------------- */
export default function RecordDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

    const docname = params.id as string;
    const doctypeName = "Asset";

    const [asset, setAsset] = React.useState<AssetData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);

    /* -------------------------------------------------
       3. FETCH ASSET
       ------------------------------------------------- */
    React.useEffect(() => {
        const fetchAsset = async () => {
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
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                });

                setAsset(resp.data.data);
                // console.log("setAsset is called");
            } catch (err: any) {
                console.error("API Error:", err);
                setError(
                    err.response?.status === 404
                        ? "Asset not found"
                        : err.response?.status === 403
                            ? "Unauthorized"
                            : "Failed to load asset"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAsset();
    }, [docname, apiKey, apiSecret, isAuthenticated, isInitialized]);

    /* -------------------------------------------------
       4. Build tabs **once** when asset is ready
       ------------------------------------------------- */
    const formTabs: TabbedLayout[] = React.useMemo(() => {
        if (!asset) return [];

        const bool = (v?: 0 | 1) => v === 1;

        const fields = (list: FormField[]): FormField[] =>
            list.map((f) => ({
                ...f,
                defaultValue:
                    f.name in asset
                        ? // @ts-ignore – asset has the key
                        asset[f.name as keyof AssetData]
                        : f.defaultValue,
            }));

        return [
            {
                name: "Details",
                fields: fields([

                    { name: "status", label: "Status", type: "Read Only" },
                    { name: "asset_name", label: "Asset Name", type: "Text", required: true },
                    { name: "company", label: "Company", type: "Link", required: true, linkTarget: "Company" },
                    { name: "asset_category", label: "Asset Category", type: "Link", linkTarget: "Asset Category" },

                    { name: "custom_asset_no", label: "Asset No", type: "Data" },
                    { name: "location", label: "Location", type: "Link", required: true, linkTarget: "Location" },
                    { name: "custom_lis_name", label: "Lift Irrigation Scheme", type: "Link", linkTarget: "Lift Irrigation Scheme" },
                    { name: "custom_stage_no", label: "Stage No.", type: "Link", linkTarget: "Stage No" },
                    { name: "custom_serial_number", label: "Serial Number", type: "Data" },
                    {
                        name: "is_existing_asset",
                        label: "Is Existing Asset",
                        type: "Check",
                        displayDependsOn: "is_composite_asset==0 && is_composite_component==0 && custom_obsolete==0",
                    },
                    {
                        name: "is_composite_asset",
                        label: "Is Composite Asset",
                        type: "Check",
                        displayDependsOn: "is_existing_asset==0 && is_composite_component==0 && custom_obsolete==0",
                    },
                    {
                        name: "is_composite_component",
                        label: "Is Composite Component",
                        type: "Check",
                        displayDependsOn: "is_composite_asset==0 && is_existing_asset==0 && custom_obsolete==0",
                    },
                    {
                        name: "custom_obsolete",
                        label: "Is Obsolete",
                        type: "Check",
                        displayDependsOn: "is_composite_asset==0 && is_existing_asset==0 && is_composite_component==0",
                    },

                    { name: "section_purchase", label: "Purchase Details", type: "Section Break" },

                    {
                        name: "purchase_date",
                        label: "Purchase Date",
                        type: "Date",
                        required: true,
                        displayDependsOn: "is_existing_asset==1 || is_composite_asset==1",
                    },

                    { name: "gross_purchase_amount", label: "Net Purchase Amount", type: "Currency", required: true },

                    { name: "asset_quantity", label: "Asset Quantity", type: "Int", min: 1 },

                    {
                        name: "available_for_use_date",
                        label: "Commisioning Date",
                        type: "Date",
                        displayDependsOn: "is_existing_asset==1 || is_composite_asset==1",
                    },

                ]),
            },

            {
                name: "Insurance",
                fields: fields([
                    { name: "policy_number", label: "Policy number", type: "Data" },
                    { name: "insurance_start_date", label: "Insurance Start Date", type: "Date" },
                    { name: "insurer", label: "Insurer", type: "Data" },
                    { name: "insurance_end_date", label: "Insurance End Date", type: "Date" },
                    { name: "insured_value", label: "Insured value", type: "Currency" },
                    { name: "comprehensive_insurance", label: "Comprehensive Insurance", type: "Check" },
                ]),
            },

            {
                name: "Other Info",
                fields: fields([
                    { name: "custodian", label: "Custodian", type: "Link", linkTarget: "Employee" },
                    { name: "department", label: "Department", type: "Link", linkTarget: "Department" },
                    { name: "installation_date", label: "Installation Date", type: "Date" },
                    { name: "custom_equipement_make", label: "Equipement Make", type: "Link", linkTarget: "Equipement Make" },
                    { name: "custom_equipement_model", label: "Equipement Model", type: "Link", linkTarget: "Equipement Model" },
                    { name: "last_repair_date", label: "Last Repair Date", type: "Date" },
                    { name: "custom_equipement_capacity", label: "Equipement Capacity", type: "Link", linkTarget: "Equipement Capacity" },
                    { name: "custom_equipement_rating", label: "Equipement Rating", type: "Link", linkTarget: "Rating" },
                    { name: "maintenance_required", label: "Maintenance Required", type: "Check" },
                    { name: "custom_previous_hours", label: "Previous Running Hours", type: "Float" },
                    {
                        name: "custom_condition",
                        label: "Condition",
                        type: "Select",
                        options: [{ label: "Working", value: "Working" }, { label: "Under Repair", value: "Under Repair", }],
                    },
                    { name: "custom_description", label: "Description", type: "Long Text",
                        displayDependsOn: "custom_condition=='Under Repair'",

                     },

                    { name: "section_specifications", label: "Specification of Asset", type: "Section Break" },
                    {
                        name: "custom_asset_specifications",
                        label: "Asset Specifications",
                        type: "Table",
                        columns: [
                            { name: "specification_type", label: "Specification Type", type: "Link", linkTarget: "Specifications" },
                            { name: "details", label: "Details", type: "Data" },
                        ],
                    },
                ]),
            },

            {
                name: "Drawing Attachment",
                fields: fields([
                    {
                        name: "custom_drawing_attachment",
                        label: "Drawing Attachment",
                        type: "Table",
                        columns: [
                            { name: "name_of_document", label: "Name of Document", type: "Text" },
                            { name: "attachment", label: "Attachment", type: "Attach" },
                        ],
                    },
                ]),
            },


        ];
    }, [asset]);

    /* -------------------------------------------------
       5. SUBMIT – Now with File Uploading (Corrected Logic)
       ------------------------------------------------- */
    const handleSubmit = async (data: Record<string, any>, isDirty: boolean) => {

        if (!isDirty) {
            toast.info("No changes to save.");
            return;
        }

        setIsSaving(true);

        try {
            // 1. Create a deep copy of the form data. This will be our FINAL payload.
            const payload: Record<string, any> = JSON.parse(JSON.stringify(data));

            // 2. Handle File Uploads
            if (payload.custom_drawing_attachment && apiKey && apiSecret) {
                toast.info("Uploading attachments...");

                // Use Promise.all to upload all new files in parallel
                await Promise.all(
                    payload.custom_drawing_attachment.map(async (row: any, index: number) => {
                        // Get the original value from the 'data' object (which has the File)
                        const originalFile = data.custom_drawing_attachment[index]?.attachment;

                        if (originalFile instanceof File) {
                            // This is a new file that needs to be uploaded
                            try {
                                // Pass the base URL, not the resource URL
                                const fileUrl = await uploadFile(originalFile, apiKey, apiSecret, API_BASE_URL.replace("/api/resource", ""));

                                // --- THIS IS THE CRITICAL CHANGE ---
                                // We update the 'attachment' field *inside* our 'payload'
                                row.attachment = fileUrl;
                                // -----------------------------------

                            } catch (err) {
                                // Throw an error to stop the save
                                throw new Error(`Failed to upload file: ${originalFile.name}`);
                            }
                        }
                        // If it's not a File, it's already a string URL (or null),
                        // so we don't need an 'else' block. It's already correct in 'payload'.
                    })
                );
            }

            // 3. Clean the payload (remove virtual fields)
            const allFields = formTabs.flatMap(tab => tab.fields);
            const nonDataFields = new Set<string>();
            allFields.forEach(field => {
                if (
                    field.type === "Section Break" ||
                    field.type === "Column Break" ||
                    field.type === "Button" ||
                    field.type === "Read Only"
                ) {
                    nonDataFields.add(field.name);
                }
            });

            // We create 'finalPayload' *from our modified payload*, not from 'data'
            const finalPayload: Record<string, any> = {};
            for (const key in payload) {
                if (!nonDataFields.has(key)) {
                    finalPayload[key] = payload[key];
                }
            }

            // 4. Add metadata
            if (!asset) {
                alert("Error: Asset data not loaded. Cannot save.");
                setIsSaving(false);
                return;
            }
            finalPayload.modified = asset.modified;
            finalPayload.docstatus = asset.docstatus;

            // 5. Conversions
            const boolFields = [
                "is_existing_asset", "is_composite_asset", "is_composite_component",
                "calculate_depreciation", "is_fully_depreciated",
                "maintenance_required", "comprehensive_insurance",
            ];
            boolFields.forEach((f) => {
                if (f in finalPayload) finalPayload[f] = finalPayload[f] ? 1 : 0;
            });

            const numericFields = [
                "gross_purchase_amount", "additional_asset_cost", "total_asset_cost",
                "asset_quantity", "opening_accumulated_depreciation",
                "opening_number_of_booked_depreciations", "value_after_depreciation",
                "custom_previous_hours", "insured_value"
            ];
            numericFields.forEach((f) => {
                finalPayload[f] = Number(finalPayload[f]) || 0;
            });

            // 6. Delete "Set Only Once" fields
            delete finalPayload.naming_series;

            console.log("Sending this PAYLOAD to Frappe:", finalPayload);

            // 7. Send the final payload
            const resp = await axios.put(`${API_BASE_URL}/${doctypeName}/${docname}`, finalPayload, {
                headers: {
                    Authorization: `token ${apiKey}:${apiSecret}`,
                    "Content-Type": "application/json",
                },
                withCredentials: true,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            });

            toast.success("Changes saved!");

            if (resp.data && resp.data.data) {
                setAsset(resp.data.data);
            }

            router.push(`/lis-management/doctype/asset/${docname}`);

        } catch (err: any) {
            console.error("Save error:", err);
            console.log("Full server error:", err.response?.data);
            toast.error("Failed to save", {
                description: (err as Error).message || "Check the browser console (F12) for the full server error."
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => router.back();

    /* -------------------------------------------------
       5. DUPLICATE FUNCTIONALITY (Shift+D)
       ------------------------------------------------- */
    const handleDuplicate = React.useCallback(() => {
        if (!asset) {
            toast.error("Asset data not loaded. Cannot duplicate.");
            return;
        }

        // Prepare data for duplication - exclude fields that should not be copied
        const duplicateData: Record<string, any> = {};

        // Fields to exclude from duplication
        const excludeFields = [
            'name', 'naming_series', 'docstatus', 'modified', 'creation',
            'owner', 'modified_by', 'idx', 'status'
        ];

        // Copy all other fields
        Object.keys(asset).forEach(key => {
            if (!excludeFields.includes(key) && asset[key as keyof AssetData] !== undefined) {
                duplicateData[key] = asset[key as keyof AssetData];
            }
        });

        // Encode the data for URL transmission
        const encodedData = btoa(JSON.stringify(duplicateData));

        // Navigate to new page with duplicate data
        router.push(`/lis-management/doctype/asset/new?duplicate=${encodeURIComponent(encodedData)}`);

        toast.success("Asset data copied! Creating duplicate...");
    }, [asset, router]);

    // Add keyboard event listener for Shift+D
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.shiftKey && event.key === 'D') {
                event.preventDefault();
                handleDuplicate();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDuplicate]);

    /* -------------------------------------------------
       6. UI STATES
       ------------------------------------------------- */
    if (loading) {
        return (
            <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
                <p>Loading asset details...</p>
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

    if (!asset) {
        return (
            <div className="module active" style={{ padding: "2rem" }}>
                <p>Asset not found.</p>
            </div>
        );
    }

    /* -------------------------------------------------
       7. RENDER FORM
       ------------------------------------------------- */
    return (
        <DynamicForm
            tabs={formTabs}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            title={`Edit Asset: ${asset.name}`}
            description={`Update details for record ID: ${docname}`}
            submitLabel={isSaving ? "Saving..." : "Save Changes"}
            cancelLabel="Cancel"
        />
    );
}