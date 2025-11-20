"use client";

import * as React from "react";
import axios from "axios";
import { Controller } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { FormField } from "./DynamicFormComponent";

const API_BASE_URL = "http://192.168.1.30:4429//api/resource";

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
 * FIXED VERSION:
 * 1. Load options once (mount + auth change)
 * 2. Inject current value if missing
 * 3. Show the current value even while loading
 * 4. Use stable Controller key
 */
export function LinkField({ control, field, error }: LinkFieldProps) {
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const [options, setOptions] = React.useState<Option[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Get the current value from the controller
  const currentValue = field.defaultValue;

  // -----------------------------------------------------------------
  // FETCH + INJECT CURRENT VALUE
  // -----------------------------------------------------------------
  React.useEffect(() => {
    if (!field.linkTarget || !isAuthenticated || !isInitialized || !apiKey || !apiSecret) {
      // If no link target or not authenticated, just show the current value
      if (currentValue) {
        setOptions([{ value: currentValue, label: currentValue }]);
      }
      setIsLoading(false);
      return;
    }

    const fetch = async () => {
      setIsLoading(true);
      try {
        const resp = await axios.get(`${API_BASE_URL}/${field.linkTarget}`, {
          params: {
            fields: JSON.stringify(["name"]),
            limit_page_length: 200,
          },
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });

        const raw = (resp.data.data || []) as { name: string }[];
        const fromApi = raw.map((r) => ({ value: r.name, label: r.name }));

        // ---- inject current value if missing ----
        if (currentValue && !fromApi.some((o) => o.value === currentValue)) {
          fromApi.unshift({ value: currentValue, label: currentValue });
        }

        setOptions(fromApi);
      } catch (e) {
        console.error("LinkField fetch error", e);
        // On error, still show current value if available
        if (currentValue) {
          setOptions([{ value: currentValue, label: currentValue }]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [
    field.linkTarget,
    currentValue,
    isAuthenticated,
    isInitialized,
    apiKey,
    apiSecret,
  ]);

  // -----------------------------------------------------------------
  // RENDER - Show current value even while loading
  // -----------------------------------------------------------------
  return (
    <div className="form-group">
      <label htmlFor={field.name} className="form-label">
        {field.label}
        {field.required ? " *" : ""}
      </label>

      <Controller
        control={control}
        name={field.name}
        shouldUnregister={false}
        // Remove the key prop - it's causing unnecessary re-renders
        rules={{ required: field.required ? `${field.label} is required` : false }}
        render={({ field: { onChange, onBlur, value } }) => (
          <select
            id={field.name}
            className="form-control"
            onChange={onChange}
            onBlur={onBlur}
            value={value ?? ""}
            disabled={isLoading && options.length === 0}
          >
            <option value="">
              {isLoading ? "Loading options..." : (field.placeholder || "Select...")}
            </option>
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