"use client";

import * as React from "react";
import { Workspace, Doctype, DoctypeGroup } from "@/components/Workspace";

import {
  User,
  Briefcase,
  ClipboardCheck,
} from "lucide-react";

const attendanceDoctypes: Doctype[] = [
  { name: "employee", title: "Employee", icon: User },
  { name: "designation", title: "Designation", icon: Briefcase },
  { name: "attendance-sheet", title: "Attendance Sheet", icon: ClipboardCheck },
];

const attendanceDoctypeGroups: DoctypeGroup[] = [
  {
    title: "Attendance",
    doctypes: attendanceDoctypes
  }
];

export default function MaintenancePage() {
  return (
    <Workspace
      title="Attendance"
      description="Manage employees, designations, and attendance records."
      // buttonText="Create New"
      doctypeGroups={attendanceDoctypeGroups}
      basePath="/attendance/doctype"
    />
  );
}
