// New component: TableLinkCell.tsx
// This is similar to LinkField but adapted for table cells: no label, borderless input, simplified error handling (none shown), and positioned dropdown.
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Controller } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { Search, Loader2, X } from "lucide-react";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

interface TableLinkOption {
    value: string;
    label: string;
}

interface TableLinkCellProps {
    control: any;
    fieldName: string; // e.g., "items.0.item_code"
    column: {
        linkTarget?: string;
        required?: boolean;
        placeholder?: string;
    };
    filters?: Record<string, any>; // Optional filters, similar to LinkField
}

export function TableLinkCell({ control, fieldName, column, filters = {} }: TableLinkCellProps) {
    const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

    const [searchTerm, setSearchTerm] = React.useState("");
    const [options, setOptions] = React.useState<TableLinkOption[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });

    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // API Search Logic (adapted from LinkField)
    const performSearch = React.useCallback(async (term: string) => {
        if (!isAuthenticated || !apiKey || !column.linkTarget) return;

        setIsLoading(true);
        try {
            const searchFilters: any[] = [];
            if (term?.trim()) {
                searchFilters.push([column.linkTarget, "name", "like", `%${term.trim()}%`]);
            }

            Object.entries(filters).forEach(([key, value]) => {
                if (value != null && value !== "") {
                    searchFilters.push([column.linkTarget, key, "=", value]);
                }
            });

            const query = JSON.stringify(searchFilters);

            const resp = await axios.get(`${API_BASE_URL}/${column.linkTarget}`, {
                params: {
                    fields: JSON.stringify(["name"]),
                    limit_page_length: "20",
                    order_by: "name asc",
                    filters: query
                },
                headers: { Authorization: `token ${apiKey}:${apiSecret}` },
                withCredentials: true,
            });

            const raw = (resp.data.data || []) as { name: string }[];
            setOptions(raw.map((r) => ({ value: r.name, label: r.name })));
        } catch (e) {
            console.error("TableLinkCell search error:", e);
            setOptions([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, apiKey, apiSecret, column.linkTarget, filters]);

    const debouncedSearch = React.useCallback((term: string) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => performSearch(term), 300);
    }, [performSearch]);

    // Update dropdown position when opened
    const updateDropdownPosition = React.useCallback(() => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, []);

    // Close dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update position on scroll/resize when dropdown is open
    React.useEffect(() => {
        if (!isOpen) return;

        const handlePositionUpdate = () => {
            updateDropdownPosition();
        };

        window.addEventListener('scroll', handlePositionUpdate, true);
        window.addEventListener('resize', handlePositionUpdate);

        return () => {
            window.removeEventListener('scroll', handlePositionUpdate, true);
            window.removeEventListener('resize', handlePositionUpdate);
        };
    }, [isOpen, updateDropdownPosition]);

    return (
        <div className="relative" ref={dropdownRef} style={{ overflow: 'visible' }}>
            <Controller
                control={control}
                name={fieldName}
                rules={{ required: column.required ? "This field is required" : false }}
                render={({ field: { onChange, onBlur, value } }) => {

                    // Sync searchTerm with value when not open
                    React.useEffect(() => {
                        if (value !== searchTerm && !isOpen) {
                            setSearchTerm(value || "");
                        }
                    }, [value, isOpen]);

                    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const newValue = e.target.value;
                        setSearchTerm(newValue);
                        setIsOpen(true);
                        updateDropdownPosition();
                        debouncedSearch(newValue);

                        // Clear value if no exact match
                        const exactMatch = options.find(opt => opt.label === newValue);
                        onChange(exactMatch ? exactMatch.value : "");
                    };

                    const handleOptionSelect = (option: TableLinkOption) => {
                        setSearchTerm(option.label);
                        onChange(option.value);
                        setIsOpen(false);
                    };

                    const handleInputFocus = () => {
                        setIsOpen(true);
                        updateDropdownPosition();
                        performSearch(searchTerm);
                    };

                    return (
                        <>
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className={`form-control-borderless w-full pr-8 
                    ${!isAuthenticated ? "bg-gray-50 cursor-not-allowed" : ""}`}
                                    placeholder={column.placeholder || "Search..."}
                                    value={searchTerm}
                                    onChange={handleInputChange}
                                    onFocus={handleInputFocus}
                                    onBlur={() => {
                                        onBlur();
                                        setTimeout(() => {
                                            if (!options.find(o => o.label === searchTerm) && searchTerm !== value) {
                                                setSearchTerm(value || "");
                                            }
                                            setIsOpen(false);
                                        }, 200);
                                    }}
                                    disabled={!isAuthenticated || !isInitialized}
                                />

                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : searchTerm ? (
                                        <X
                                            className="h-4 w-4 cursor-pointer hover:text-gray-600"
                                            onClick={() => {
                                                setSearchTerm("");
                                                onChange("");
                                                setOptions([]);
                                            }}
                                        />
                                    ) : (
                                        <Search className="h-4 w-4" />
                                    )}
                                </div>
                            </div>

                            {isOpen && createPortal(
                                <div
                                    ref={dropdownRef}
                                    className="absolute z-[99999] bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                                    style={{
                                        top: `${dropdownPosition.top}px`,
                                        left: `${dropdownPosition.left}px`,
                                        width: `${dropdownPosition.width}px`
                                    }}
                                >
                                    {options.length > 0 ? (
                                        options.map((option) => (
                                            <div
                                                key={option.value}
                                                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleOptionSelect(option);
                                                }}
                                            >
                                                {option.label}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-3 text-sm text-gray-500 text-center italic">
                                            {isLoading ? "Searching..." : "No results found"}
                                        </div>
                                    )}
                                </div>,
                                document.body
                            )}
                        </>
                    );
                }}
            />
        </div>
    );
}