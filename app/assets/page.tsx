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
  { name: "lift-irrigation-scheme", title: "Lift Irrigation Scheme", icon: Droplets },
  { name: "stage", title: "Stage", icon: Layers },
  { name: "equipment-make", title: "Equipement Make", icon: Factory },
  { name: "equipment-model", title: "Equipement Model", icon: Package },
  { name: "equipment-capacity", title: "Equipement Capacity", icon: Ruler },
  { name: "equipment-rating", title: "Equipement Rating", icon: Star },
];

export default function AssetsWorkspacePage() {
  return (
    <Workspace
      title="Assets Workspace"
      description="Select a doctype to view or manage records."
      buttonText="Add Workspace"
      doctypes={assetsDoctypes}
      basePath="/assets" 
    />
  );
}