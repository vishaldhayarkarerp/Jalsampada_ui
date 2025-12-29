"use client";

import * as React from "react";
import axios from "axios";
import { Controller } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { FormField } from "./DynamicFormComponent";
import { Search } from "lucide-react";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

interface LinkFieldOption {
  value: string;
  label: string;
  description?: string;
}

interface LinkFieldProps {
  control: any;
  field: FormField & { defaultValue?: string };
  error?: any;
  className?: string;
  filters?: Record<string, any>; // Dynamic filters from form values
  getQuery?: (filters: Record<string, any>) => string; // Custom query function
}

/**
 * Frappe-style Link Field Component
 * 
 * Features:
 * 1. Type-ahead search with debouncing
 * 2. API-based search as user types
 * 3. Limited results (20 items max)
 * 4. Custom filters support
 * 5. Shows current value even while loading
 * 6. Keyboard navigation
 * 7. New record creation (optional)
 */
export function LinkField({ control, field, error, className, filters = {}, getQuery }: LinkFieldProps) {
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [options, setOptions] = React.useState<LinkFieldOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const debouncedSearch = React.useCallback(
    (term: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(term);
      }, 300);
    },
    []
  );

  // Search function with memoization for better performance
  const performSearch = React.useCallback(async (term: string) => {
    if (!isAuthenticated || !isInitialized || !apiKey || !apiSecret || !field.linkTarget) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Build filters array for Frappe API
      const searchFilters: any[] = [];
      
      // Add name filter if there's a search term
      if (term?.trim()) {
        searchFilters.push([field.linkTarget, "name", "like", `%${term.trim()}%`]);
      }
      
      // Add dynamic filters - only include valid values
      Object.entries(filters).forEach(([key, value]) => {
        if (value != null && value !== "") {
          searchFilters.push([field.linkTarget, key, "=", value]);
        }
      });

      // Only skip API call if no filters AND no search term AND we're not on focus/click
      // For focus/click, we want to show all results even without search term
      const isFocusOrClick = !term?.trim(); // No search term means it's likely a focus/click action
      if (searchFilters.length === 0 && !isFocusOrClick) {
        setOptions([]);
        setIsLoading(false);
        return;
      }
      
      // If no filters but it's a focus/click, get all results
      const finalFilters = searchFilters.length > 0 ? searchFilters : [];
      const query = getQuery ? getQuery(filters) : JSON.stringify(finalFilters);

      // Build API params conditionally to avoid empty filter parameters
      const apiParams: any = {
        fields: JSON.stringify(["name"]),
        limit_page_length: "20",
        order_by: "name asc",
      };
      
      if (finalFilters.length > 0) {
        apiParams.filters = query;
      }

      const resp = await axios.get(`${API_BASE_URL}/${field.linkTarget}`, {
        params: apiParams,
        headers: { Authorization: `token ${apiKey}:${apiSecret}` },
        withCredentials: true,
      });

      const raw = (resp.data.data || []) as { name: string }[];
      const options: LinkFieldOption[] = raw.map((r) => ({
        value: r.name,
        label: r.name,
      }));

      setOptions(options);
    } catch (e) {
      console.error("LinkField search error:", e);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isInitialized, apiKey, apiSecret, field.linkTarget, filters, getQuery]);

  // Memoize option filtering to prevent unnecessary recalculations
  const filteredOptions = React.useMemo(() => {
    const currentValue = searchTerm; // Use searchTerm instead of form value for filtering
    // Only filter if there's a search term, otherwise show all options
    if (currentValue?.trim()) {
      return options.filter(option => 
        option.label.toLowerCase().includes(currentValue.toLowerCase())
        // Don't filter out the selected value - let it show in the list
      );
    }
    return options; // Show all options when no search term
  }, [options, searchTerm]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleInputChange = React.useCallback((value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      // Don't clear options when empty, just search without term to get all results
      performSearch('');
    }
  }, [debouncedSearch, performSearch]);

  const handleOptionSelect = React.useCallback((option: LinkFieldOption) => {
    setSearchTerm(option.label);
    setIsOpen(false);
  }, []);

  const handleFocus = React.useCallback(() => {
    setIsOpen(true);
    // Always trigger search on focus to load options
    performSearch(searchTerm);
  }, [performSearch, searchTerm]);

  const handleClick = React.useCallback(() => {
    // Always open dropdown and load options on click
    setIsOpen(true);
    performSearch(searchTerm);
  }, [performSearch, searchTerm]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup search timeout
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Trigger search when filters change - optimized with proper dependencies
  const filtersString = React.useMemo(() => JSON.stringify(filters), [filters]);
  
  React.useEffect(() => {
    // Only trigger search if we have filters or search term
    // Don't trigger on isOpen change to avoid duplicate searches
    if (Object.keys(filters).length > 0 || searchTerm?.trim()) {
      performSearch(searchTerm);
    }
  }, [filtersString, performSearch]); // Use stringified filters for stable dependency

  return (
    <div className={`form-group ${className || ""}`} style={{ overflow: 'visible' }}>
      <label htmlFor={field.name} className="form-label">
        {field.label}
        {field.required ? " *" : ""}
      </label>

      <Controller
        control={control}
        name={field.name}
        defaultValue={field.defaultValue}
        shouldUnregister={false}
        rules={{ required: field.required ? `${field.label} is required` : false }}
        render={({ field: { onChange, onBlur, value } }) => {
          // Initialize searchTerm with current value
          React.useEffect(() => {
            if (value && !searchTerm) {
              setSearchTerm(value);
            }
          }, [value]);

          const handleInputChangeWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            handleInputChange(newValue);
            // Clear the form value if user is typing something new
            if (!options.find(opt => opt.label === newValue)) {
              onChange("");
            }
          };

          const handleFocusWrapper = handleFocus;
          const handleClickWrapper = handleClick;

          const handleOptionSelectWrapper = (option: LinkFieldOption) => {
            handleOptionSelect(option);
            onChange(option.value);
          };

          return (
            <div className="relative" ref={dropdownRef} style={{ overflow: 'visible' }}>
              {/* Input field */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  id={field.name}
                  className={`form-control w-full pr-10 ${error ? "border-red-500" : ""}`}
                  placeholder={field.placeholder || `Select ${field.label}...`}
                  value={searchTerm}
                  onChange={handleInputChangeWrapper}
                  onFocus={handleFocusWrapper}
                  onClick={handleClickWrapper}
                  onBlur={onBlur}
                  onKeyDown={handleKeyDown}
                  disabled={!isAuthenticated || !isInitialized}
                />
              </div>

              {/* Dropdown */}
              {isOpen && (
                <div className="absolute z-[99999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto" style={{ zIndex: 99999 }}>
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => (
                      <div
                        key={option.value}
                        className={`px-3 py-2 cursor-pointer text-sm ${
                          index === highlightedIndex
                            ? "bg-blue-50 text-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleOptionSelectWrapper(option)}
                      >
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-xs text-gray-500">{option.description}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      {isLoading ? "Searching..." : searchTerm ? "No results found" : `Type to search ${field.label}`}
                    </div>
                  )}
                </div>
              )}

                          </div>
          );
        }}
      />

      {error && (
        <div className="text-error" style={{ marginTop: 6, fontSize: "0.85rem" }}>
          {String(error.message)}
        </div>
      )}

      {field.description && (
        <div style={{ marginTop: 6, fontSize: "0.85rem", color: "var(--color-text-muted, #6b7280)" }}>
          {field.description}
        </div>
      )}
    </div>
  );
}