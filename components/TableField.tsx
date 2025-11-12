"use client";

import * as React from "react";
import { useFieldArray } from "react-hook-form";
import { FormField } from "./DynamicFormComponent";
interface TableFieldProps {
    field: FormField;
    control: any;
    register: any;
    errors: any;
}

export function TableField({ field, control, register, errors }: TableFieldProps) {
    const { fields: rows, append, remove } = useFieldArray({
        control,
        name: field.name,
    });

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
                                        <input
                                            className="form-control-borderless"
                                            type={c.type === "number" ? "number" : "text"}
                                            placeholder={c.label}
                                            {...register(`${field.name}.${idx}.${c.name}`)}
                                        />
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