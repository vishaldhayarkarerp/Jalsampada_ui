"use client";

import React, { useEffect, useRef } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";
import { LinkField } from "@/components/LinkField";
import { FormField } from "@/components/DynamicFormComponent";

export interface ListFilterConfig extends Partial<FormField> {
  name: string;
  label: string; // Used for identifying the filter, but hidden in UI
  type: "Link" | "Select";
  linkTarget?: string;
  filterMapping?: { sourceField: string; targetField: string }[];
  minWidth?: string;
}

interface ListFilterBarProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  configs: ListFilterConfig[];
}

export function ListFilterBar({ control, setValue, configs }: ListFilterBarProps) {
  const formValues = useWatch({ control });
  const prevValuesRef = useRef<Record<string, any>>(formValues || {});

  // Auto-Clear Logic
  useEffect(() => {
    const prevValues = prevValuesRef.current;
    
    configs.forEach((config) => {
      if (config.filterMapping) {
        config.filterMapping.forEach((mapping) => {
          const parentField = mapping.sourceField;
          if (formValues[parentField] !== prevValues[parentField] && prevValues[parentField] !== undefined) {
             setValue(config.name, "");
          }
        });
      }
    });
    prevValuesRef.current = formValues;
  }, [formValues, configs, setValue]);

  return (
    <>
      {configs.map((config) => {
        const dynamicFilters: Record<string, any> = {};
        if (config.filterMapping) {
          config.filterMapping.forEach((mapping) => {
             const parentValue = formValues[mapping.sourceField];
             if (parentValue) dynamicFilters[mapping.targetField] = parentValue;
          });
        }

        return (
          <div key={config.name} style={{ minWidth: config.minWidth || "200px" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              {config.type === "Link" && (
                <LinkField
                  control={control}
                  // 🟢 FIX: Explicitly set label to empty string to hide it
                  field={{ ...config, label: "" } as any} 
                  filters={dynamicFilters}
                  error={null}
                  className="[&>label]:hidden"
                />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}