"use client";

import * as React from "react";

export function useLinkFieldFilters(
  field: any,
  getValue: (name: string) => any
): Record<string, any> {
  return React.useMemo(() => {
    if (!field.filters) return {};
    return field.filters(getValue);
  }, [field.filters, getValue]);
}
