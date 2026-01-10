"use client";

import * as React from "react";
import { FormField, FieldType } from "./DynamicFormComponent";
import { Button } from "@/components/ui/button";
import { LinkInput } from "./LinkInput";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Checkbox } from "@/components/ui/checkbox";
import { useTableRowContext } from "./TableRowContext";
import { cn } from "@/lib/utils";
import { Upload, X, Eye } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://103.219.1.138:4412/";

// Helper: Build dynamic filters for Link fields
function buildDynamicFilters(
    field: FormField,
    getValue: (name: string) => any
): Record<string, any> {
    const filters: Record<string, any> = {};
    if (field.filterMapping?.length) {
        field.filterMapping.forEach((mapping) => {
            const sourceValue = getValue(mapping.sourceField);
            if (sourceValue) {
                filters[mapping.targetField] = sourceValue;
            }
        });
    } else if (typeof field.filters === "function") {
        Object.assign(filters, field.filters(getValue));
    }
    return filters;
}

interface DynamicFormForTableProps {
    fields: FormField['columns'];
    data: Record<string, any>;
    onSubmit: (data: Record<string, any>) => void;
    onCancel: () => void;
    title?: string;
}

// Local UI helper components
function FieldHelp({ text }: { text?: string }) {
    if (!text) return null;
    return (
        <div
            style={{
                marginTop: 6,
                fontSize: "0.85rem",
                color: "var(--color-text-muted, #6b7280)",
            }}
        >
            {text}
        </div>
    );
}

function FieldError({ error }: { error?: any }) {
    if (!error) return null;
    return (
        <div className="text-error" style={{ marginTop: 6, fontSize: "0.85rem" }}>
            {String(error.message || error)}
        </div>
    );
}

