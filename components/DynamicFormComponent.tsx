"use client";
import { Controller } from "react-hook-form";
import * as React from "react";
import {
  useForm,
  FormProvider,
  useFieldArray,
  FieldErrors,
  RegisterOptions,
} from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Upload, X, MoreVertical, Copy } from "lucide-react";
import { useRef } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { TableField } from "./TableField";
import { LinkField } from "./LinkField";
import { TableMultiSelect } from "./TableMultiSelect";
import { cn } from "@/lib/utils"; // 🟢 1. Import 'cn' utility

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
  | "Attach"
  | "Custom";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  linkTarget?: string;
  required?: boolean;
  description?: string;
  placeholder?: string;
  options?: string | { label: string; value: string }[];
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  showDownloadUpload?: boolean;
  columns?: {
    name: string;
    label: string;
    type: FieldType;
    linkTarget?: string;
    options?: string | { label: string; value: string }[];
  }[];
  action?: () => void;
  buttonLabel?: string;
  readOnlyValue?: string;
  pattern?: RegExp | string;
  patternMessage?: string;
  filters?: (getValue: (name: string) => any) => Record<string, any>;
  filterMapping?: { sourceField: string; targetField: string }[];
  displayDependsOn?: string;
  fetchFrom?: {
    sourceField: string;
    targetDoctype: string;
    targetField: string;
  };
  customElement?: React.ReactNode;
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
// Helper: API Fetch
// ─────────────────────────────────────────────────────────────────────────────
async function fetchFieldValue(
  sourceValue: string,
  targetDoctype: string,
  targetField: string,
  apiKey: string,
  apiSecret: string
): Promise<any> {
  try {
    const API_BASE_URL = "http://103.219.1.138:4412/api/resource";
    const url = `${API_BASE_URL}/${targetDoctype}/${sourceValue}`;

    console.log(`Making API call to: ${url}`);
    console.log(`With params: fields=${JSON.stringify([targetField])}`);

    const resp = await axios.get(url, {
      params: {
        fields: JSON.stringify([targetField]),
      },
      headers: {
        Authorization: `token ${apiKey}:${apiSecret}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    return resp.data.data?.[targetField] || null;
  } catch (e: any) {
    console.error(`Failed to fetch ${targetField} from ${targetDoctype}:`, e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Evaluate display depends on conditions (Frappe-style)
// ─────────────────────────────────────────────────────────────────────────────
function evaluateDisplayDependsOn(
  condition: string,
  getValue: (name: string) => any
): boolean {
  try {
    const parts = condition
      .split(/(\&\&|\|\|)/)
      .map((c) => c.trim())
      .filter((c) => c);
    const conditions = parts.filter((p) => p !== "&&" && p !== "||");
    const operators = parts.filter((p) => p === "&&" || p === "||");

    const results = conditions.map((cond) => {
      const [field, op, value] = cond.split(/([=!<>]=?)/);
      if (!field || !op || value === undefined) return true;

      const fieldValue = getValue(field.trim());
      let compareValue: any = value.trim();

      if (compareValue === "true") compareValue = true;
      else if (compareValue === "false") compareValue = false;
      else if (/^\d+$/.test(compareValue))
        compareValue = parseInt(compareValue, 10);
      else if (/^\d+\.\d+$/.test(compareValue))
        compareValue = parseFloat(compareValue);
      else compareValue = compareValue.replace(/^['"]|['"]$/g, "");

      switch (op) {
        case "==": return fieldValue == compareValue;
        case "!=": return fieldValue != compareValue;
        case ">": return (fieldValue ?? 0) > (compareValue ?? 0);
        case "<": return (fieldValue ?? 0) < (compareValue ?? 0);
        case ">=": return (fieldValue ?? 0) >= (compareValue ?? 0);
        case "<=": return (fieldValue ?? 0) <= (compareValue ?? 0);
        default: return true;
      }
    });

    return results.reduce((acc, result, i) => {
      const op = operators[i - 1];
      return op === "&&" ? acc && result : op === "||" ? acc || result : result;
    });
  } catch (e) {
    console.error("Display depends on error:", condition, e);
    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build dynamic filters for Link fields
// ─────────────────────────────────────────────────────────────────────────────
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
      if (f.type === "Table") dv[f.name] = [];
      if (f.type === "Table MultiSelect") dv[f.name] = [];
    }
  }

  if (typeof window !== "undefined") {
    const dupData = sessionStorage.getItem("duplicate_record_data");
    if (dupData) {
      try {
        const parsed = JSON.parse(dupData);
        sessionStorage.removeItem("duplicate_record_data");
        return { ...dv, ...parsed };
      } catch (e) {
        console.error("Failed to parse duplicate data", e);
      }
    }
  }
  return dv;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: validation rules
// ─────────────────────────────────────────────────────────────────────────────
function rulesFor(
  field: FormField
): RegisterOptions<Record<string, any>, string> {
  const rules: RegisterOptions<Record<string, any>, string> = {};
  if (field.required) rules.required = `${field.label} is required`;
  if (field.min !== undefined)
    rules.min = {
      value: field.min,
      message: `${field.label} must be >= ${field.min}`,
    };
  if (field.max !== undefined)
    rules.max = {
      value: field.max,
      message: `${field.label} must be <= ${field.max}`,
    };

  if (field.type === "Percent") {
    if (rules.min === undefined)
      rules.min = { value: 0, message: "Percent must be between 0 and 100" };
    if (rules.max === undefined)
      rules.max = { value: 100, message: "Percent must be between 0 and 100" };
  }

  if (field.pattern) {
    const pattern =
      typeof field.pattern === "string"
        ? new RegExp(field.pattern)
        : field.pattern;
    rules.pattern = {
      value: pattern,
      message: field.patternMessage || `${field.label} format is invalid`,
    };
  }

  return rules;
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW HELPER: Sanitize Data for Duplication
// ─────────────────────────────────────────────────────────────────────────────
function sanitizeForDuplication(data: any): any {
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForDuplication(item));
  } else if (typeof data === "object" && data !== null) {
    const newData: any = {};
    for (const key in data) {
      if (
        [
          "name",
          "creation",
          "modified",
          "modified_by",
          "owner",
          "docstatus",
          "idx",
          "parent",
          "parentfield",
          "parenttype",
        ].includes(key)
      ) {
        continue;
      }
      newData[key] = sanitizeForDuplication(data[key]);
    }
    return newData;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────────────────────────────────────
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
// 🟢 2. Style FieldError to be explicitly red
function FieldError({ error }: { error?: any }) {
  if (!error) return null;
  return (
    <div className="text-red-500 font-medium" style={{ marginTop: 6, fontSize: "0.85rem" }}>
      {String(error.message || error)}
    </div>
  );
}

export function DynamicForm({
  tabs,
  onSubmit,
  onCancel,
  title = "Form",
  description,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
}: DynamicFormProps) {
  const { apiKey, apiSecret } = useAuth();

  // ── HOOKS ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState(0);
  const formRef = React.useRef<HTMLFormElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // ── ALL FIELDS (for defaultValues) ───────────────────────────────────────
  const allFields = React.useMemo(() => tabs.flatMap((t) => t.fields), [tabs]);
  const defaultValues = React.useMemo(
    () => buildDefaultValues(allFields),
    [allFields]
  );

  // ── RHF SETUP ─────────────────────────────────────────────────────────────
  const methods = useForm<Record<string, any>>({
    defaultValues,
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    setValue,
    watch,
  } = methods;

  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>(
    {}
  );
  const activeTabFields = tabs[activeTab]?.fields || [];

  const reg = React.useCallback(
    (name: string, options?: any) => register(name, options),
    [register]
  );

  const onFormSubmit = (data: Record<string, any>) => onSubmit(data, isDirty);

  // 🟢 3. IMPORTANT: Use !important classes to override default .form-control styles
  const getErrorClass = (fieldName: string) => {
    return errors[fieldName]
      ? "!border-red-500 !focus:border-red-500 !focus:ring-red-500 !ring-1 !ring-red-500"
      : "";
  };

  // ── DUPLICATION LOGIC ────────────────────────────────────────────────────
  const handleDuplicate = React.useCallback(() => {
    const currentData = methods.getValues();
    const cleanData = sanitizeForDuplication(currentData);
    sessionStorage.setItem("duplicate_record_data", JSON.stringify(cleanData));
    toast.info("Duplicating record...");

    const parts = pathname.split("/");
    const lastPart = parts[parts.length - 1];

    if (lastPart === "new") {
      toast.warning("Already on a new record.");
      return;
    }

    parts.pop();
    if (parts[parts.length - 1] === "edit") {
      parts.pop();
    }
    const newPath = `${parts.join("/")}/new`;
    router.push(newPath);
  }, [methods, pathname, router]);

  // ── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        const submitButton = formRef.current?.querySelector(
          'button[type="submit"]'
        ) as HTMLButtonElement | null;
        if (submitButton) {
          submitButton.click();
        }
      }

      if (event.shiftKey && (event.key === "D" || event.key === "d")) {
        event.preventDefault();
        handleDuplicate();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDuplicate]);

  // ── FETCH FROM FUNCTIONALITY ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!apiKey || !apiSecret) return;

    const fieldsWithFetchFrom = tabs
      .flatMap((tab) => tab.fields)
      .filter((field) => field.fetchFrom);

    const sourceFieldMap = new Map<string, FormField[]>();
    fieldsWithFetchFrom.forEach((field) => {
      if (field.fetchFrom) {
        const sourceField = field.fetchFrom.sourceField;
        if (!sourceFieldMap.has(sourceField)) {
          sourceFieldMap.set(sourceField, []);
        }
        sourceFieldMap.get(sourceField)?.push(field);
      }
    });

    const previousValues = new Map<string, any>();

    const handleFetchForSource = async (sourceFieldName: string) => {
      const sourceValue = watch(sourceFieldName);
      const previousValue = previousValues.get(sourceFieldName);

      if (sourceValue !== previousValue) {
        previousValues.set(sourceFieldName, sourceValue);

        const dependentFields = sourceFieldMap.get(sourceFieldName) || [];

        for (const field of dependentFields) {
          if (!field.fetchFrom) continue;

          if (sourceValue) {
            try {
              const fetchedValue = await fetchFieldValue(
                sourceValue,
                field.fetchFrom.targetDoctype,
                field.fetchFrom.targetField,
                apiKey,
                apiSecret
              );

              if (fetchedValue !== null && fetchedValue !== undefined) {
                setValue(field.name, fetchedValue, { shouldDirty: true });
              }
            } catch (e) {
              console.error(`Failed to fetch ${field.name}:`, e);
            }
          } else {
            setValue(field.name, "", { shouldDirty: true });
          }
        }
      }
    };

    const sourceFields = Array.from(sourceFieldMap.keys());
    sourceFields.forEach((sourceField) => {
      previousValues.set(sourceField, watch(sourceField));
    });

    sourceFields.forEach(handleFetchForSource);

    const subscription = watch((value, { name, type }) => {
      if (name && sourceFieldMap.has(name)) {
        setTimeout(() => handleFetchForSource(name), 100);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [tabs, watch, setValue, apiKey, apiSecret]);

  // ── RENDER HELPERS ───────────────────────────────────────────────────────
  const renderInput = (field: FormField, type: string = "text") => {
    const rules = rulesFor(field);
    const commonProps: any = {
      id: field.name,
      // 🟢 4. Apply cn() with getErrorClass
      className: cn("form-control", getErrorClass(field.name)),
      placeholder: field.placeholder,
      ...(field.step ? { step: field.step } : {}),
      ...(field.min !== undefined ? { min: field.min } : {}),
      ...(field.max !== undefined ? { max: field.max } : {}),
    };

    const valueAsNumber = ["Int", "Float", "Currency", "Percent"].includes(
      field.type
    );

    return (
      <div className="form-group">
        <label htmlFor={field.name} className="form-label">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <input
          type={type}
          {...reg(field.name, {
            ...rules,
            ...(valueAsNumber ? { valueAsNumber: true } : {}),
          })}
          {...commonProps}
        />
        <FieldError
          error={(errors as FieldErrors<Record<string, any>>)[field.name]}
        />
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
          // 🟢 4. Apply cn() with getErrorClass
          className={cn("form-control", getErrorClass(field.name))}
          placeholder={field.placeholder}
          {...reg(field.name, rules)}
        />
        <FieldError
          error={(errors as FieldErrors<Record<string, any>>)[field.name]}
        />
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderSelect = (field: FormField) => {
    const rules = rulesFor(field);

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
          // 🟢 4. Apply cn() with getErrorClass
          className={cn("form-control", getErrorClass(field.name))}
          {...reg(field.name, rules)}
        >
          <option value="">Select...</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <FieldError
          error={(errors as FieldErrors<Record<string, any>>)[field.name]}
        />
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderCheckbox = (field: FormField) => {
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: rhfField }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.name}
              checked={!!rhfField.value}
              onCheckedChange={(val) => rhfField.onChange(val)}
              // 🟢 4. Apply cn() with getErrorClass to Checkbox
              className={cn(
                "rounded border border-gray-300 data-[state=checked]:bg-primary",
                getErrorClass(field.name)
              )}
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
        )}
      />
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
        <input
          id={field.name}
          type="color"
          // 🟢 4. Apply cn() with getErrorClass
          className={cn("form-control h-10 p-1", getErrorClass(field.name))}
          {...reg(field.name, rules)}
        />
        <FieldError
          error={(errors as FieldErrors<Record<string, any>>)[field.name]}
        />
        <FieldHelp text={field.description} />
      </div>
    );
  };

  const renderDateLike = (
    field: FormField,
    type: "date" | "datetime-local" | "time"
  ) => {
    const rules = field.type === "DateTime" ? {} : rulesFor(field);

    if (type === "date") {
      return (
        <Controller
          name={field.name}
          control={control}
          rules={rules}
          render={({ field: controllerField, fieldState: { error } }) => (
            <div className="form-group">
              <label htmlFor={field.name} className="form-label">
                {field.label}
                {field.required ? " *" : ""}
              </label>
              <div className={error ? "input-error-wrapper" : ""}>
                <DatePicker
                  selected={controllerField.value ? new Date(controllerField.value) : null}
                  onChange={(date: Date | null) => {
                    controllerField.onChange(date ? date.toISOString().split('T')[0] : '');
                  }}
                  dateFormat="dd/MM/yyyy"
                  // 🟢 4. Apply cn() directly to DatePicker to override defaults
                  className={cn(
                    "form-control w-full",
                    error ? "!border-red-500 !focus:border-red-500 !focus:ring-red-500 !ring-1 !ring-red-500" : ""
                  )}
                  placeholderText="DD/MM/YYYY"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                />
              </div>
              {error && (
                <span className="text-red-500 font-medium text-sm mt-1">{error.message}</span>
              )}
              <FieldHelp text={field.description} />
            </div>
          )}
        />
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
          // 🟢 4. Apply cn() with getErrorClass
          className={cn("form-control", getErrorClass(field.name))}
          {...reg(field.name, rules)}
        />
        <FieldError
          error={(errors as FieldErrors<Record<string, any>>)[field.name]}
        />
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
            className={cn("form-control", (errors as any)[`${base}.hours`] ? "!border-red-500" : "")}
            placeholder="Hours"
            {...reg(
              `${base}.hours`,
              rulesFor({ ...field, name: `${base}.hours`, label: "Hours" })
            )}
          />
          <input
            type="number"
            min={0}
            className={cn("form-control", (errors as any)[`${base}.minutes`] ? "!border-red-500" : "")}
            placeholder="Minutes"
            {...reg(
              `${base}.minutes`,
              rulesFor({ ...field, name: `${base}.minutes`, label: "Minutes" })
            )}
          />
          <input
            type="number"
            min={0}
            className={cn("form-control", (errors as any)[`${base}.seconds`] ? "!border-red-500" : "")}
            placeholder="Seconds"
            {...reg(
              `${base}.seconds`,
              rulesFor({ ...field, name: `${base}.seconds`, label: "Seconds" })
            )}
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
              className={cn(
                "btn btn--outline btn--sm",
                (errors as any)[field.name] ? "!border-red-500 !text-red-500" : ""
              )}
              style={{
                borderColor: current >= n ? "var(--color-warning)" : undefined,
                color: current >= n ? "var(--color-warning)" : undefined,
              }}
            >
              Star
            </button>
          ))}
        </div>
        <FieldError
          error={(errors as FieldErrors<Record<string, any>>)[field.name]}
        />
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
      <button
        type="button"
        className="btn btn--outline btn--full-width"
        onClick={field.action}
      >
        {field.buttonLabel || field.label}
      </button>
      <FieldHelp text={field.description} />
    </div>
  );

  const renderAttachment = (field: FormField) => {
    const rules = rulesFor(field);
    const value = watch(field.name);

    if (!fileInputRefs.current[field.name]) {
      fileInputRefs.current[field.name] = null;
    }

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
            fileInputRefs.current[field.name] = el;
            if (typeof registerRef === "function") {
              registerRef(el);
            } else if (registerRef) {
              (
                registerRef as React.MutableRefObject<HTMLInputElement | null>
              ).current = el;
            }
          }}
          onChange={(e) => {
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
            className={cn("w-fit flex items-center gap-2", getErrorClass(field.name))}
            onClick={() => fileInputRefs.current[field.name]?.click()}
          >
            <Upload size={16} />
            Upload File
          </Button>
        )}

        {value && (
          <div className={cn("flex items-center gap-3 bg-muted/40 p-3 rounded-md border", getErrorClass(field.name))}>
            <span className="text-sm flex-1">{value?.name}</span>

            <Button
              variant="outline"
              className="h-8 px-2"
              onClick={() => fileInputRefs.current[field.name]?.click()}
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
    const isHidden =
      field.displayDependsOn &&
      !evaluateDisplayDependsOn(field.displayDependsOn, watch);

    const fieldContent = () => {
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
        case "Link": {
          const getValue = (name: string) => watch(name);
          const filtersToPass = buildDynamicFilters(field, getValue);
          const filterKey = `${field.name}-${JSON.stringify(filtersToPass)}`;
          return (
            <LinkField
              key={filterKey}
              field={field}
              control={control}
              error={(errors as FieldErrors<Record<string, any>>)[field.name]}
              filters={filtersToPass}
              // 🟢 5. Apply className prop to LinkField (IMPORTANT)
              className={getErrorClass(field.name) ? "!border-red-500 !focus:ring-red-500" : ""}
            />
          );
        }
        case "Barcode":
          return renderInput(field, "text");
        case "Read Only":
          return renderReadOnly(field);
        case "Rating":
          return renderRating(field);
        case "Table":
          return (
            <TableField
              key={field.name}
              field={field}
              control={control}
              register={reg}
              errors={errors}
            />
          );
        case "Table MultiSelect": {
          const getValue = (name: string) => watch(name);
          const filtersToPass = buildDynamicFilters(field, getValue);
          const filterKey = `${field.name}-${JSON.stringify(filtersToPass)}`;
          return (
            <TableMultiSelect
              key={filterKey}
              field={field}
              control={control}
              error={(errors as FieldErrors<Record<string, any>>)[field.name]}
              filters={filtersToPass}
              className={getErrorClass(field.name) ? "!border-red-500 !focus:ring-red-500" : ""}
            />
          );
        }
        case "Button":
          return renderButton(field);
        case "Attach":
          return renderAttachment(field);

        case "Custom":
          return (
            <div className="form-group">
              {field.label && <label className="form-label">{field.label}</label>}
              {field.customElement}
            </div>
          );

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

    const content = fieldContent();
    if (isHidden && content) {
      return (
        <div key={`${field.name}-${idx}`} className="hidden md:col-span-1">
          {content}
        </div>
      );
    }

    return content;
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <FormProvider {...methods}>
      <form
        ref={formRef}
        onSubmit={handleSubmit(onFormSubmit)}
        style={{ overflow: "visible" }}
      >
        <div className="card" style={{ padding: 16, overflow: "visible" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            {/* Title Section */}
            <div>
              <h2 style={{ margin: 0 }}>{title}</h2>
              {description ? (
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-text-muted, #6b7280)",
                  }}
                >
                  {description}
                </p>
              ) : null}
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-2">
              <button type="submit" className="btn btn--primary">
                {submitLabel}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Duplicate</span>
                    <span className="ml-auto text-xs tracking-widest opacity-60">
                      ⇧D
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                className={`btn btn--tab ${i === activeTab ? "btn--tab-active" : ""
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(i);
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Dynamic grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-0"
            style={{ overflow: "visible" }}
          >
            {activeTabFields.map((field, idx) => {
              const isTable = field.type === "Table";
              const isTableMultiSelect = field.type === "Table MultiSelect";
              const isSectionBreak = field.type === "Section Break";
              const isCustom = field.type === "Custom";

              return (
                <div
                  key={`${field.name}-${idx}`}
                  className={
                    isTable || isTableMultiSelect || isSectionBreak || isCustom
                      ? "md:col-span-3"
                      : "md:col-span-1"
                  }
                  style={{ overflow: "visible" }}
                >
                  {renderField(field, idx)}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <hr
            style={{ borderColor: "var(--color-border)", margin: "16px 0" }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {onCancel ? (
              <button
                type="button"
                className="btn btn--outline"
                onClick={onCancel}
              >
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