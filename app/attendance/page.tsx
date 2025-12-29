"use client";

import * as React from "react";
import { Workspace, Doctype } from "@/components/Workspace";

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

export default function MaintenancePage() {
  return (
    <Workspace
      title="Attendance"
      description="Manage employees, designations, and attendance records."
      buttonText="Create New"
      doctypes={attendanceDoctypes}
      basePath="/attendance/doctype"
    />
  );
}
