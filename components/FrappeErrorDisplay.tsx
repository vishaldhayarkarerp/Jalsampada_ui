"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";


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
};

interface FrappeErrorDisplayProps {
  messages: string | string[];
}

export function FrappeErrorDisplay({ messages }: FrappeErrorDisplayProps) {
  const text = Array.isArray(messages) ? messages.join("\n") : messages;

  // Regex to capture: <a href="(URL)">(LABEL)</a>
  // Example: <a href="http://103.219.1.138/app/stage-no/Wakurde%20...">Wakurde...</a>
  const linkRegex = /<a\s+href="([^"]+)">([^<]+)<\/a>/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, url, label] = match;
    const startIndex = match.index;

    // 1. Push text before the link
    if (startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, startIndex));
    }

    // 2. Analyze the URL to find the Doctype and Record Name
    let internalLink = null;
    
    try {
      // Create a URL object to parse safely
      const urlObj = new URL(url, "http://dummy.com"); // Base dummy needed for relative paths
      const segments = urlObj.pathname.split("/").filter(Boolean);
      
      // Expected Frappe format: .../app/stage-no/record-name
      // We look for the segment AFTER "app"
      const appIndex = segments.indexOf("app");
      
      if (appIndex !== -1 && segments.length > appIndex + 2) {
        const doctypeSlug = segments[appIndex + 1]; // e.g., "stage-no"
        const docName = segments[appIndex + 2];     // e.g., "Wakurde..."
        
        // Check if we have this doctype in our map
        const moduleName = DOCTYPE_MODULE_MAP[doctypeSlug.toLowerCase()];

        if (moduleName) {
           internalLink = `/${moduleName}/doctype/${doctypeSlug}/${docName}`;
        }
      }
    } catch (e) {
      console.error("Error parsing link", e);
    }

    // 3. Render Internal Link (Next.js) or External Link (<a>)
    if (internalLink) {
      parts.push(
        <Link 
          key={startIndex} 
          href={internalLink}
          className="font-bold text-blue-600 hover:underline hover:text-blue-800 mx-1"
          onClick={(e) => e.stopPropagation()} // Stop toast from closing on click
        >
          {label}
        </Link>
      );
    } else {
      // Fallback: Open in new tab if we don't recognize the doctype
      parts.push(
        <a 
          key={startIndex} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-medium text-blue-500 hover:text-blue-400 underline decoration-dotted underline-offset-4 mx-1 inline-flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
          <ExternalLink className="h-3 w-3 inline" />
        </a>
      );
    }

    lastIndex = startIndex + fullMatch.length;
  }

  // 4. Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-6">
      {parts.length > 0 ? parts : text}
    </div>
  );
}