"use client";

import * as React from "react";
import { FormField } from "./DynamicFormComponent";

interface TableRowContextType {
    rows: Record<string, any>[];
    editingRowIndex: number | null;
    isEditModalOpen: boolean;
    setRows: (rows: Record<string, any>[]) => void;
    updateRow: (index: number, data: Record<string, any>) => void;
    openEditModal: (index: number) => void;
    closeEditModal: () => void;
    getRowData: (index: number) => Record<string, any>;
}

const TableRowContext = React.createContext<TableRowContextType | undefined>(undefined);

export function useTableRowContext() {
    const context = React.useContext(TableRowContext);
    if (!context) {
        throw new Error("useTableRowContext must be used within a TableRowProvider");
    }
    return context;
}

interface TableRowProviderProps {
    children: React.ReactNode;
    initialRows: Record<string, any>[];
    field: FormField;
    onRowsChange: (rows: Record<string, any>[]) => void;
}

export function TableRowProvider({
    children,
    initialRows,
    field,
    onRowsChange
}: TableRowProviderProps) {
    const [rows, setRows] = React.useState<Record<string, any>[]>(initialRows);
    const [editingRowIndex, setEditingRowIndex] = React.useState<number | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

    // Update rows when initialRows changes (from parent form)
    React.useEffect(() => {
        setRows(initialRows);
    }, [initialRows]);

    const setRowsWithCallback = (newRows: Record<string, any>[]) => {
        setRows(newRows);
        onRowsChange(newRows);
    };

    const updateRow = (index: number, data: Record<string, any>) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], ...data };
        setRows(newRows);
        onRowsChange(newRows);
    };

    const openEditModal = (index: number) => {
        setEditingRowIndex(index);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditingRowIndex(null);
        setIsEditModalOpen(false);
    };

    const getRowData = (index: number) => {
        return rows[index] || {};
    };

    const value: TableRowContextType = {
        rows,
        editingRowIndex,
        isEditModalOpen,
        setRows: setRowsWithCallback,
        updateRow,
        openEditModal,
        closeEditModal,
        getRowData,
    };

    return (
        <TableRowContext.Provider value={value}>
            {children}
        </TableRowContext.Provider>
    );
}
