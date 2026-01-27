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
  { name: "parameter-category", title: "Parameter Category", icon: ClipboardList },
  { name: "parameter-type", title: "Parameter Type", icon: CalendarCheck },
  { name: "device-type", title: "Device Type", icon: FileText },
];

const transactionDoctypes: Doctype[] = [
  { name: "maintenance-checklist", title: "Maintenance Checklist", icon: ListChecks },
  { name: "maintenance-schedule", title: "Maintenance Schedule", icon: CalendarCheck },
  { name: "maintenance-log", title: "Maintenance Log", icon: FileText },
];

const maintenanceDoctypeGroups: DoctypeGroup[] = [
  {
    title: "Master",
    doctypes: maintenanceDoctypes
  },
  {
    title: "Transactions",
    doctypes: transactionDoctypes
  },
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
