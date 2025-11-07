"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Star } from "lucide-react";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldSet,
    FieldLegend,
    FieldDescription,
    FieldContent,
    FieldSeparator,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Field configuration type
export type FieldType =
    | "Data"
    | "Small Text"
    | "Text"
    | "Long Text"
    | "Code"
    | "Color"
    | "Currency"
    | "Float"
    | "Int"
    | "Date"
    | "DateTime"
    | "Time"
    | "Duration"
    | "Check"
    | "Select"
    | "Link"
    | "Table"
    | "Read Only"
    | "Password"
    | "Signature"
    | "Markdown Editor"
    | "Section Break"
    | "Column Break"
    | "Barcode"
    | "Button"
    | "Table MultiSelect"
    | "Percent"
    | "Rating";

export interface FormField {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    description?: string;
    placeholder?: string;
    options?: { label: string; value: string }[];
    defaultValue?: any;
    min?: number;
    max?: number;
    step?: number;
    rows?: number;
    columns?: { name: string; label: string; type: string }[];
    action?: () => void;
    buttonLabel?: string;
    readOnlyValue?: string;
}

export interface DynamicFormProps {
    fields: FormField[];
    onSubmit: (data: Record<string, any>) => void;
    onCancel?: () => void;
    title?: string;
    description?: string;
    submitLabel?: string;
    cancelLabel?: string;
}

