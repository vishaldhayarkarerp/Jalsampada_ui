// app/assets/page.tsx

"use client";

import * as React from "react";
import { Workspace, Doctype, DoctypeGroup } from "@/components/Workspace";
import {

  User,
} from "lucide-react";

const adminDoctypeGroups: DoctypeGroup[] = [
  {
    title: "User Management",
    doctypes: [
      { name: "user", title: "User", icon: User }
    ]
  }
];

export default function AdminWorkspace() {
  return (
    <Workspace
      title="Admin Workspace"
      description="Manage system settings and configurations."
      // buttonText="Add Setting"
      doctypeGroups={adminDoctypeGroups}
      basePath="/admin/doctype"
    />
  );
}