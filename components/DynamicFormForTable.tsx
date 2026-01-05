"use client";

import * as React from "react";
import { FormField, FieldType } from "./DynamicFormComponent";
import { Button } from "@/components/ui/button";
import { LinkInput } from "./LinkInput";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Checkbox } from "@/components/ui/checkbox";
import { useTableRowContext } from "./TableRowContext";

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

    const handleInputChange = (fieldName: string, value: any) => {
        console.log('Field changed:', fieldName, 'to:', value);
        const newFormData = { ...formData, [fieldName]: value };
        setFormData(newFormData);

        // Real-time update to the context if we have an editing row
        if (editingRowIndex !== null) {
            updateRow(editingRowIndex, { [fieldName]: value });
        }
    };

    const handleSubmit = () => {
        console.log('Submitting form data:', formData);
        onSubmit(formData);
    };

    const renderLink = (field: FormField) => {
        const value = formData[field.name] ?? "";
        console.log(`Rendering Link field for ${field.name}:`, { value, formData: formData[field.name] });

        return (
            <div className="form-group">
                <label className="form-label">
                    {field.label}
                    {field.required ? " *" : ""}
                </label>
                <LinkInput
                    value={value}
                    onChange={(val) => handleInputChange(field.name, val)}
                    placeholder={field.placeholder || `Select ${field.label}...`}
                    linkTarget={field.linkTarget}
                    className="w-full"
                />
                <FieldError error={null} />
                <FieldHelp text={field.description} />
            </div>
        );
    };

    const renderInput = (field: FormField, type: string = "text") => {
        const value = formData[field.name] ?? "";
        console.log(`Rendering input for ${field.name}:`, {
            value,
            formData: formData[field.name],
            fullFormData: formData,
            fieldType: field.type
        });

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
            case "Date":
                return renderDateLike(field, "date");
            case "DateTime":
                return renderDateLike(field, "datetime-local");
            case "Time":
                return renderDateLike(field, "time");
            case "Check":
                return renderCheckbox(field);
            case "Select":
                return renderSelect(field);
            case "Link":
                return renderLink(field);
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
                <Button type="button" onClick={handleSubmit}>
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
