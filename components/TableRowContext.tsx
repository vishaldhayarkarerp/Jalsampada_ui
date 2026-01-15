"use client";

import * as React from "react";

interface TableRowContextType {
    rows: Record<string, any>[];
    editingRowIndex: number | null;
    isEditModalOpen: boolean;
    openEditModal: (index: number) => void;
    closeEditModal: () => void;
    getRowData: (index: number) => Record<string, any>;
    updateRow: (index: number, data: Record<string, any>) => void;
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
    rows: Record<string, any>[];
    onUpdateRow?: (index: number, data: Record<string, any>) => void;
}

export function TableRowProvider({
    children,
    rows,
    onUpdateRow,
}: TableRowProviderProps) {
    const [editingRowIndex, setEditingRowIndex] = React.useState<number | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

    const openEditModal = React.useCallback((index: number) => {
        setEditingRowIndex(index);
        setIsEditModalOpen(true);
    }, []);

    const closeEditModal = React.useCallback(() => {
        setEditingRowIndex(null);
        setIsEditModalOpen(false);
    }, []);

    const getRowData = React.useCallback((index: number) => {
        return (rows && rows[index]) ? rows[index] : {};
    }, [rows]);

    const updateRow = React.useCallback((index: number, data: Record<string, any>) => {
        if (onUpdateRow) {
            onUpdateRow(index, data);
        }
    }, [onUpdateRow]);

    const value: TableRowContextType = React.useMemo(() => ({
        rows: rows || [],
        editingRowIndex,
        isEditModalOpen,
        openEditModal,
        closeEditModal,
        getRowData,
        updateRow,
    }), [rows, editingRowIndex, isEditModalOpen, openEditModal, closeEditModal, getRowData, updateRow]);

    return (
        <TableRowContext.Provider value={value}>
            {children}
        </TableRowContext.Provider>
    );
}