export function DynamicFormForTable({
    fields,
    data,
    onSubmit,
    onCancel,
    title = "Edit Row"
}: DynamicFormForTableProps) {
    const { editingRowIndex, updateRow, getRowData } = useTableRowContext();
    const { apiKey, apiSecret } = useAuth();

    // We'll use controlled components instead of form hooks to avoid nested forms
    const [formData, setFormData] = React.useState<Record<string, any>>({});

    // Always get the latest data from context when editingRowIndex changes
    React.useEffect(() => {
        if (editingRowIndex !== null) {
            const currentRowData = getRowData(editingRowIndex);
            console.log('DynamicFormForTable getting current data from context:', currentRowData);
            setFormData(currentRowData || {});
        }
    }, [editingRowIndex, getRowData]);

    // Initialize form data when data prop changes (fallback)
    React.useEffect(() => {
        if (editingRowIndex === null && data) {
            console.log('DynamicFormForTable received data prop:', data);
            setFormData(data || {});
        }
    }, [data, editingRowIndex]);

    const handleInputChange = async (fieldName: string, value: any, _depth: number = 0) => {
        const newFormData = { ...formData, [fieldName]: value };
        setFormData(newFormData);

        // Real-time update to the context if we have an editing row
        if (editingRowIndex !== null) {
            updateRow(editingRowIndex, { [fieldName]: value });
        }

        // Handle fetchFrom dependencies
        const dependentFields = (fields || []).filter(f => f.fetchFrom?.sourceField === fieldName);

        if (dependentFields.length === 0) return;

        if (!value) {
            // Clear all dependent fields
            dependentFields.forEach((dep) => {
                handleInputChange(dep.name, "", _depth + 1);
            });
            return;
        }

        // Prepare API request data
        const targetDoctype = dependentFields[0].fetchFrom!.targetDoctype;
        const targetFields = [...new Set(dependentFields.map(f => f.fetchFrom!.targetField))];

        try {
            const response = await axios.get(`${API_BASE_URL}api/method/frappe.client.validate_link`, {
                params: {
                    doctype: targetDoctype,
                    docname: value,
                    fields: JSON.stringify(targetFields),
                },
                headers: {
                    Authorization: `token ${apiKey}:${apiSecret}`,
                },
            });

            const responseData = response.data?.message || {};
            console.log("validate_link response:", responseData);

            // Batch update all dependent fields
            const fieldUpdates: Record<string, any> = {};

            dependentFields.forEach((dep) => {
                const targetField = dep.fetchFrom!.targetField;
                const newValue = responseData[targetField] ?? "";
                fieldUpdates[dep.name] = newValue;

                if (process.env.NODE_ENV === 'development') {
                    console.log(`Setting ${dep.name} ← ${targetField} = ${newValue}`);
                }
            });

            // Update form state and context in single batch
            setFormData(current => {
                const updatedData = { ...current, ...fieldUpdates };

                // Update context if editing
                if (editingRowIndex !== null) {
                    updateRow(editingRowIndex, fieldUpdates);
                }

                return updatedData;
            });

        } catch (error) {
            console.error("fetchFrom dependency update failed:", {
                fieldName,
                value,
                targetDoctype,
                error: error instanceof Error ? error.message : error
            });
        }
    };

    const handleSubmit = () => {
        console.log('Submitting form data:', formData);
        onSubmit(formData);
    };

    const renderLink = (field: FormField) => {
        const value = formData[field.name] ?? "";
        console.log(`Rendering Link field for ${field.name}:`, { value, formData: formData[field.name] });

        // Build dynamic filters for Link fields
        const getValue = (name: string) => formData[name];
        const filtersToPass = buildDynamicFilters(field, getValue);
        const filterKey = `${field.name}-${JSON.stringify(filtersToPass)}`;

        return (
            <div className="form-group">
                <label className="form-label">
                    {field.label}
                    {field.required ? " *" : ""}
                </label>
                <LinkInput
                    key={filterKey}
                    value={value}
                    onChange={(val) => handleInputChange(field.name, val)}
                    placeholder={field.placeholder || `Select ${field.label}...`}
                    linkTarget={field.linkTarget}
                    className="w-full"
                    filters={filtersToPass}
                />
                <FieldError error={null} />
                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderInput = (field: FormField, type: string = "text") => {
        const value = formData[field.name] ?? "";
        return (
            <div className="form-group">
                <label htmlFor={field.name} className="form-label">
                    {field.label}
                    {field.required ? " *" : ""}
                </label>
                <input
                    id={field.name}
                    type={type}
                    className="form-control"
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    {...(field.step ? { step: field.step } : {})}
                    {...(field.min !== undefined ? { min: field.min } : {})}
                    {...(field.max !== undefined ? { max: field.max } : {})}
                />
                <FieldError error={null} />
                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderTextarea = (field: FormField, rows = 4) => {
        const value = formData[field.name] ?? "";

        return (
            <div className="form-group">
                <label htmlFor={field.name} className="form-label">
                    {field.label}
                    {field.required ? " *" : ""}
                </label>
                <textarea
                    id={field.name}
                    rows={field.rows ?? rows}
                    className="form-control"
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
                <FieldError error={null} />
                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderSelect = (field: FormField) => {
        const value = formData[field.name] ?? "";
        const options =
            typeof field.options === "string"
                ? field.options.split("\n").map((o) => ({
                    label: o,
                    value: o,
                }))
                : field.options;

        return (
            <div className="form-group">
                <label htmlFor={field.name} className="form-label">
                    {field.label}
                    {field.required ? " *" : ""}
                </label>

                <select
                    id={field.name}
                    className="form-control"
                    value={value}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                >
                    <option value="">Select...</option>
                    {options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <FieldError error={null} />
                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderCheckbox = (field: FormField) => {
        const checked = !!formData[field.name];

        return (
            <div className="flex items-center gap-2">
                <Checkbox
                    id={field.name}
                    checked={checked}
                    onCheckedChange={(val) => handleInputChange(field.name, val)}
                    className="rounded border border-gray-300 data-[state=checked]:bg-primary"
                />
                <label
                    htmlFor={field.name}
                    className="text-sm font-medium leading-none cursor-pointer"
                >
                    {field.label}
                </label>
                {field.description && (
                    <div className="ml-2">
                        <FieldHelp text={field.description} />
                    </div>
                )}
            </div>
        );
    };

    const renderDateLike = (
        field: FormField,
        type: "date" | "datetime-local" | "time"
    ) => {
        const value = formData[field.name] ?? "";

        if (type === "date") {
            return (
                <div className="form-group">
                    <label htmlFor={field.name} className="form-label">
                        {field.label}
                        {field.required ? " *" : ""}
                    </label>
                    <DatePicker
                        selected={value ? new Date(value) : null}
                        onChange={(date: Date | null) => {
                            handleInputChange(field.name, date ? date.toISOString().split('T')[0] : '');
                        }}
                        dateFormat="dd/MM/yyyy"
                        className="form-control"
                        placeholderText="DD/MM/YYYY"
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                    />
                    <FieldError error={null} />
                    <FieldHelp text={field.description} />
                </div>
            );
        }

        return (
            <div className="form-group">
                <label htmlFor={field.name} className="form-label">
                    {field.label}
                    {field.required ? " *" : ""}
                </label>
                <input
                    id={field.name}
                    type={type}
                    className="form-control"
                    value={value}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
                <FieldError error={null} />
                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderColor = (field: FormField) => {
        const value = formData[field.name] ?? "#000000";

        return (
            <div className="form-group">
                <label htmlFor={field.name} className="form-label">
                    {field.label}
                    {field.required ? " *" : ""}
                </label>
                <input
                    id={field.name}
                    type="color"
                    className={cn("form-control h-10 p-1")}
                    value={value}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
                <FieldError error={null} />
                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderDuration = (field: FormField) => {
        const value = formData[field.name] ?? {};
        const base = field.name;

        return (
            <div className="form-group">
                <label className="form-label">
                    {field.label}
                    {field.required ? " *" : ""}
                </label>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 8,
                    }}
                >
                    <input
                        type="number"
                        min={0}
                        className="form-control"
                        placeholder="Hours"
                        value={value.hours || ""}
                        onChange={(e) => handleInputChange(field.name, { ...value, hours: e.target.value })}
                    />
                    <input
                        type="number"
                        min={0}
                        className="form-control"
                        placeholder="Minutes"
                        value={value.minutes || ""}
                        onChange={(e) => handleInputChange(field.name, { ...value, minutes: e.target.value })}
                    />
                    <input
                        type="number"
                        min={0}
                        className="form-control"
                        placeholder="Seconds"
                        value={value.seconds || ""}
                        onChange={(e) => handleInputChange(field.name, { ...value, seconds: e.target.value })}
                    />
                </div>
                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderRating = (field: FormField) => {
        const value = formData[field.name] ?? 0;

        return (
            <div className="form-group">
                <label className="form-label">
                    {field.label}
                    {field.required ? " *" : ""}
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleInputChange(field.name, star)}
                            style={{
                                color: star <= value ? '#fbbf24' : '#d1d5db',
                                padding: '4px 8px',
                                fontSize: '16px'
                            }}
                        >
                            ★
                        </button>
                    ))}
                </div>
                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderReadOnly = (field: FormField) => {
        const value = formData[field.name];
        return (
            <div className="form-group">
                <label className="form-label">{field.label}</label>
                <div
                    style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-base)",
                        padding: 12,
                        background: "var(--color-surface-muted, transparent)",
                    }}
                >
                    {field.readOnlyValue ?? value ?? "—"}
                </div>
                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderButton = (field: FormField) => (
        <div className="form-group">
            <button
                type="button"
                className="btn btn--outline btn--full-width"
                onClick={() => field.action?.()}
            >
                {field.buttonLabel || field.label}
            </button>
            <FieldHelp text={field.description} />
        </div>
    );

    const renderAttachment = (field: FormField) => {
        const value = formData[field.name];
        const fileInputRef = React.useRef<HTMLInputElement | null>(null);

        const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

        React.useEffect(() => {
            let objectUrl: string | null = null;

            if (value instanceof File) {
                // Case 1: New file selected by user
                objectUrl = URL.createObjectURL(value);
                setPreviewUrl(objectUrl);

            } else if (typeof value === 'string' && (value.startsWith("/files/") || value.startsWith("/private/files/"))) {
                setPreviewUrl(API_BASE_URL + value);

            } else {
                setPreviewUrl(null);
            }

            return () => {
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                }
            };
        }, [value]);

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                handleInputChange(field.name, file);
            }
        };

        const handleClear = () => {
            handleInputChange(field.name, null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };

        return (
            <div className="form-group flex flex-col gap-2">
                <label className="form-label font-medium">{field.label}</label>

                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    {!value ? (
                        // "Browse" button
                        <Button
                            type="button"
                            variant="outline"
                            className="btn--sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={14} className="mr-2" />
                            Attach
                        </Button>
                    ) : (
                        // Show file name and action buttons
                        <>

                            <span className="text-sm truncate flex-1" title={typeof value === 'string' ? value : value.name}>
                                {typeof value === 'string' ? value.split('/').pop() : value.name}
                            </span>

                            {/* Preview (Eye) Button */}
                            {previewUrl && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    asChild
                                >
                                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Preview">
                                        <Eye size={16} />
                                    </a>
                                </Button>
                            )}

                            {/* Clear (X) Button */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={handleClear}
                                title="Clear"
                            >
                                <X size={16} />
                            </Button>
                        </>
                    )}
                </div>

                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderField = (field: FormField) => {
        switch (field.type) {
            case "Data":
            case "Small Text":
            case "Text":
                return renderInput(field, "text");
            case "Long Text":
            case "Markdown Editor":
                return renderTextarea(field, field.rows ?? 4);
            case "Code":
                return renderTextarea(field, field.rows ?? 6);
            case "Password":
                return renderInput(field, "password");
            case "Int":
                return renderInput(field, "number");
            case "Float":
            case "Currency":
            case "Percent":
                return renderInput(field, "number");
            case "Color":
                return renderColor(field);
            case "Date":
                return renderDateLike(field, "date");
            case "DateTime":
                return renderDateLike(field, "datetime-local");
            case "Time":
                return renderDateLike(field, "time");
            case "Duration":
                return renderDuration(field);
            case "Check":
                return renderCheckbox(field);
            case "Select":
                return renderSelect(field);
            case "Link":
                return renderLink(field);
            case "Barcode":
                return renderInput(field, "text");
            case "Read Only":
                return renderReadOnly(field);
            case "Rating":
                return renderRating(field);
            case "Button":
                return renderButton(field);
            case "Attach":
                return renderAttachment(field);
            default:
                return renderInput(field, "text");
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields?.map((field) => (
                    <div key={field.name}>
                        {renderField(field)}
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="button" className="btn btn--primary" onClick={handleSubmit}>
                    Save
                </Button>
            </div>
        </div>
    );
}