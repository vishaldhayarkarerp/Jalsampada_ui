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

    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
                    searchFilters.push([linkTarget, key, "=", value]);
                }
            });

            const query = searchFilters.length > 0 ? JSON.stringify(searchFilters) : undefined;
            const response = await axios.get(`${API_BASE_URL}/${linkTarget}`, {
                headers: {
                    Authorization: `token ${apiKey}:${apiSecret}`,
                },
                params: {
                    filters: query,
                    fields: JSON.stringify(["name"]),
                    limit_page_length: 20,
                },
            });

            if (response.data?.data) {
                const formattedOptions = response.data.data.map((item: any) => ({
                    value: item.name,
                    label: item.name,
                }));
                setOptions(formattedOptions);
            }
        } catch (error) {
            console.error("LinkInput search error:", error);
            setOptions([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, apiKey, apiSecret, linkTarget, filters]);

    // Debounced search
    React.useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            if (searchTerm !== value) {
                performSearch(searchTerm);
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, performSearch, value]);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleOptionSelect = (option: LinkInputOption) => {
        onChange(option.value);
        setSearchTerm(option.value);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange("");
        setSearchTerm("");
        setIsOpen(false);
    };

    const handleFocus = () => {
        setSearchTerm(value);
        setIsOpen(true);
        performSearch(value);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm || value}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder || `Select ${linkTarget}...`}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none form-control focus:border-transparent"
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
                    {options.length > 0 ? (
                        options.map((option) => (
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
