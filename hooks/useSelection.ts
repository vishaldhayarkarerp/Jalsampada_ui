// hooks/useSelection.ts
import { useState, useMemo, useCallback } from "react";

export function useSelection<T>(items: T[], idKey: keyof T = "name" as keyof T) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length && items.length > 0) {
        return new Set(); // Deselect all
      }
      return new Set(items.map((item) => String(item[idKey])));
    });
  }, [items, idKey]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items, selectedIds]
  );

  return {
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    isAllSelected,
  };
}