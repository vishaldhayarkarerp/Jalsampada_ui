import React from "react";

import { cn } from "@/lib/utils";
import "./Tags.css";

// Define types for the props

export const allowedTagColors = [
  "secondary",
  "danger",
  "primary",
  "warning",
  "success",
  "info",
  "pink",
  "teal",
  "cyan",
] as const;

export type TagColor = (typeof allowedTagColors)[number];

export function getSafeTagType(type: string): TagColor {
  return allowedTagColors.includes(type as TagColor) ? (type as TagColor) : "secondary"; // fallback
}
interface TagsProps {
  variant?: "tag" | "badge"; 
  type?: "primary" | "secondary" | "danger" | "warning" | "success" | "info" | "pink" | "teal" | "cyan" |"indigo" ; 
  tagText?: string | undefined;
  border?: boolean;
  className?: string;
}

const Tags: React.FC<TagsProps> = ({
  variant = "tag",
  type = "primary",
  tagText = "Label",
  border = false,
  className,
}) => {
  return (
    <div
      className={cn(
        `${variant} ${type} ${border ? "" : "border-none"}`,
        className
      )}
    >
      {tagText}
    </div>
  );
};

export default Tags;
