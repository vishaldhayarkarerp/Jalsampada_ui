"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { FormField } from "./DynamicFormComponent";
import { Button } from "@/components/ui/button";
import { Upload, X, Eye } from "lucide-react"; // Import icons

// API base URL for creating preview links
const API_BASE_URL = "http://103.219.1.138:4429";

interface TableFieldProps {
  field: FormField;
  control: any;
  register: any;
  errors: any;
}

/**
 * This is the new "smart" cell for attachments.
 * It handles its own state for previewing and clearing.
 */
function AttachmentCell({ fieldName, control }: { fieldName: string, control: any }) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  
  // Get functions to watch and set the value of this specific cell
  const { watch, setValue } = useFormContext(); 
  const value = watch(fieldName); // Watch the value (e.g., a File object or a string URL)

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    // This effect creates a preview URL
    let objectUrl: string | null = null;

    if (value instanceof File) {
      // New file selected: Create a temporary local URL
      objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);
    } else if (typeof value === 'string' && value.startsWith("/files/")) {
      // Existing file from Frappe: Create a full server URL
      setPreviewUrl(API_BASE_URL + value);
    } else {
      setPreviewUrl(null);
    }

    // Cleanup: Revoke the temporary URL when the component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue(fieldName, file, { shouldDirty: true }); // Set the value in react-hook-form
    }
  };

  const handleClear = () => {
    setValue(fieldName, null, { shouldDirty: true }); // Clear the value
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {!value ? (
        // "Browse" button
        <Button
          type="button"
          variant="outline"
          className="btn--sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} className="mr-2" />
          Attach
        </Button>
      ) : (
        // Show file name and action buttons
        <>
          <span className="text-sm truncate flex-1" title={typeof value === 'string' ? value : value.name}>
            {typeof value === 'string' ? value.split('/').pop() : value.name}
          </span>
          
          {/* Preview (Eye) Button */}
          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" title="Preview">
                <Eye size={16} />
              </a>
            </Button>
          )}

          {/* Clear (X) Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500"
            onClick={handleClear}
            title="Clear"
          >
            <X size={16} />
          </Button>
        </>
      )}
    </div>
  );
}


export function TableField({ field, control, register, errors }: TableFieldProps) {
  const { fields: rows, append, remove } = useFieldArray({
    control,
    name: field.name,
  });

  // We need the *full* form context to be able to watch cell values
  const formMethods = useFormContext(); 

  const [selectedIndices, setSelectedIndices] = React.useState<Set<number>>(new Set());

  const addRow = () => {
    const row: any = {};
    (field.columns || []).forEach((c) => (row[c.name] = ""));
    append(row);
  };

  const toggleRow = (index: number) => {
    const newSel = new Set(selectedIndices);
    newSel.has(index) ? newSel.delete(index) : newSel.add(index);
    setSelectedIndices(newSel);
  };

  const toggleSelectAll = () => {
    setSelectedIndices(
      selectedIndices.size === rows.length
        ? new Set()
        : new Set(rows.map((_, i) => i))
    );
  };

  const deleteSelected = () => {
    const toRemove = Array.from(selectedIndices).sort((a, b) => b - a);
    remove(toRemove);
    setSelectedIndices(new Set());
  };

  const allSelected = rows.length > 0 && selectedIndices.size === rows.length;
  const someSelected = selectedIndices.size > 0 && selectedIndices.size < rows.length;

  return (
    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
      <label className="form-label">{field.label}</label>

      <div className="stock-table-container">
        <table className="stock-table child-form-table">
          <thead>
            <tr>
              <th style={{ width: 40 }} className="child-table-checkbox-cell">
                <input
                  type="checkbox"
                  className="form-control"
                  style={{ width: 16, height: 16 }}
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
              {(field.columns || []).map((c) => (
                <th key={c.name}>{c.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r.id}
                className={selectedIndices.has(idx) ? "row-selected" : ""}
              >
                <td className="child-table-checkbox-cell">
                  <input
                    type="checkbox"
                    className="form-control"
                    style={{ width: 16, height: 16 }}
                    checked={selectedIndices.has(idx)}
                    onChange={() => toggleRow(idx)}
                    aria-label={`Select row ${idx + 1}`}
                  />
                </td>

                {(field.columns || []).map((c) => (
                  <td key={c.name} className="child-table-input-cell">
                    
                    {/* --- THIS IS THE CHANGE --- */}
                    {c.type === "Attach" ? (
                      <AttachmentCell
                        control={formMethods.control}
                        fieldName={`${field.name}.${idx}.${c.name}`}
                      />
                    ) : (
                      <input
                        className="form-control-borderless"
                        type={c.type === "number" ? "number" : "text"}
                        placeholder={c.label}
                        // Use formMethods.register here for context
                        {...formMethods.register(`${field.name}.${idx}.${c.name}`)}
                      />
                    )}
                    {/* ------------------------ */}

                  </td>
                ))}

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" className="btn btn--secondary btn--sm" onClick={addRow}>
          <i className="fas fa-plus" style={{ marginRight: 4 }}></i>
          Add Row
        </button>

        {selectedIndices.size > 0 && (
          <button
            type="button"
            className="btn btn--outline btn--sm btn--destructive"
            onClick={deleteSelected}
          >
            <i className="fas fa-trash-alt" style={{ marginRight: 4 }}></i>
            Delete ({selectedIndices.size})
          </button>
        )}
      </div>
    </div>
  );
}