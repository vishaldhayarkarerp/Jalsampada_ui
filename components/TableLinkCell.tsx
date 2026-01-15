// New component: TableLinkCell.tsx
// This is similar to LinkField but adapted for table cells: no label, borderless input, simplified error handling (none shown), and positioned dropdown.
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { use } from "react";
import axios from "axios";
import { Controller, useWatch, useController } from "react-hook-form";
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
    onValueChange?: (value: any) => void; // Callback for parent sync
}

// Create a cache for promises to prevent duplicate requests
const promiseCache = new Map<string, Promise<any>>();

function fetchWithCache(url: string, params: any, headers: any) {
    const cacheKey = JSON.stringify({ url, params });

    if (!promiseCache.has(cacheKey)) {
        promiseCache.set(cacheKey,
            axios.get(url, { params, headers }).then(res => {
                return res.data.data || [];
            }).finally(() => {
                // Remove from cache after some time to prevent memory leaks
                setTimeout(() => promiseCache.delete(cacheKey), 30000);
            })
        );
    }

    return promiseCache.get(cacheKey)!;
}

function useOptions(linkTarget: string | undefined, filters: Record<string, any>, searchTerm: string, auth: any) {
    if (!linkTarget) return [];

    const searchFilters: any[] = [];
    if (searchTerm?.trim()) {
        searchFilters.push([linkTarget, "name", "like", `%${searchTerm.trim()}%`]);
    }

    Object.entries(filters).forEach(([key, value]) => {
        if (value != null && value !== "") {
            // Handle "in" filter format for array values
            if (Array.isArray(value) && value[0] === "in") {
                const arrayValues = value[1];
                if (Array.isArray(arrayValues) && arrayValues.length > 0) {
                    searchFilters.push([linkTarget, key, "in", arrayValues]);
                }
            } else {
                searchFilters.push([linkTarget, key, "=", value]);
            }
        }
    });

    const params = {
        fields: JSON.stringify(["name"]),
        filters: JSON.stringify(searchFilters),
        limit_page_length: "20",
        order_by: "name asc"
    };

    const headers = {
        'Authorization': `token ${auth.apiKey}:${auth.apiSecret}`,
        'withCredentials': true
    };

    // This will suspend until the promise resolves
    const data = use(fetchWithCache(`${API_BASE_URL}/${linkTarget}`, params, headers));

    return data.map((item: any) => ({
        value: item.name,
        label: item.name,
    }));
}

export function TableLinkCell({ control, fieldName, column, filters = {}, onValueChange }: TableLinkCellProps) {
    const auth = useAuth();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Watch form values to detect changes in filter dependencies
    const formValues = useWatch({ control });

    // Get current field value
    const { field } = useController({
        control,
        name: fieldName,
        defaultValue: "",
    });

    // Convert filters to actual values
    const resolvedFilters = React.useMemo(() => {
        return Object.fromEntries(
            Object.entries(filters).map(([key, value]) => [
                key,
                typeof value === 'function' ? value() : value
            ])
        );
    }, [filters, formValues]);

    // Use the use hook for data fetching
    const options = useOptions(column.linkTarget, resolvedFilters, searchTerm, {
        apiKey: auth.apiKey,
        apiSecret: auth.apiSecret
    });

    // Clear the field if the current value is no longer valid
    React.useEffect(() => {
        if (!field.value || !column.linkTarget) return;

        const currentValue = field.value;
        const isValid = options.some((opt: any) => opt.value === currentValue);

        if (!isValid && options.length > 0) {
            // Current value is no longer in the filtered options
            field.onChange(""); // Clear the field
            onValueChange?.("");
        }
    }, [options, field, onValueChange]);

    // Handle selection
    const handleSelect = (option: TableLinkOption) => {
        field.onChange(option.value);
        onValueChange?.(option.value);
        setIsOpen(false);
    };

    // Handle search with debounce
    const handleSearch = (term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(term);
        }, 300);
    };

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

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

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
                        handleSearch(newValue);

                        // Clear value if no exact match
                        const exactMatch = options.find((opt: any) => opt.label === newValue);
                        const finalValue = exactMatch ? exactMatch.value : "";
                        onChange(finalValue);
                        onValueChange?.(finalValue);
                    };

                    const handleInputFocus = () => {
                        setIsOpen(true);
                        updateDropdownPosition();
                        setSearchTerm(value || "");
                    };

                    return (
                        <>
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className={`form-control-borderless w-full pr-8 
                        ${!auth.isAuthenticated ? "bg-gray-50 cursor-not-allowed" : ""}`}
                                    placeholder={column.placeholder || "Search..."}
                                    value={searchTerm}
                                    onChange={handleInputChange}
                                    onFocus={handleInputFocus}
                                    onBlur={() => {
                                        onBlur();
                                        setTimeout(() => {
                                            if (!options.find((o: any) => o.label === searchTerm) && searchTerm !== value) {
                                                setSearchTerm(value || "");
                                            }
                                            setIsOpen(false);
                                        }, 200);
                                    }}
                                    disabled={!auth.isAuthenticated || !auth.isInitialized}
                                />

                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
                                    {searchTerm ? (
                                        <X
                                            className="h-4 w-4 cursor-pointer hover:text-gray-600"
                                            onClick={() => {
                                                setSearchTerm("");
                                                onChange("");
                                                onValueChange?.("");
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
                                    <React.Suspense fallback={
                                        <div className="px-3 py-3 text-sm text-gray-500 text-center italic">
                                            Loading...
                                        </div>
                                    }>
                                        {options.length > 0 ? (
                                            options.map((option: any) => (
                                                <div
                                                    key={option.value}
                                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleSelect(option);
                                                    }}
                                                >
                                                    {option.label}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-3 text-sm text-gray-500 text-center italic">
                                                No results found
                                            </div>
                                        )}
                                    </React.Suspense>
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