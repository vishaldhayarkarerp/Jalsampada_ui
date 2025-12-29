"use client";

import * as React from "react";
import { Workspace, Doctype } from "@/components/Workspace";

import {
  ListChecks,
  ClipboardList,
  CalendarCheck,
  FileText,
} from "lucide-react";

const maintenanceDoctypes: Doctype[] = [
  { name: "parameter-checklist", title: "Parameter Checklist", icon: ListChecks },
  { name: "maintenance-checklist", title: "Maintenance Checklist", icon: ClipboardList },
  { name: "maintenance-schedule", title: "Maintenance Schedule", icon: CalendarCheck },
  { name: "maintenance-log", title: "Maintenance Log", icon: FileText },
];

export default function MaintenancePage() {
  return (
    <Workspace
      title="Maintenance"
      description="Manage maintenance checklists, schedules, and logs."
      buttonText="Create New"
      doctypes={maintenanceDoctypes}
      basePath="/maintenance/doctype"
    />
  );
}
