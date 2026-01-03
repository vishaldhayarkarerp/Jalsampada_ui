// app/assets/page.tsx

"use client";

import * as React from "react";
import { Workspace, Doctype, DoctypeGroup } from "@/components/Workspace";
import {
  Database,
  Layers,
  Factory,
  Package,
  Ruler,
  Star,
  Droplets,
  MapPin, // Icon for locations
  Home,
} from "lucide-react";

const masterDoctypes: Doctype[] = [
  { name: "asset", title: "Asset", icon: Database },
  { name: "asset-category", title: "Asset Category", icon: Database },
  { name: "lift-irrigation-scheme", title: "Lift Irrigation Scheme", icon: Droplets },
  { name: "lis-phases", title: "LIS Phases", icon: Layers },
  { name: "stage-no", title: "Stage No", icon: Layers },
  { name: "equipment-make", title: "Equipement Make", icon: Factory },
  { name: "equipement-model", title: "Equipement Model", icon: Package },
  { name: "equipement-capacity", title: "Equipement Capacity", icon: Ruler },
  { name: "district", title: "District", icon: MapPin },  // Change icon to represent a district location
  { name: "taluka", title: "Taluka", icon: Star },        // You could keep Star for Taluka as a general icon
  { name: "village", title: "Village", icon: Home } 
];

const transactionDoctypes: Doctype[] = [
  // Add transaction doctypes here as needed
  { name: "transaction-1", title: "Transaction 1", icon: Database },
  { name: "transaction-2", title: "Transaction 2", icon: Layers }
];

const doctypeGroups: DoctypeGroup[] = [
  {
    title: "Master",
    doctypes: masterDoctypes
  },
  {
    title: "Transaction",
    doctypes: transactionDoctypes
  }
];

export default function AssetsWorkspacePage() {
  return (
    <Workspace
      title="LIS Management Workspace"
      description="Manage Lift Irrigation Scheme assets and transactions"
      doctypeGroups={doctypeGroups}
      basePath="/lis-management/doctype"
    />
  );
}