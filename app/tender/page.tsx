"use client";

import * as React from "react";
import { Workspace, Doctype } from "@/components/Workspace";

import {
  FileText,     
  ClipboardList, 
  DollarSign,    
  Settings,      
} from "lucide-react";

const tenderDoctypes: Doctype[] = [
  // 1. Tender-related
  { name: "prapan-suchi",   title: "Prapan Suchi",   icon: FileText },
  { name: "tender",         title: "Tender",         icon: FileText },
  { name: "Draft Tender Paper", title: "Draft Tender Paper", icon: FileText },

  // 2. Work Types / Procurement
  { name: "work-type",      title: "Work Type",      icon: ClipboardList },
  { name: "work-subtype",   title: "Work Subtype",   icon: ClipboardList },
  { name: "procurement-type", title: "Procurement Type", icon: Settings },

  // 3. Financial / Expenditure
  { name: "expenditure",    title: "Expenditure",    icon: DollarSign },
];

export default function TenderPage() {
  return (
    <Workspace
      title="Tender Management"
      description="Manage tenders, work orders, procurement types, and expenditure records."
      buttonText="Create New"
      doctypes={tenderDoctypes}
      // This ensures clicks go to /tender/doctype/[name]
      basePath="/tender/doctype"
    />
  );
}