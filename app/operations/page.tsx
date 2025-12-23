// app/assets/page.tsx

"use client";

import * as React from "react";
import { Workspace, Doctype } from "@/components/Workspace";
import {
  DoorOpen,
  Box,
  Warehouse,
  Book,
  FileText,
  ClipboardList,
  Wrench,
  AlertTriangle,
  FilePlus,
  ArrowDownUp,
  ListChecks,
  Thermometer
} from "lucide-react";


const operationsDoctypes: Doctype[] = [
  { name: "temperature", title: "Temperature", icon: Thermometer },
  { name: "gate", title: "Gate", icon: DoorOpen },
  { name: "item", title: "Item", icon: Box },
  { name: "warehouse", title: "Warehouse", icon: Warehouse },
  { name: "logbook", title: "Log Book", icon: Book },
  { name: "logsheet", title: "Log Sheet", icon: FileText },
  { name: "gate-operation-book", title: "Gate Operation Book", icon: ClipboardList },
  { name: "repair-work-requirement", title: "Repair Work Requirement", icon: Wrench },
  { name: "lis-incident-record", title: "LIS Incident Record", icon: AlertTriangle },
  { name: "spare-indent", title: "Spare Indent", icon: FilePlus },
  { name: "stock-entry", title: "Stock Entry", icon: ArrowDownUp },
  { name: "stock-reconciliation", title: "Stock Reconciliation", icon: ListChecks }
];


export default function OperationsWorkspacePage() {
  return (
    <Workspace
      title="Operations Workspace"
      description="Select a doctype to view or manage records."
      buttonText="Add Workspace"
      doctypes={operationsDoctypes}
      basePath="/operations/doctype"
    />
  );
}