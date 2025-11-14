// app/assets/page.tsx

"use client";

import * as React from "react";
import { Workspace, Doctype } from "@/components/Workspace";
import {
  Database,
  Layers,
  Factory,
  Package,
  Ruler,
  Star,
  Droplets,
} from "lucide-react";

const assetsDoctypes: Doctype[] = [
  { name: "asset", title: "Asset", icon: Database },
  { name: "asset-category", title: "Asset Category", icon: Database },
  { name: "lift-irrigation-scheme", title: "Lift Irrigation Scheme", icon: Droplets },
  { name: "stage-no", title: "Stage No", icon: Layers },
  { name: "equipment-make", title: "Equipement Make", icon: Factory },
  { name: "equipement-model", title: "Equipement Model", icon: Package },
  { name: "equipement-capacity", title: "Equipement Capacity", icon: Ruler },
  { name: "rating", title: "Equipement Rating", icon: Star }
];

export default function AssetsWorkspacePage() {
  return (
    <Workspace
      title="Assets Workspace"
      description="Select a doctype to view or manage records."
      buttonText="Add Workspace"
      doctypes={assetsDoctypes}
      basePath="/lis-management/doctype"
    />
  );
}