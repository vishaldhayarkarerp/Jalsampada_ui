"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ImageOff, Box } from "lucide-react";

export interface RecordCardField {
  label: string;
  value: string | number;
  type?: "success" | "danger" | "warning" | "info" | "neutral" | "purple" | "default";
}

interface RecordCardProps {
  title: string;
  subtitle?: string;
  image?: string;
  fields: RecordCardField[];
  onClick: () => void;
  className?: string;
}

export function RecordCard({
  title,
  subtitle,
  image,
  fields,
  onClick,
  className,
}: RecordCardProps) {
  // 🟢 LOGIC: Separate "Status" from other fields to render it prominently
  const statusField = fields.find((f) => f.label === "Status");
  const otherFields = fields.filter((f) => f.label !== "Status");

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* 🟢 1. IMAGE SECTION (3:2 Aspect Ratio - Professional Standard) */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-zinc-400">
            <Box className="h-8 w-8 mb-2 opacity-20" />
            <span className="text-[10px] font-semibold uppercase tracking-widest opacity-40">No Image</span>
          </div>
        )}
      </div>

      {/* 🟢 2. CONTENT BODY */}
      <div className="flex flex-1 flex-col p-4">
        {/* HEADER: Title + Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {title}
          </h4>
          
          {/* Status Badge - Top Right Position */}
          {statusField && (
            <StatusBadge type={statusField.type || 'default'} value={statusField.value} />
          )}
        </div>

        {/* Subtitle (ID) */}
        {subtitle && (
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-4">
            {subtitle}
          </p>
        )}

        {/* Divider */}
        <div className="mt-auto border-t border-dashed border-zinc-200 dark:border-zinc-700 my-3" />

        {/* 🟢 3. DATA TAGS (Groups, UOM, etc.) */}
        <div className="flex flex-wrap gap-2">
          {otherFields.map((field) => (
            <div 
              key={field.label} 
              className="inline-flex items-center rounded-md bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-400/10 dark:text-zinc-400 dark:ring-zinc-400/20"
            >
              <span className="opacity-50 mr-1.5 uppercase tracking-wider text-[10px]">{field.label}:</span>
              {field.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 🟢 PRO BADGE: Clean, Soft-Solid Colors (No Borders)
function StatusBadge({ type, value }: { type: string; value: string | number }) {
  const styles = {
    // "Soft" style: Very light bg + strong text. Looks cleaner than borders.
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    danger:  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    purple:  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
    info:    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  const activeStyle = styles[type as keyof typeof styles] || styles.default;
  const isLive = type === 'success';

  return (
    <span className={cn(
      "shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors",
      activeStyle
    )}>
      {/* Optional: Tiny dot for "Success" state only to make it pop */}
      {isLive && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {value}
    </span>
  );
}