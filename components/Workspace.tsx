
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";


export interface Doctype {
  name: string;
  title: string;
  icon: React.ElementType;  
}

interface WorkspaceProps {
  title: string;
  description: string;
  buttonText: string;
  doctypes: Doctype[];
  basePath: string; 
}


export function Workspace({
  title,
  description,
  buttonText,
  doctypes,
  basePath,
}: WorkspaceProps) {
  
  return (
    <div className="module active">
      <div className="module-header">
        <div>
          {/* Use the props for dynamic text */}
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button className="btn btn--primary">
          <i className="fas fa-plus"></i> {buttonText}
        </button>
      </div>

      <div className="doctype-list-container">
        {doctypes.map((doc) => (
          <Button
            key={doc.name}
            asChild
            variant="ghost"
            className="doctype-row-button"
          >
            {/* The link is now built dynamically using the basePath prop */}
            <Link href={`${basePath}/${doc.name}`}>
              <div className="doctype-row-left">
                {/* Use the icon component passed in props */}
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