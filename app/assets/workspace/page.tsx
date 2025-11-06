// app/assets/workspace/page.tsx

"use client";

import * as React from "react";
import Link from "next/link";
// --- NEW IMPORTS ---
import { Button } from "@/components/ui/button"; // The main component
import {
  ChevronRight, // The right arrow
  Database, // Generic icon for "Asset"
  Layers, // For "Stage"
  Factory, // For "Make"
  Package, // For "Model"
  Ruler, // For "Capacity"
  Star, // For "Rating"
  Droplets, // For "Lift Irrigation"
} from "lucide-react";

export default function WorkspacePage() {
  // Your hard-coded list of doctypes, now with a Lucide icon
  const doctypes = [
    { name: "asset", title: "Asset", icon: Database },
    { name: "lift-irrigation-scheme", title: "Lift Irrigation Scheme", icon: Droplets },
    { name: "stage", title: "Stage", icon: Layers },
    { name: "equipment-make", title: "Equipement Make", icon: Factory },
    { name: "equipment-model", title: "Equipement Model", icon: Package },
    { name: "equipment-capacity", title: "Equipement Capacity", icon: Ruler },
    { name: "equipment-rating", title: "Equipement Rating", icon: Star },
  ];

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Assets Workspace</h2>
          <p>Select a doctype to view or manage records.</p>
        </div>
        <button className="btn btn--primary">
          <i className="fas fa-plus"></i> Add Workspace
        </button>
      </div>

      {/* We'll use a flex column for our list */}
      <div className="doctype-list-container">
        {doctypes.map((doc) => (
          <Button
            key={doc.name}
            asChild // This makes the Button render as its child (the Link)
            variant="ghost" // Use the "ghost" style for a clean, flat look
            className="doctype-row-button"
          >
            <Link href={`/assets/workspace/${doc.name}`}>
              <div className="doctype-row-left">
                <doc.icon className="doctype-row-icon" />
                <span className="doctype-row-title">{doc.title}</span>
              </div>
              <ChevronRight className="doctype-row-arrow" />
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}