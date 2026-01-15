import { FormField } from "../DynamicFormComponent";

export function buildDynamicFilters(
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
