"use client";

import * as React from "react";
import {
  useForm,
  FormProvider,
  useFieldArray,
  FieldErrors,
  RegisterOptions,
} from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useRef } from "react";

import { TableField } from "./TableField"; 
import { LinkField } from "./LinkField";
// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
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
  | "Rating"
  | "Attach";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  linkTarget?: string;
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
  pattern?: RegExp | string;
  patternMessage?: string;
}

// Tabbed layout
export interface TabbedLayout {
  name: string;
  fields: FormField[];
}

// Props
export interface DynamicFormProps {
  tabs: TabbedLayout[];
  onSubmit: (data: Record<string, any>, isDirty: boolean) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: default values
// ─────────────────────────────────────────────────────────────────────────────
function buildDefaultValues(fields: FormField[]) {
  const dv: Record<string, any> = {};
  for (const f of fields) {
    if (f.defaultValue !== undefined) {
      dv[f.name] = f.defaultValue;
    } else {
      if (f.type === "Check") dv[f.name] = false;
      if (f.type === "Duration")
        dv[f.name] = { hours: 0, minutes: 0, seconds: 0 };
      if (f.type === "Table" || f.type === "Table MultiSelect") dv[f.name] = [];
    }
  }
  return dv;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: validation rules
// ─────────────────────────────────────────────────────────────────────────────
function rulesFor(field: FormField): RegisterOptions<Record<string, any>, string> {
  const rules: RegisterOptions<Record<string, any>, string> = {};
  if (field.required) rules.required = `${field.label} is required`;
  if (field.min !== undefined)
    rules.min = { value: field.min, message: `${field.label} must be >= ${field.min}` };
  if (field.max !== undefined)
    rules.max = { value: field.max, message: `${field.label} must be <= ${field.max}` };

  // if (field.type === "Link") {
  //   rules.validate = (val: string) => {
  //     if (!val) return true;
  //     try {
  //       new URL(val);
  //       return true;
  //     } catch (_) {
  //       return "Please enter a valid URL";
  //     }
  //   };
  // }

  if (field.type === "Percent") {
    if (rules.min === undefined) rules.min = { value: 0, message: "Percent must be between 0 and 100" };
    if (rules.max === undefined) rules.max = { value: 100, message: "Percent must be between 0 and 100" };
  }

  if (field.pattern) {
    const pattern = typeof field.pattern === "string" ? new RegExp(field.pattern) : field.pattern;
    rules.pattern = {
      value: pattern,
      message: field.patternMessage || `${field.label} format is invalid`,
    };
  }

  return rules;
}

// ─────────────────────────────────────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────────────────────────────────────
function FieldHelp({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 6, fontSize: "0.85rem", color: "var(--color-text-muted, #6b7280)" }}>
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

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function DynamicForm({
  tabs,
  onSubmit,
  onCancel,
  title = "Form",
  description,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
}: DynamicFormProps) {
  // ── TAB STATE ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState(0);

  // ── ALL FIELDS (for defaultValues) ───────────────────────────────────────
  const allFields = React.useMemo(() => tabs.flatMap((t) => t.fields), [tabs]);
  const defaultValues = React.useMemo(() => buildDefaultValues(allFields), [allFields]);

  // ── RHF SETUP ─────────────────────────────────────────────────────────────
  
  // --- THIS IS THE FIX ---
  // 1. We ONLY call useForm ONCE and store it in 'methods'.
  const methods = useForm<Record<string, any>>({ 
    defaultValues, 
    mode: "onBlur",
  });
  
  // 2. We destructure everything from 'methods'
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    setValue,
    watch,
  } = methods;

  // 3. We DELETE the second, buggy useForm call
  // const {
  //   register,
  //   handleSubmit,
  //   formState: { errors, isDirty },
  //   control,
  //   setValue,
  //   watch,
  // } = useForm<Record<string, any>>({ defaultValues, mode: "onBlur" });
  // --- END OF FIX ---

  const activeTabFields = tabs[activeTab]?.fields || [];

  // ── tiny register wrapper (type-safety) ───────────────────────────────────
  const reg = React.useCallback(
    (name: string, options?: any) => register(name, options),
    [register]
  );

  const onFormSubmit = (data: Record<string, any>) => onSubmit(data, isDirty);
  
  // ── RENDER HELPERS (no hooks inside) ─────────────────────────────────────
  const renderInput = (field: FormField, type: string = "text") => {
    const rules = rulesFor(field);
    const commonProps: any = {
      id: field.name,
      className: "form-control",
      placeholder: field.placeholder,
      ...(field.step ? { step: field.step } : {}),
      ...(field.min !== undefined ? { min: field.min } : {}),
      ...(field.max !== undefined ? { max: field.max } : {}),
    };

    const valueAsNumber = ["Int", "Float", "Currency", "Percent"].includes(field.type);

    return (
      <div className="form-group">
        <label htmlFor={field.name} className="form-label">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <input
          type={type}
          {...reg(field.name, { ...rules, ...(valueAsNumber ? { valueAsNumber: true } : {}) })}
          {...commonProps}
        />
        <FieldError error={(errors as FieldErrors<Record<string, any>>)[field.name]} />
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderTextarea = (field: FormField, rows = 4) => {
    const rules = rulesFor(field);
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
          {...reg(field.name, rules)}
        />
        <FieldError error={(errors as FieldErrors<Record<string, any>>)[field.name]} />
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderSelect = (field: FormField) => {
    const rules = rulesFor(field);
    return (
      <div className="form-group">
        <label htmlFor={field.name} className="form-label">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <select id={field.name} className="form-control" {...reg(field.name, rules)}>
          <option value="">Select...</option>
          {(field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <FieldError error={(errors as FieldErrors<Record<string, any>>)[field.name]} />
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderCheckbox = (field: FormField) => {
    const rules = rulesFor(field);

    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={field.name}
          className="rounded border border-gray-300 data-[state=checked]:bg-primary"
          {...reg(field.name, rules)}
        />

        <label
          htmlFor={field.name}
          className="text-sm font-medium leading-none cursor-pointer"
        >
          {field.label}
        </label>

        <FieldError error={(errors as any)[field.name]} />

        {field.description && (
          <div className="ml-2">
            <FieldHelp text={field.description} />
          </div>
        )}
      </div>
    );
  };


  const renderColor = (field: FormField) => {
    const rules = rulesFor(field);
    return (
      <div className="form-group">
        <label htmlFor={field.name} className="form-label">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <input id={field.name} type="color" className="form-control" {...reg(field.name, rules)} />
        <FieldError error={(errors as FieldErrors<Record<string, any>>)[field.name]} />
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderDateLike = (field: FormField, type: "date" | "datetime-local" | "time") => {
    const rules = rulesFor(field);
    return (
      <div className="form-group">
        <label htmlFor={field.name} className="form-label">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <input id={field.name} type={type} className="form-control" {...reg(field.name, rules)} />
        <FieldError error={(errors as FieldErrors<Record<string, any>>)[field.name]} />
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderDuration = (field: FormField) => {
    const base = field.name;
    return (
      <div className="form-group">
        <label className="form-label">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <input
            type="number"
            min={0}
            className="form-control"
            placeholder="Hours"
            {...reg(`${base}.hours`, rulesFor({ ...field, name: `${base}.hours`, label: "Hours" }))}
          />
          <input
            type="number"
            min={0}
            className="form-control"
            placeholder="Minutes"
            {...reg(`${base}.minutes`, rulesFor({ ...field, name: `${base}.minutes`, label: "Minutes" }))}
          />
          <input
            type="number"
            min={0}
            className="form-control"
            placeholder="Seconds"
            {...reg(`${base}.seconds`, rulesFor({ ...field, name: `${base}.seconds`, label: "Seconds" }))}
          />
        </div>
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderRating = (field: FormField) => {
    const name = field.name;
    const current = watch(name) ?? 0;
    const set = (val: number) =>
      setValue(name, val, { shouldValidate: true, shouldDirty: true });

    return (
      <div className="form-group">
        <label className="form-label">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set(n)}
              className={`btn btn--outline btn--sm`}
              style={{
                borderColor: current >= n ? "var(--color-warning)" : undefined,
                color: current >= n ? "var(--color-warning)" : undefined,
              }}
            >
              Star
            </button>
          ))}
        </div>
        <FieldError error={(errors as FieldErrors<Record<string, any>>)[field.name]} />
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderReadOnly = (field: FormField) => {
    const val = watch(field.name); 
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
          {field.readOnlyValue ?? val ?? "—"}
        </div>
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderButton = (field: FormField) => (
    <div className="form-group">
      <button type="button" className="btn btn--outline btn--full-width" onClick={field.action}>
        {field.buttonLabel || field.label}
      </button>
      <FieldHelp text={field.description} />
    </div>
  );

  const renderAttachment = (field: FormField) => {
    const rules = rulesFor(field);
    const value = watch(field.name);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // get registration props once so we can merge refs safely
    const registration = reg(field.name, rules) as any;
    const { ref: registerRef, ...registerRest } = registration || {};

    return (
      <div className="form-group flex flex-col gap-2">
        <label className="form-label font-medium">{field.label}</label>

        <input
          type="file"
          className="hidden"
          {...registerRest}
          ref={(el: HTMLInputElement | null) => {
            // keep local ref
            fileInputRef.current = el;
            // also forward to react-hook-form's ref
            if (typeof registerRef === "function") {
              registerRef(el);
            } else if (registerRef) {
              (registerRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
            }
          }}
          onChange={(e) => {
            // use the registration onChange if present
            if (registration && registration.onChange) registration.onChange(e);
            const file = e.target.files?.[0];
            if (file) {
              setValue(field.name, file);
            }
          }}
        />

        {!value && (
          <Button
            variant="outline"
            className="w-fit flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            Upload File
          </Button>
        )}

        {value && (
          <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-md border">
            <span className="text-sm flex-1">{value?.name}</span>

            <Button
              variant="outline"
              className="h-8 px-2"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500"
              onClick={() => setValue(field.name, null)}
            >
              <X size={16} />
            </Button>
          </div>
        )}

        <FieldError error={errors[field.name]} />
      </div>
    );
  };





  // ── MAIN FIELD SWITCH ─────────────────────────────────────────────────────
  const renderField = (field: FormField, idx: number) => {
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
        return (
          <LinkField
            key={field.name}
            field={field}
            control={control}
            error={(errors as FieldErrors<Record<string, any>>)[field.name]}
          />
        );
      case "Barcode":
        return renderInput(field, "text");
      case "Read Only":
        return renderReadOnly(field);
      case "Rating":
        return renderRating(field);
      case "Table":
      case "Table MultiSelect":
        return (
          <TableField
            key={field.name}
            field={field}
            control={control}
            register={reg}
            errors={errors}
          />
        );
      case "Button":
        return renderButton(field);
      case "Attach":
        return renderAttachment(field);

      case "Section Break":
        return (
          <div
            className="form-group"
            style={{ gridColumn: "1 / -1", marginTop: 8 }}
          >
            <hr style={{ borderColor: "var(--color-border)" }} />
            <h3 style={{ marginTop: 12 }}>{field.label}</h3>
            <FieldHelp text={field.description} />
          </div>
        );
      case "Column Break":
        return <div aria-hidden />;
      default:
        return null;
    }
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="card" style={{ padding: 16 }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>{title}</h2>
              {description ? (
                <p style={{ margin: 0, color: "var(--color-text-muted, #6b7280)" }}>
                  {description}
                </p>
              ) : null}
            </div>
            <button type="submit" className="btn btn--primary">
              {submitLabel}
            </button>
          </div>

          {/* Tab navigation */}
          <div
            className="form-tabs"
            style={{
              display: "flex",
              gap: "4px",
              borderBottom: "1px solid var(--color-border)",
              marginBottom: "16px",
            }}
          >
            {tabs.map((tab, i) => (
              <button
                key={tab.name}
                type="button"
                className={`btn btn--tab ${i === activeTab ? "btn--tab-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(i);
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* 2-column layout for the active tab */}
          <div className="form-grid-2-col">
            <div className="form-column">
              {activeTabFields
                .filter((_, i) => i % 2 === 0)
                .map((f, i) => (
                  <div key={`${f.name}-${i}`}>{renderField(f, i)}</div>
                ))}
            </div>
            <div className="form-column">
              {activeTabFields
                .filter((_, i) => i % 2 === 1)
                .map((f, i) => (
                  <div key={`${f.name}-${i}`}>{renderField(f, i)}</div>
                ))}
            </div>
          </div>

          {/* Footer */}
          <hr
            style={{ borderColor: "var(--color-border)", margin: "16px 0" }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {onCancel ? (
              <button type="button" className="btn btn--outline" onClick={onCancel}>
                {cancelLabel}
              </button>
            ) : null}
            <button type="submit" className="btn btn--primary">
              {submitLabel}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

export default DynamicForm;