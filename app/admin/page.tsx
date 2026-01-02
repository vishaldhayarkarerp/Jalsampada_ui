// app/assets/page.tsx

"use client";

import * as React from "react";
import { Workspace, Doctype } from "@/components/Workspace";
import {

  User,
} from "lucide-react";

const assetsDoctypes: Doctype[] = [
    
  { name: "user", title: "User", icon: User },
];

export default function AdminWorkspace() {
  return (
    <Workspace
      title="Admin Workspace"
      description="Manage system settings and configurations."
      // buttonText="Add Setting"
      doctypes={assetsDoctypes}
      basePath="/admin/doctype"
    />
  );
}