"use client";

import * as React from "react";
import { Workspace, Doctype, DoctypeGroup } from "@/components/Workspace";

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

const maintenanceDoctypeGroups: DoctypeGroup[] = [
  {
    title: "Maintenance",
    doctypes: maintenanceDoctypes
  }
];

export default function MaintenancePage() {
  return (
    <Workspace
      title="Maintenance"
      description="Manage maintenance checklists, schedules, and logs."
      // buttonText="Create New"
      doctypeGroups={maintenanceDoctypeGroups}
      basePath="/maintenance/doctype"
    />
  );
}
