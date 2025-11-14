"use client";

import * as React from "react";
import axios from "axios";
import { Controller, FieldPathValue } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { FormField } from "./DynamicFormComponent";

const API_BASE_URL = "http://103.219.1.138:4429/api/resource";

interface Option {
  value: string;
  label: string;
}

interface LinkFieldProps {
  control: any;
  field: FormField & { defaultValue?: string };
  error: any;
}

/**
 * 1. Load options **once** (mount + auth change)
 * 2. If the current value is not in the list → prepend it
 * 3. Render **nothing** while loading
 * 4. Use Controller with a stable key
 */
export function LinkField({ control, field, error }: LinkFieldProps) {
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const [options, setOptions] = React.useState<Option[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // -----------------------------------------------------------------
  // FETCH + INJECT CURRENT VALUE
  // -----------------------------------------------------------------
  React.useEffect(() => {
    if (!field.linkTarget || !isAuthenticated || !isInitialized || !apiKey || !apiSecret) {
      setIsLoading(false);
      return;
    }

    const fetch = async () => {
      setIsLoading(true);
      try {
        const resp = await axios.get(`${API_BASE_URL}/${field.linkTarget}`, {
          params: {
            fields: JSON.stringify(["name"]),
            limit_page_length: 200, // a bit more than 100 – adjust if needed
          },
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });

        const raw = (resp.data.data || []) as { name: string }[];
        const fromApi = raw.map((r) => ({ value: r.name, label: r.name }));

        // ---- inject current value if missing ----
        if (field.defaultValue && !fromApi.some((o) => o.value === field.defaultValue)) {
          fromApi.unshift({ value: field.defaultValue, label: field.defaultValue });
        }

        setOptions(fromApi);
      } catch (e) {
        console.error("LinkField fetch error", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [
    field.linkTarget,
    field.defaultValue,
    isAuthenticated,
    isInitialized,
    apiKey,
    apiSecret,
  ]);

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="form-group">
        <label className="form-label">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <select className="form-control" disabled>
          <option>Loading options…</option>
        </select>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label htmlFor={field.name} className="form-label">
        {field.label}
        {field.required ? " *" : ""}
      </label>

      <Controller
        control={control}
        name={field.name}
        // keep the field registered even when the component re‑mounts
        shouldUnregister={false}
        // a stable key prevents RHF from resetting when options change
        key={`${field.name}-${field.linkTarget}`}
        rules={{ required: field.required ? `${field.label} is required` : false }}
        render={({ field: { onChange, onBlur, value } }) => (
          <select
            id={field.name}
            className="form-control"
            onChange={onChange}
            onBlur={onBlur}
            value={value ?? ""}   // <-- important: keep the current value
          >
            <option value="">{field.placeholder || "Select..."}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      />

      {error && (
        <div className="text-error" style={{ marginTop: 6, fontSize: "0.85rem" }}>
          {String(error.message)}
        </div>
      )}

      {field.description && (
        <div style={{ marginTop: 6, fontSize: "0.85rem", color: "var(--color-text-muted, #6b7280)" }}>
          {field.description}
        </div>
      )}
    </div>
  );
}