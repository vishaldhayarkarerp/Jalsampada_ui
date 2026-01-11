"use client";

import * as React from "react";
import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { FormField } from "./DynamicFormComponent";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Eye, Edit, Download, Upload as UploadIcon } from "lucide-react";
import { TableLinkCell } from "./TableLinkCell";
import { Modal } from "./Modal";
import { DynamicFormForTable } from "./DynamicFormForTable";
import { TableRowProvider, useTableRowContext } from "./TableRowContext";
import DatePicker from "react-datepicker";
import { cn } from "@/lib/utils";
import "./TableField.css";
import "react-datepicker/dist/react-datepicker.css";

const API_BASE_URL = "http://103.219.1.138:4412/";

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

// Helper functions for table field rendering
const renderTableInput = (c: any, idx: number, rows: any[], handleTableInputChange: Function) => (
  <input
    className="form-control-borderless"
    type="text"
    placeholder={c.label}
    value={(rows[idx] as any)?.[c.name] || ""}
    onChange={(e) => handleTableInputChange(idx, c.name, e.target.value)}
  />
);

const renderTableTextarea = (c: any, idx: number, rows: any[], handleTableInputChange: Function) => (
  <textarea
    className="form-control-borderless"
    rows={3}
    placeholder={c.label}
    value={(rows[idx] as any)?.[c.name] || ""}
    onChange={(e) => handleTableInputChange(idx, c.name, e.target.value)}
    style={{ minHeight: '60px', resize: 'vertical' }}
  />
);

const renderTableNumber = (c: any, idx: number, rows: any[], handleTableInputChange: Function) => (
  <input
    className="form-control-borderless"
    type="number"
    placeholder={c.label}
    value={(rows[idx] as any)?.[c.name] || ""}
    onChange={(e) => handleTableInputChange(idx, c.name, e.target.value)}
    step={c.type === "Float" || c.type === "Currency" || c.type === "Percent" ? "0.01" : "1"}
  />
);

const renderTableCheckbox = (c: any, idx: number, rows: any[], handleTableInputChange: Function) => (
  <Checkbox
    checked={!!(rows[idx] as any)?.[c.name]}
    onCheckedChange={(checked) => handleTableInputChange(idx, c.name, checked)}
  />
);

