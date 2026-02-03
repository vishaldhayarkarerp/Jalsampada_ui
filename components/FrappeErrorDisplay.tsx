"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, ArrowUpRight } from "lucide-react"; // 🟢 Added ArrowUpRight

// 🟢 MAP: Define which Doctypes belong to which Module in your Next.js app
const DOCTYPE_MODULE_MAP: Record<string, string> = {
  // LIS Management
  "lift-irrigation-scheme": "lis-management",
  "stage-no": "lis-management",
  "lis-phases": "lis-management",
  "village": "lis-management",
  "taluka": "lis-management",
  "district": "lis-management",
  "asset": "lis-management",
  "asset-category": "lis-management",
  "equipement-capacity": "lis-management",
  "equipement-model": "lis-management",
  "equipment-make": "lis-management",
  "rating": "lis-management",

  // Operations
  "gate": "operations",
  "gate-operation-logbook": "operations",
  "logbook": "operations",
  "logsheet": "operations",
  "warehouse": "operations",
  "item": "operations",
  "repair-work-requirement": "operations",
  "spare-indent": "operations",
  "temperature": "operations",
  "lis-incident-record": "operations",

  // Admin
  "user": "admin",
  "session-default": "admin",
  
  // Attendance
  "employee": "attendance",

  // Tender
  "tender": "tender",
  "contractor": "tender",
  "draft-tender-paper": "tender",
  "expenditure": "tender",
  "fund-head": "tender",
  "prapan-suchi": "tender",
  "work-subtype": "tender",
  "work-type": "tender",

  // Maintenance
  "maintenance-checklist": "maintenance",
  "maintenance-log": "maintenance",
  "maintenance-schedule": "maintenance",
  "device-type": "maintenance",
  "parameter-category": "maintenance",
  "parameter-checklist": "maintenance",
  "parameter-type": "maintenance",
};

//  MAP: Map Frappe doctype names to Next.js route names
const FRAPPE_TO_ROUTE_MAP: Record<string, string> = {
  "log-sheet": "logsheet",
  // Add any other Frappe -> route name mappings here
  "maintenance-checklist": "maintenance-checklist",
  "maintenance-log": "maintenance-log",
  "maintenance-schedule": "maintenance-schedule",
  "device-type": "device-type",
  "parameter-category": "parameter-category",
  "parameter-checklist": "parameter-checklist",
  "parameter-type": "parameter-type",
};

interface FrappeErrorDisplayProps {
  messages: string | string[];
}

export function FrappeErrorDisplay({ messages }: FrappeErrorDisplayProps) {
  const text = Array.isArray(messages) ? messages.join("\n") : messages;

  const linkRegex = /<a\s+href="([^"]+)">([^<]+)<\/a>/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, url, label] = match;
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, startIndex));
    }

    let internalLink = null;
    
    try {
      const urlObj = new URL(url, "http://dummy.com");
      const segments = urlObj.pathname.split("/").filter(Boolean);
      const appIndex = segments.indexOf("app");
      
      if (appIndex !== -1 && segments.length > appIndex + 2) {
        const frappeDoctypeSlug = segments[appIndex + 1];
        const docName = segments[appIndex + 2];
        
        // Convert Frappe doctype name to Next.js route name
        const routeDoctypeSlug = FRAPPE_TO_ROUTE_MAP[frappeDoctypeSlug.toLowerCase()] || frappeDoctypeSlug;
        
        const moduleName = DOCTYPE_MODULE_MAP[routeDoctypeSlug.toLowerCase()] || 
                           DOCTYPE_MODULE_MAP[frappeDoctypeSlug.toLowerCase()];

        if (moduleName) {
           // Check if this doctype has dynamic [id] route
           const hasDynamicRoute = ["lift-irrigation-scheme", "stage-no", "lis-phases", 
                                  "asset", "asset-category", "equipement-capacity", 
                                  "equipement-model", "equipment-make", "rating",
                                  "gate", "gate-operation-logbook", "logbook", "logsheet",
                                  "warehouse", "item", "repair-work-requirement",
                                  "spare-indent", "temperature", "lis-incident-record",
                                  "tender", "contractor", "draft-tender-paper",
                                  "expenditure", "fund-head", "prapan-suchi",
                                  "work-subtype", "work-type",
                                  // Add hyphenated versions for Frappe URLs
                                  "log-sheet", "gate-operation-logbook", "repair-work-requirement",
                                  "spare-indent", "lis-incident-record",
                                  "draft-tender-paper", "fund-head", "prapan-suchi",
                                  "work-subtype", "work-type",
                                  // Maintenance doctypes
                                  "maintenance-checklist", "maintenance-log", "maintenance-schedule",
                                  "device-type", "parameter-category", "parameter-checklist", "parameter-type"].includes(routeDoctypeSlug) ||
                                  ["lift-irrigation-scheme", "stage-no", "lis-phases", 
                                  "asset", "asset-category", "equipement-capacity", 
                                  "equipement-model", "equipment-make", "rating",
                                  "gate", "gate-operation-logbook", "logbook", "logsheet",
                                  "warehouse", "item", "repair-work-requirement",
                                  "spare-indent", "temperature", "lis-incident-record",
                                  "tender", "contractor", "draft-tender-paper",
                                  "expenditure", "fund-head", "prapan-suchi",
                                  "work-subtype", "work-type",
                                  // Add hyphenated versions for Frappe URLs
                                  "log-sheet", "gate-operation-logbook", "repair-work-requirement",
                                  "spare-indent", "lis-incident-record",
                                  "draft-tender-paper", "fund-head", "prapan-suchi",
                                  "work-subtype", "work-type",
                                  // Maintenance doctypes
                                  "maintenance-checklist", "maintenance-log", "maintenance-schedule",
                                  "device-type", "parameter-category", "parameter-checklist", "parameter-type"].includes(frappeDoctypeSlug);
           
           if (hasDynamicRoute) {
             internalLink = `/${moduleName}/doctype/${routeDoctypeSlug}/${docName}`;
           } else {
             internalLink = `/${moduleName}/doctype/${routeDoctypeSlug}`;
           }
        }
      }
    } catch (e) {
      console.error("Error parsing link", e);
    }

    if (internalLink) {
      // 🟢 OPTION 1: Internal Link (Stays in App)
      parts.push(
        <Link 
          key={startIndex} 
          href={internalLink}
          // UPDATED STYLES: 
          // - underline: Always underlined
          // - inline-flex: Aligns text and icon
          // - ArrowUpRight: The "redirect" symbol you wanted
          className="font-bold text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-800 hover:decoration-blue-800 mx-1 inline-flex items-baseline gap-0.5 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
          <ArrowUpRight className="self-center w-3 h-3" /> 
        </Link>
      );
    } else {
      // 🟢 OPTION 2: External Link (New Tab)
      parts.push(
        <a 
          key={startIndex} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-medium text-blue-500 underline decoration-dotted underline-offset-4 hover:text-blue-600 mx-1 inline-flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }

    lastIndex = startIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return (
    <div className="text-l text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-7">
      {parts.length > 0 ? parts : text}
    </div>
  );
}