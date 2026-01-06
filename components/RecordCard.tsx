"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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
  // ── LOGIC: Separate "Status" to put it in the header
  const statusField = fields.find((f) => f.label === "Status");
  const otherFields = fields.filter((f) => f.label !== "Status");

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* 🟢 1. IMAGE SECTION (Conditional) */}
      {image && (
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-b border-blue-800/20">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      {/* 🟢 2. HEADER SECTION (Solid Light Blue #1e88e5) */}
      <div 
        className="flex flex-col px-4 py-3"
        style={{ backgroundColor: "#1e88e5" }}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Title - Forced White */}
          <h4 
            className="font-bold text-base leading-snug line-clamp-2"
            style={{ color: "white" }} 
          >
            {title}
          </h4>
          
          {/* Status Badge (Intelligent Colors) */}
          {statusField && (
            <StatusBadge type={statusField.type || 'default'} value={statusField.value} />
          )}
        </div>

        {/* Subtitle (ID) - Forced White */}
        {subtitle && (
          <p 
            className="text-xs font-medium mt-1 font-mono tracking-wide opacity-90"
            style={{ color: "white" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* 🟢 3. CONTENT BODY (Fields) */}
      <div className="flex flex-1 flex-col p-4 bg-white dark:bg-zinc-900">
        {otherFields.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {otherFields.map((field) => (
              <div 
                key={field.label} 
                className="inline-flex items-center rounded-md bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-400/10 dark:text-zinc-300 dark:ring-zinc-400/20"
              >
                <span className="opacity-50 mr-1.5 uppercase tracking-wider text-[9px]">{field.label}:</span>
                {field.value}
              </div>
            ))}
          </div>
        ) : (
           <div className="text-xs text-zinc-400 italic py-1">View details →</div>
        )}
      </div>
    </div>
  );
}

// ── 🟢 INTELLIGENT STATUS BADGE ──────────────────────────────
function StatusBadge({ type, value }: { type: string; value: string | number }) {
  // Convert value to lowercase string for easier matching
  const statusStr = String(value).trim().toLowerCase();

  // 1. Define Color Styles
  const styles = {
    // 🟤 Brown for Draft
    brown: "bg-white text-amber-800 border-amber-300", 
    // 🟢 Green for Success / WIP
    green: "bg-white text-emerald-700 border-emerald-200", 
    // 🔴 Red for Danger / Cancelled
    red:   "bg-white text-rose-700 border-rose-200",   
    // 🔵 Blue for Info / Submitted
    blue:  "bg-white text-blue-700 border-blue-200",   
    // 🟠 Orange for Warning / Pending
    orange:"bg-white text-orange-700 border-orange-200",
    // ⚪ Gray Default
    gray:  "bg-white/90 text-zinc-800 border-transparent",
  };

  // 2. Determine Color Logic
  let selectedStyle = styles.gray;

  // -- Priority A: Intelligent String Matching --
  if (statusStr.includes("draft")) {
    selectedStyle = styles.brown;
  } 
  else if (statusStr.includes("work in progress") || statusStr.includes("wip") || statusStr.includes("active") || statusStr.includes("completed") || statusStr.includes("enabled")) {
    selectedStyle = styles.green;
  }
  else if (statusStr.includes("cancel") || statusStr.includes("reject") || statusStr.includes("error") || statusStr.includes("disabled") || statusStr.includes("closed")) {
    selectedStyle = styles.red;
  }
  else if (statusStr.includes("pending") || statusStr.includes("hold") || statusStr.includes("review")) {
    selectedStyle = styles.orange;
  }
  else if (statusStr.includes("submit") || statusStr.includes("proposed")) {
    selectedStyle = styles.blue;
  }
  // -- Priority B: Fallback to explicit 'type' prop --
  else {
    switch (type) {
      case 'success': selectedStyle = styles.green; break;
      case 'danger':  selectedStyle = styles.red; break;
      case 'warning': selectedStyle = styles.orange; break; // Maps warning to Orange usually
      case 'info':    selectedStyle = styles.blue; break;
      default:        selectedStyle = styles.gray; break;
    }
  }

  return (
    <span className={cn(
      "shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm border",
      selectedStyle
    )}>
      {value}
    </span>
  );
}