const renderTableSelect = (c: any, idx: number, rows: any[], handleTableInputChange: Function) => {
  const options = typeof c.options === "string"
    ? c.options.split("\n").map((o: string) => ({ label: o, value: o }))
    : c.options;

  return (
    <select
      className="form-control-borderless"
      value={(rows[idx] as any)?.[c.name] || ""}
      onChange={(e) => handleTableInputChange(idx, c.name, e.target.value)}
    >
      <option value="">Select...</option>
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

const renderTableColor = (c: any, idx: number, rows: any[], handleTableInputChange: Function) => (
  <input
    className="form-control-borderless"
    type="color"
    value={(rows[idx] as any)?.[c.name] || "#000000"}
    onChange={(e) => handleTableInputChange(idx, c.name, e.target.value)}
    style={{ width: '100%', height: '32px' }}
  />
);

const renderTableDuration = (c: any, idx: number, rows: any[], handleTableInputChange: Function) => {
  const value = (rows[idx] as any)?.[c.name] || {};
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      <input
        className="form-control-borderless"
        type="number"
        placeholder="HH"
        value={value.hours || ""}
        onChange={(e) => handleTableInputChange(idx, c.name, { ...value, hours: e.target.value })}
        min={0}
        style={{ width: '50px' }}
      />
      <input
        className="form-control-borderless"
        type="number"
        placeholder="MM"
        value={value.minutes || ""}
        onChange={(e) => handleTableInputChange(idx, c.name, { ...value, minutes: e.target.value })}
        min={0}
        style={{ width: '50px' }}
      />
      <input
        className="form-control-borderless"
        type="number"
        placeholder="SS"
        value={value.seconds || ""}
        onChange={(e) => handleTableInputChange(idx, c.name, { ...value, seconds: e.target.value })}
        min={0}
        style={{ width: '50px' }}
      />
    </div>
  );
};

const renderTableRating = (c: any, idx: number, rows: any[], handleTableInputChange: Function) => {
  const value = (rows[idx] as any)?.[c.name] || 0;
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => handleTableInputChange(idx, c.name, star)}
          style={{
            color: star <= value ? '#fbbf24' : '#d1d5db',
            padding: '2px 4px',
            fontSize: '14px'
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const renderTableReadOnly = (c: any, idx: number, rows: any[]) => (
  <input
    type="text"
    className="form-control-borderless"
    value={(rows[idx] as any)?.[c.name] || ""}
    readOnly
    style={{
      background: 'var(--color-surface-muted, #f9fafb)',
      cursor: 'default'
    }}
  />
);

const renderTableButton = (c: any, idx: number, rows: any[]) => (
  <button
    type="button"
    className="btn btn--outline btn--sm"
    onClick={() => c.action?.(rows[idx], idx)}
  >
    {c.buttonLabel || c.label}
  </button>
);

function AttachmentCell({ fieldName, control, rowIndex, columnName, onValueChange }: {
  fieldName: string,
  control: any,
  rowIndex?: number,
  columnName?: string,
  onValueChange?: (value: any) => void
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const { watch, setValue } = useFormContext();
  const value = watch(fieldName);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let objectUrl: string | null = null;

    if (value instanceof File) {
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
      if (onValueChange && rowIndex !== undefined && columnName !== undefined) {
        onValueChange(file);
      }
    }
  };

  const handleClear = () => {
    setValue(fieldName, null, { shouldDirty: true });
    if (onValueChange && rowIndex !== undefined && columnName !== undefined) {
      onValueChange(null);
    }
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
        <>
          <span className="text-sm truncate flex-1" title={typeof value === 'string' ? value : value.name}>
            {typeof value === 'string' ? value.split('/').pop() : value.name}
          </span>

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

  // Debounce timeout for table input changes
  const updateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const addRow = () => {
    const row: any = { id: Date.now().toString() + Math.random() };
    (field.columns || []).forEach((c) => (row[c.name] = ""));
    console.log('TableField: Adding new row:', row);

    append(row);
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
    console.log('TableField: Deleting rows:', toRemove);

    remove(toRemove);
    const newRows = rows.filter((_, index) => !selectedIndices.has(index));
    setRows(newRows);
    setSelectedIndices(new Set());
  };

  const handleEdit = (index: number) => {
    console.log('TableField: Opening edit modal for row:', index, 'Data:', rows[index]);
    openEditModal(index);
  };

  const handleEditSubmit = (data: Record<string, any>) => {
    console.log('TableField: Edit submit received:', data);
    if (editingRowIndex !== null) {
      // Update context - this will trigger the effect to update form values
      updateRow(editingRowIndex, data);

      // Update form values directly as well to ensure immediate sync
      requestAnimationFrame(() => {
        Object.keys(data).forEach(key => {
          formMethods.setValue(`${field.name}.${editingRowIndex}.${key}`, data[key], { shouldDirty: true });
        });
      });
    }
    closeEditModal();
  };

  const handleEditCancel = () => {
    closeEditModal();
  };

  // Optimized handler for table input changes with debouncing
  const handleTableInputChange = React.useCallback((rowIndex: number, fieldName: string, value: any) => {
    console.log('TableField: Input changed:', rowIndex, fieldName, value);

    // Update form immediately for responsive UI
    formMethods.setValue(`${field.name}.${rowIndex}.${fieldName}`, value, { shouldDirty: true });

    // Debounced update to context - happens AFTER the current render cycle
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      console.log('TableField: Debounced update to context');
      // Use requestAnimationFrame to ensure this happens outside the render cycle
      requestAnimationFrame(() => {
        updateRow(rowIndex, { [fieldName]: value });
      });
    }, 150); // 150ms debounce for faster table updates
  }, [field.name, formMethods, updateRow]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Download functionality
  const handleDownload = () => {
    const csvContent = [
      (field.columns || []).map(c => c.label).join(','),
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
      console.log('TableField: Parsing CSV');

      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('File must contain headers and at least one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const columnMap = new Map<string, number>();

      (field.columns || []).forEach(col => {
        const headerIndex = headers.findIndex(h =>
          h.toLowerCase() === col.label.toLowerCase()
        );
        if (headerIndex !== -1) {
          columnMap.set(col.name, headerIndex);
        }
      });

      const newRows = lines.slice(1).map((line) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = { id: Date.now().toString() + Math.random() };

        (field.columns || []).forEach(col => {
          const colIndex = columnMap.get(col.name);
          row[col.name] = (colIndex !== undefined && values[colIndex]) ? values[colIndex] : '';
        });

        return row;
      });

      console.log('TableField: Importing rows:', newRows);

      remove();
      newRows.forEach(row => append(row));
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
          <div className="table-scroll-container" style={{ maxHeight: "400px", overflow: "auto" }}>
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
                            rowIndex={idx}
                            columnName={c.name}
                            onValueChange={(value) => handleTableInputChange(idx, c.name, value)}
                          />
                        ) : c.type === "Link" ? (
                          <TableLinkCell
                            control={formMethods.control}
                            fieldName={`${field.name}.${idx}.${c.name}`}
                            column={c}
                            onValueChange={(value) => handleTableInputChange(idx, c.name, value)}
                          />
                        ) : c.type === "Date" ? (
                          <DatePicker
                            selected={(rows[idx] as any)?.[c.name] ? new Date((rows[idx] as any)[c.name]) : null}
                            onChange={(date: Date | null) => {
                              handleTableInputChange(idx, c.name, date ? date.toISOString().split('T')[0] : '');
                            }}
                            dateFormat="dd/MM/yyyy"
                            className={cn("form-control-borderless w-full")}
                            placeholderText="DD/MM/YYYY"
                            showYearDropdown
                            scrollableYearDropdown
                            yearDropdownItemNumber={100}
                            withPortal
                            portalId="root"
                          />
                        ) : c.type === "Data" || c.type === "Small Text" || c.type === "Text" ? (
                          renderTableInput(c, idx, rows, handleTableInputChange)
                        ) : c.type === "Long Text" || c.type === "Markdown Editor" ? (
                          renderTableTextarea(c, idx, rows, handleTableInputChange)
                        ) : c.type === "Code" ? (
                          renderTableTextarea(c, idx, rows, handleTableInputChange)
                        ) : c.type === "Password" ? (
                          <input
                            className="form-control-borderless"
                            type="password"
                            placeholder={c.label}
                            value={(rows[idx] as any)?.[c.name] || ""}
                            onChange={(e) => handleTableInputChange(idx, c.name, e.target.value)}
                          />
                        ) : c.type === "Int" ? (
                          renderTableNumber(c, idx, rows, handleTableInputChange)
                        ) : c.type === "Float" || c.type === "Currency" || c.type === "Percent" ? (
                          renderTableNumber(c, idx, rows, handleTableInputChange)
                        ) : c.type === "Color" ? (
                          renderTableColor(c, idx, rows, handleTableInputChange)
                        ) : c.type === "DateTime" || c.type === "Time" ? (
                          <input
                            className="form-control-borderless"
                            type={c.type === "DateTime" ? "datetime-local" : "time"}
                            placeholder={c.label}
                            value={(rows[idx] as any)?.[c.name] || ""}
                            onChange={(e) => handleTableInputChange(idx, c.name, e.target.value)}
                          />
                        ) : c.type === "Duration" ? (
                          renderTableDuration(c, idx, rows, handleTableInputChange)
                        ) : c.type === "Check" ? (
                          renderTableCheckbox(c, idx, rows, handleTableInputChange)
                        ) : c.type === "Select" ? (
                          renderTableSelect(c, idx, rows, handleTableInputChange)
                        ) : c.type === "Barcode" ? (
                          renderTableInput(c, idx, rows, handleTableInputChange)
                        ) : c.type === "Read Only" ? (
                          renderTableReadOnly(c, idx, rows)
                        ) : c.type === "Rating" ? (
                          renderTableRating(c, idx, rows, handleTableInputChange)
                        ) : c.type === "Button" ? (
                          renderTableButton(c, idx, rows)
                        ) : (
                          renderTableInput(c, idx, rows, handleTableInputChange)
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

  const handleRowsChange = React.useCallback((newRows: Record<string, any>[]) => {
    console.log('TableField: Context rows changed, updating form');
    newRows.forEach((row, index) => {
      Object.keys(row).forEach(key => {
        formMethods.setValue(`${field.name}.${index}.${key}`, row[key], { shouldDirty: true });
      });
    });
  }, [field.name, formMethods]);

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