export function DynamicForm({
    fields,
    onSubmit,
    onCancel,
    title = "Form",
    description,
    submitLabel = "Submit",
    cancelLabel = "Cancel",
}: DynamicFormProps) {
    const [formData, setFormData] = React.useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        fields.forEach(field => {
            if (field.defaultValue !== undefined) {
                initial[field.name] = field.defaultValue;
            }
        });
        return initial;
    });

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderField = (field: FormField) => {
        const value = formData[field.name];

        switch (field.type) {
            case "Small Text":
            case "Text":
            case "Data":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Input
                            id={field.name}
                            name={field.name}
                            type="text"
                            placeholder={field.placeholder}
                            value={value || ""}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required={field.required}
                        />
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Long Text":
            case "Markdown Editor":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Textarea
                            id={field.name}
                            name={field.name}
                            placeholder={field.placeholder}
                            value={value || ""}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            rows={field.rows || 4}
                            required={field.required}
                        />
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Code":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Textarea
                            id={field.name}
                            name={field.name}
                            placeholder={field.placeholder}
                            value={value || ""}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            rows={field.rows || 6}
                            required={field.required}
                            className="font-mono text-sm"
                        />
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Password":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Input
                            id={field.name}
                            name={field.name}
                            type="password"
                            placeholder={field.placeholder}
                            value={value || ""}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required={field.required}
                        />
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Int":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Input
                            id={field.name}
                            name={field.name}
                            type="number"
                            step="1"
                            min={field.min}
                            max={field.max}
                            placeholder={field.placeholder}
                            value={value || ""}
                            onChange={(e) => handleChange(field.name, parseInt(e.target.value) || "")}
                            required={field.required}
                        />
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Float":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Input
                            id={field.name}
                            name={field.name}
                            type="number"
                            step={field.step || "0.01"}
                            min={field.min}
                            max={field.max}
                            placeholder={field.placeholder}
                            value={value || ""}
                            onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || "")}
                            required={field.required}
                        />
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Currency":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                ₹
                            </span>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="number"
                                step="0.01"
                                min={field.min || 0}
                                placeholder={field.placeholder || "0.00"}
                                value={value || ""}
                                onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || "")}
                                required={field.required}
                                className="pl-8"
                            />
                        </div>
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Percent":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <div className="relative">
                            <Input
                                id={field.name}
                                name={field.name}
                                type="number"
                                step="0.01"
                                min={field.min || 0}
                                max={field.max || 100}
                                placeholder={field.placeholder}
                                value={value || ""}
                                onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || "")}
                                required={field.required}
                                className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                %
                            </span>
                        </div>
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Color":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <div className="flex gap-2">
                            <Input
                                id={field.name}
                                name={field.name}
                                type="color"
                                value={value || "#000000"}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                required={field.required}
                                className="w-20 h-10"
                            />
                            <Input
                                type="text"
                                value={value || "#000000"}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                placeholder="#000000"
                                className="flex-1"
                            />
                        </div>
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Date":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {value ? format(value, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={value}
                                    onSelect={(date) => handleChange(field.name, date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "DateTime":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Input
                            id={field.name}
                            name={field.name}
                            type="datetime-local"
                            value={value || ""}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required={field.required}
                        />
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Time":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Input
                            id={field.name}
                            name={field.name}
                            type="time"
                            value={value || ""}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required={field.required}
                        />
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Duration":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="number"
                                min="0"
                                placeholder="HH"
                                value={value?.hours || ""}
                                onChange={(e) => handleChange(field.name, { ...value, hours: e.target.value })}
                                className="w-20"
                            />
                            <span>:</span>
                            <Input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="MM"
                                value={value?.minutes || ""}
                                onChange={(e) => handleChange(field.name, { ...value, minutes: e.target.value })}
                                className="w-20"
                            />
                            <span>:</span>
                            <Input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="SS"
                                value={value?.seconds || ""}
                                onChange={(e) => handleChange(field.name, { ...value, seconds: e.target.value })}
                                className="w-20"
                            />
                        </div>
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Check":
                return (
                    <Field key={field.name} orientation="horizontal" className="flex items-center justify-between rounded-lg border p-4 bg-card">
                        <FieldContent>
                            <FieldLabel htmlFor={field.name}>
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </FieldLabel>
                            {field.description && (
                                <FieldDescription>{field.description}</FieldDescription>
                            )}
                        </FieldContent>
                        <Checkbox
                            id={field.name}
                            checked={value || false}
                            onCheckedChange={(checked) => handleChange(field.name, checked)}
                        />
                    </Field>
                );

            case "Select":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Select
                            value={value || ""}
                            onValueChange={(val) => handleChange(field.name, val)}
                        >
                            <SelectTrigger id={field.name}>
                                <SelectValue placeholder={field.placeholder || "Select an option"} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Link":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Input
                            id={field.name}
                            name={field.name}
                            type="url"
                            placeholder={field.placeholder || "https://"}
                            value={value || ""}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required={field.required}
                        />
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Barcode":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <Input
                            id={field.name}
                            name={field.name}
                            type="text"
                            placeholder={field.placeholder || "Enter barcode"}
                            value={value || ""}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            required={field.required}
                            className="font-mono"
                        />
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Read Only":
                return (
                    <Field key={field.name}>
                        <FieldLabel>{field.label}</FieldLabel>
                        <div className="rounded-md border px-3 py-2 text-sm bg-muted">
                            {field.readOnlyValue || value || "—"}
                        </div>
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Rating":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleChange(field.name, star)}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={cn(
                                            "h-6 w-6",
                                            star <= (value || 0)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                        )}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                                {value || 0} / 5
                            </span>
                        </div>
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Signature":
                return (
                    <Field key={field.name}>
                        <FieldLabel htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <div className="border-2 border-dashed rounded-md p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Signature field - Integration required
                            </p>
                            <Button type="button" variant="outline" className="mt-2">
                                Add Signature
                            </Button>
                        </div>
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Table":
            case "Table MultiSelect":
                return (
                    <Field key={field.name} className="col-span-2">
                        <FieldLabel>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {field.columns?.map((col) => (
                                            <TableHead key={col.name}>{col.label}</TableHead>
                                        ))}
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(value || []).map((row: any, idx: number) => (
                                        <TableRow key={idx}>
                                            {field.columns?.map((col) => (
                                                <TableCell key={col.name}>
                                                    <Input
                                                        type={col.type}
                                                        value={row[col.name] || ""}
                                                        onChange={(e) => {
                                                            const newValue = [...(value || [])];
                                                            newValue[idx] = { ...row, [col.name]: e.target.value };
                                                            handleChange(field.name, newValue);
                                                        }}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newValue = (value || []).filter((_: any, i: number) => i !== idx);
                                                        handleChange(field.name, newValue);
                                                    }}
                                                >
                                                    ×
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="p-2 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const newRow: any = {};
                                        field.columns?.forEach(col => {
                                            newRow[col.name] = "";
                                        });
                                        handleChange(field.name, [...(value || []), newRow]);
                                    }}
                                >
                                    + Add Row
                                </Button>
                            </div>
                        </div>
                        {field.description && (
                            <FieldDescription>{field.description}</FieldDescription>
                        )}
                    </Field>
                );

            case "Button":
                return (
                    <Field key={field.name}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={field.action}
                            className="w-full"
                        >
                            {field.buttonLabel || field.label}
                        </Button>
                    </Field>
                );

            case "Section Break":
                return (
                    <div key={field.name} className="col-span-2">
                        <FieldSeparator className="my-6" />
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold">{field.label}</h3>
                            {field.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {field.description}
                                </p>
                            )}
                        </div>
                    </div>
                );

            case "Column Break":
                return <div key={field.name} className="col-span-2" />;

            default:
                return null;
        }
    };

    return (
        <div className="module active">
            <form onSubmit={handleSubmit}>
                <div className="module-header">
                    <div>
                        <h2>{title}</h2>
                        {description && <p>{description}</p>}
                    </div>
                    <Button type="submit">
                        <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                        {submitLabel}
                    </Button>
                </div>

                <div className="form-grid-2-col">
                    <FieldGroup className="form-column">
                        {fields
                            .filter((_, idx) => idx % 2 === 0)
                            .map((field) => renderField(field))}
                    </FieldGroup>
                    <FieldGroup className="form-column">
                        {fields
                            .filter((_, idx) => idx % 2 !== 0)
                            .map((field) => renderField(field))}
                    </FieldGroup>
                </div>

                <FieldSeparator style={{ margin: 'var(--space-24) 0' }} />

                <Field orientation="horizontal">
                    <Button type="submit">{submitLabel}</Button>
                    {onCancel && (
                        <Button variant="outline" type="button" onClick={onCancel}>
                            {cancelLabel}
                        </Button>
                    )}
                </Field>
            </form>
        </div>
    );
}