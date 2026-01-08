"use client";

import * as React from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onClear,
  onDelete,
  isDeleting = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-white border border-blue-100 px-4 py-2 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2">
      {/* Count Indicator */}
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
          {selectedCount}
        </span>
        <span className="text-sm font-medium text-slate-600">Selected</span>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      {/* Clear Button (Subtle) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-8 px-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
        title="Clear Selection"
      >
        <X className="mr-2 h-3.5 w-3.5" />
        <span className="text-xs">Cancel</span>
      </Button>

      {/* 🟢 MODERN OPAQUE DELETE BUTTON */}
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={isDeleting}
        className={cn(
          "ml-auto h-8 px-4 shadow-sm transition-all duration-200",
          "bg-red-500 hover:bg-red-600 hover:shadow-md hover:-translate-y-0.5", // Modern Red Hover + Lift effect
          "disabled:opacity-50 disabled:hover:translate-y-0"
        )}
      >
        {isDeleting ? (
          <>
            <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </>
        )}
      </Button>
    </div>
  );
}