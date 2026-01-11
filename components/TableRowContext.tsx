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

    // Track if we're currently syncing to avoid infinite loops
    const isSyncingRef = React.useRef(false);

    // Sync from parent when initialRows changes (only if not currently syncing)
    React.useEffect(() => {
        if (!isSyncingRef.current) {
            console.log('TableRowContext: Syncing from parent initialRows');
            setRows(initialRows);
        }
    }, [initialRows]);

    const setRowsWithCallback = React.useCallback((newRows: Record<string, any>[]) => {
        console.log('TableRowContext: setRowsWithCallback called');
        isSyncingRef.current = true;
        setRows(newRows);

        // Use requestAnimationFrame to ensure this happens after render
        requestAnimationFrame(() => {
            onRowsChange(newRows);
            // Reset sync flag after a brief delay
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 100);
        });
    }, [onRowsChange]);

    const updateRow = React.useCallback((index: number, data: Record<string, any>) => {
        console.log('TableRowContext: updateRow called', index, data);

        setRows(currentRows => {
            const newRows = [...currentRows];
            newRows[index] = { ...newRows[index], ...data };

            // Schedule the callback for after render completes
            isSyncingRef.current = true;
            requestAnimationFrame(() => {
                onRowsChange(newRows);
                // Reset sync flag after a brief delay
                setTimeout(() => {
                    isSyncingRef.current = false;
                }, 100);
            });

            return newRows;
        });
    }, [onRowsChange]);

    const openEditModal = React.useCallback((index: number) => {
        setEditingRowIndex(index);
        setIsEditModalOpen(true);
    }, []);

    const closeEditModal = React.useCallback(() => {
        setEditingRowIndex(null);
        setIsEditModalOpen(false);
    }, []);

    const getRowData = React.useCallback((index: number) => {
        return rows[index] || {};
    }, [rows]);

    const value: TableRowContextType = React.useMemo(() => ({
        rows,
        editingRowIndex,
        isEditModalOpen,
        setRows: setRowsWithCallback,
        updateRow,
        openEditModal,
        closeEditModal,
        getRowData,
    }), [rows, editingRowIndex, isEditModalOpen, setRowsWithCallback, updateRow, openEditModal, closeEditModal, getRowData]);

    return (
        <TableRowContext.Provider value={value}>
            {children}
        </TableRowContext.Provider>
    );
}