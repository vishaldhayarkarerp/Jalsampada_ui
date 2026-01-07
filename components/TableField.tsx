// Updated TableField.tsx
// Replace the existing LinkCell function with the new TableLinkCell component.
// Also, add import for TableLinkCell.
// Remove the old LinkCell logic and SelectInput import if not used elsewhere.

"use client";

import * as React from "react";
import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { FormField } from "./DynamicFormComponent";
import { Button } from "@/components/ui/button";
import { Upload, X, Eye, Edit, Download, Upload as UploadIcon } from "lucide-react"; // Import icons
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
// import SelectInput from "./form/Select"; // Remove if not used

// NEW IMPORT: Add this
import { TableLinkCell } from "./TableLinkCell"; // Adjust path if needed
import { Modal } from "./Modal";
import { DynamicFormForTable } from "./DynamicFormForTable";
import { TableRowProvider, useTableRowContext } from "./TableRowContext";
import "./TableField.css";

const API_BASE_URL = "http://103.219.1.138:4412/";
const LINK_API_BASE_URL = "http://103.219.1.138:4412//api/resource";

interface Option {
  value: string;
  label: string;
}

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

  const { watch, setValue } = useFormContext();
  const value = watch(fieldName);

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let objectUrl: string | null = null;

    if (value instanceof File) {
      // Case 1: New file selected by user
      objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);

    } else if (typeof value === 'string' && (value.startsWith("/files/") || value.startsWith("/private/files/"))) {
      setPreviewUrl(API_BASE_URL + value);

    } else {
      setPreviewUrl(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue(fieldName, file, { shouldDirty: true });
    }
  };

  const handleClear = () => {
    setValue(fieldName, null, { shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

function TableFieldContent({ field, control, register, errors }: TableFieldProps) {
  const { fields: formRows, append, remove } = useFieldArray({
    control,
    name: field.name,
  });

  const formMethods = useFormContext();
  const { rows, updateRow, openEditModal, closeEditModal, isEditModalOpen, editingRowIndex, getRowData, setRows } = useTableRowContext();

  const [selectedIndices, setSelectedIndices] = React.useState<Set<number>>(new Set());

  const addRow = () => {
    const row: any = { id: Date.now().toString() + Math.random() };
    (field.columns || []).forEach((c) => (row[c.name] = ""));
    console.log('Adding new row:', row);

    // Add to react-hook-form
    append(row);

    // Also add to context to ensure sync
    setRows([...rows, row]);
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
    console.log('Deleting rows:', toRemove);

    // Remove from react-hook-form
    remove(toRemove);

    // Also update context to ensure sync
    const newRows = rows.filter((_, index) => !selectedIndices.has(index));
    setRows(newRows);

    setSelectedIndices(new Set());
  };

  const handleEdit = (index: number) => {
    console.log('Editing row:', index, 'Data:', rows[index]);
    openEditModal(index);
  };

  const handleEditSubmit = (data: Record<string, any>) => {
    if (editingRowIndex !== null) {
      updateRow(editingRowIndex, data);
    }
    closeEditModal();
  };

  const handleEditCancel = () => {
    closeEditModal();
  };

  // Handle direct table input changes and sync with context
  const handleTableInputChange = (rowIndex: number, fieldName: string, value: any) => {
    console.log('Table input changed:', rowIndex, fieldName, value);
    console.log('Current row data:', rows[rowIndex]);
    updateRow(rowIndex, { [fieldName]: value });

    // Also update the form field to maintain react-hook-form sync
    formMethods.setValue(`${field.name}.${rowIndex}.${fieldName}`, value, { shouldDirty: true });
  };

  // Download functionality
  const handleDownload = () => {
    const csvContent = [
      // Headers
      (field.columns || []).map(c => c.label).join(','),
      // Data rows
      ...rows.map(row =>
        (field.columns || []).map(c => row[c.name] || '').join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${field.label || 'table_data'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Upload functionality
  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      console.log('Raw CSV text:', text);

      const lines = text.split('\n').filter(line => line.trim());
      console.log('Parsed lines:', lines);

      if (lines.length < 2) {
        alert('File must contain headers and at least one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      console.log('Headers:', headers);

      const columnMap = new Map<string, number>();

      // Map headers to field names
      (field.columns || []).forEach(col => {
        const headerIndex = headers.findIndex(h =>
          h.toLowerCase() === col.label.toLowerCase()
        );
        if (headerIndex !== -1) {
          columnMap.set(col.name, headerIndex);
          console.log(`Mapped ${col.name} to header index ${headerIndex} (${headers[headerIndex]})`);
        } else {
          console.log(`No header found for ${col.name} (looking for: ${col.label})`);
        }
      });

      // Parse data rows
      const newRows = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        console.log(`Row ${index + 1} values:`, values);

        const row: any = { id: Date.now().toString() + Math.random() };

        (field.columns || []).forEach(col => {
          const colIndex = columnMap.get(col.name);
          if (colIndex !== undefined && values[colIndex]) {
            row[col.name] = values[colIndex];
            console.log(`Set ${col.name} = "${values[colIndex]}"`);
          } else {
            row[col.name] = '';
            console.log(`Set ${col.name} = "" (no data)`);
          }
        });

        console.log(`Final row ${index + 1}:`, row);
        return row;
      });

      console.log('All new rows to import:', newRows);

      // Clear existing rows and add new ones
      remove();
      newRows.forEach((row, index) => {
        console.log(`Appending row ${index + 1}:`, row);
        append(row);
      });

      // Also update the context to ensure sync
      setRows(newRows);

      alert(`Successfully imported ${newRows.length} rows`);
    };

    reader.readAsText(file);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = '';
    }
  };

  const allSelected = rows.length > 0 && selectedIndices.size === rows.length;
  const someSelected = selectedIndices.size > 0 && selectedIndices.size < rows.length;

  return (
    <>
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
                <th style={{ width: 60, position: 'sticky', right: 0, backgroundColor: 'var(--color-surface, #fff)', zIndex: 10 }} className="child-table-edit-cell">
                  Actions
                </th>
              </tr>
            </thead>
          </table>
          <div className="table-scroll-container" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="stock-table child-form-table">
              <thead style={{ visibility: "hidden", height: 0 }}>
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
                  <th style={{ width: 60, position: 'sticky', right: 0, backgroundColor: 'var(--color-surface, #fff)', zIndex: 10 }} className="child-table-edit-cell">
                    Actions
                  </th>
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

                        {c.type === "Attach" ? (
                          <AttachmentCell
                            control={formMethods.control}
                            fieldName={`${field.name}.${idx}.${c.name}`}
                          />
                        ) : c.type === "Link" ? (
                          // NEW: Use TableLinkCell instead of old LinkCell
                          <TableLinkCell
                            control={formMethods.control}
                            fieldName={`${field.name}.${idx}.${c.name}`}
                            column={c}
                          // filters={...} // Pass filters if needed, e.g., dynamic based on row
                          />
                        ) : c.type === "Text" ? (
                          <input
                            className="form-control-borderless"
                            type="text"
                            placeholder={c.label}
                            value={(rows[idx] as any)?.[c.name] || ""}
                            onChange={(e) => handleTableInputChange(idx, c.name, e.target.value)}
                          />
                        ) : (
                          <input
                            className="form-control-borderless"
                            type={c.type === "Int" ? "number" : c.type === "Float" ? "number" : "text"}
                            placeholder={c.label}
                            value={(rows[idx] as any)?.[c.name] || ""}
                            onChange={(e) => handleTableInputChange(idx, c.name, e.target.value)}
                          />
                        )}

                      </td>
                    ))}

                    <td style={{ position: 'sticky', right: 0, backgroundColor: 'var(--color-surface, #fff)', zIndex: 10 }} className="child-table-edit-cell">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(idx)}
                        title="Edit row"
                      >
                        <Edit size={16} />
                      </Button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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

          {field.showDownloadUpload && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="file"
                ref={uploadInputRef}
                accept=".csv"
                onChange={handleUpload}
                style={{ display: 'none' }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title="Download as CSV"
              >
                <Download size={16} className="mr-2" />
                Download
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => uploadInputRef.current?.click()}
                title="Upload from CSV"
              >
                <UploadIcon size={16} className="mr-2" />
                Upload
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingRowIndex !== null && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleEditCancel}
          title={`Edit Row ${editingRowIndex + 1}`}
          size="lg"
        >
          <DynamicFormForTable
            fields={field.columns}
            data={getRowData(editingRowIndex)}
            onSubmit={handleEditSubmit}
            onCancel={handleEditCancel}
          />
        </Modal>
      )}
    </>
  );
}

export function TableField({ field, control, register, errors }: TableFieldProps) {
  const { fields: rows } = useFieldArray({
    control,
    name: field.name,
  });

  const formMethods = useFormContext();

  const handleRowsChange = (newRows: Record<string, any>[]) => {
    // Update the form field array with new data
    newRows.forEach((row, index) => {
      Object.keys(row).forEach(key => {
        formMethods.setValue(`${field.name}.${index}.${key}`, row[key], { shouldDirty: true });
      });
    });
  };

  return (
    <TableRowProvider
      initialRows={rows}
      field={field}
      onRowsChange={handleRowsChange}
    >
      <TableFieldContent field={field} control={control} register={register} errors={errors} />
    </TableRowProvider>
  );
}