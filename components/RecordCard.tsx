// app/components/RecordCard.tsx

"use client";

import * as React from "react";
import { cn } from "@/lib/utils"; // (Assuming you have this from shadcn)

// 1. Define the props our component will accept
export interface RecordCardField {
  label: string;
  value: string | number;
}

interface RecordCardProps {
  title: string;
  subtitle?: string;
  fields: RecordCardField[];
  onClick: () => void; // Function to call when clicked
  className?: string;
}

// 2. Create the reusable component
export function RecordCard({
  title,
  subtitle,
  fields,
  onClick,
  className,
}: RecordCardProps) {
  return (
    // We use the same class names as your original file
    // so it picks up your existing styles from assets.css
    <div
      className={cn("equipment-card", className)} // cn() merges classes
      onClick={onClick}
      style={{ cursor: "pointer" }} // Make it look clickable
    >
      <div className="equipment-card-header">
        <h4>{title}</h4>
        {subtitle && (
          <div className="equipment-type">{subtitle}</div>
        )}
      </div>
      <div className="equipment-card-body">
        <div className="equipment-specs">
          {/* 3. We dynamically map over the fields array
             instead of hard-coding them 
          */}
          {fields.map((field) => (
            <div key={field.label} className="spec-item">
              <span className="spec-label">{field.label}</span>
              <span className="spec-value">{field.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}