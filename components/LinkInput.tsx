"use client";

import * as React from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Search, Loader2, X } from "lucide-react";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

interface LinkInputOption {
    value: string;
    label: string;
}

interface LinkInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    linkTarget?: string;
    className?: string;
    filters?: Record<string, any>;
}

export function LinkInput({ value, onChange, placeholder, linkTarget, className, filters = {} }: LinkInputProps) {
    const { apiKey, apiSecret, isAuthenticated } = useAuth();

    const [searchTerm, setSearchTerm] = React.useState("");
    const [options, setOptions] = React.useState<LinkInputOption[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Memoized filters to prevent unnecessary re-renders
    const filtersString = React.useMemo(() => JSON.stringify(filters), [filters]);

    // API Search Logic
    const performSearch = React.useCallback(async (term: string) => {
        if (!isAuthenticated || !apiKey || !linkTarget) return;

        setIsLoading(true);
        try {
            const searchFilters: any[] = [];
            if (term?.trim()) {
                searchFilters.push([linkTarget, "name", "like", `%${term.trim()}%`]);
            }

            // Apply filters from filterMapping
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

            // Determine which fields to fetch based on linkTarget
            let fieldsToFetch = ["name"];
            if (linkTarget === "Prapan Suchi") {
                fieldsToFetch = ["name", "work_name"];
            }

            const query = searchFilters.length > 0 ? JSON.stringify(searchFilters) : undefined;
            const response = await axios.get(`${API_BASE_URL}/${linkTarget}`, {
                headers: {
                    Authorization: `token ${apiKey}:${apiSecret}`,
                },
                params: {
                    filters: query,
                    fields: JSON.stringify(fieldsToFetch),
                    limit_page_length: 20,
                },
            });

            if (response.data?.data) {
                const formattedOptions = response.data.data.map((item: any) => ({
                    value: item.name,
                    label: linkTarget === "Prapan Suchi" ? (item.work_name || item.name) : item.name,
                }));
                setOptions(formattedOptions);
            }
        } catch (error) {
            console.error("LinkInput search error:", error);
            setOptions([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, apiKey, apiSecret, linkTarget, filtersString]);

    // Optimized debounced search with useCallback
    const debouncedSearch = React.useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            if (term !== value) {
                performSearch(term);
            }
        }, 300);
    }, [performSearch, value]);

    // Sync external value when not focused
    React.useEffect(() => {
        if (!isFocused) {
            setSearchTerm(value || "");
        }
    }, [value, isFocused]);

    // Debounced search effect
    React.useEffect(() => {
        debouncedSearch(searchTerm);
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, debouncedSearch]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Display logic
    const displayValue = isFocused ? searchTerm : (value || "");

    // Filter options based on search term
    const filteredOptions = React.useMemo(() => {
        if (!searchTerm?.trim()) {
            return options;
        }
        return options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    // Input handlers
    const handleFocus = React.useCallback(() => {
        setIsFocused(true);
        setSearchTerm(value || "");
        setIsOpen(true);
        performSearch(value || "");
    }, [value, performSearch]);

    const handleBlur = React.useCallback(() => {
        setTimeout(() => {
            setIsFocused(false);
            if (searchTerm !== value) {
                setSearchTerm(value || ""); // Restore original
            }
        }, 200);
    }, [value, searchTerm]);

    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        setIsOpen(true);

        // Only call onChange on clear
        if (newValue === "") {
            onChange("");
        }
    }, [onChange]);

    const handleOptionSelect = React.useCallback((option: LinkInputOption) => {
        setSearchTerm(option.value);
        onChange(option.value); // Update on selection
        setIsOpen(false);
        setIsFocused(false);
    }, [onChange]);

    const handleClear = React.useCallback(() => {
        setSearchTerm("");
        onChange("");
        setIsOpen(false);
    }, [onChange]);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder || `Select ${linkTarget}...`}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none form-control focus:border-transparent"
                    autoComplete="off"
                    spellCheck="false"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : value ? (
                        <X
                            className="h-4 w-4 cursor-pointer hover:text-gray-600"
                            onClick={handleClear}
                        />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleOptionSelect(option)}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                            {isLoading ? "Searching..." : searchTerm ? "No results found" : "Type to search..."}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
