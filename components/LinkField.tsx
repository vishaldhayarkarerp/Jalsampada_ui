"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Controller } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { FormField } from "./DynamicFormComponent";
import { Search, Loader2, X } from "lucide-react";

const API_BASE_URL = "http://103.219.1.138:4412/api/resource";

interface LinkFieldOption {
  value: string;
  label: string;
}

interface LinkFieldProps {
  control: any;
  field: FormField & { defaultValue?: string; linkTarget?: string };
  error?: any;
  className?: string;
  filters?: Record<string, any>;
  getQuery?: (filters: Record<string, any>) => string;
}

export function LinkField({ control, field, error, className, filters = {}, getQuery }: LinkFieldProps) {
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [options, setOptions] = React.useState<LinkFieldOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // --- API Search Logic (Same as New Code) ---
  const performSearch = React.useCallback(async (term: string) => {
    if (!isAuthenticated || !apiKey || !field.linkTarget) return;

    setIsLoading(true);
    try {
      const searchFilters: any[] = [];
      if (term?.trim()) {
        searchFilters.push([field.linkTarget, "name", "like", `%${term.trim()}%`]);
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value != null && value !== "") {
          searchFilters.push([field.linkTarget, key, "=", value]);
        }
      });

      const query = getQuery ? getQuery(filters) : JSON.stringify(searchFilters);

      const resp = await axios.get(`${API_BASE_URL}/${field.linkTarget}`, {
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
      console.error("LinkField search error:", e);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, apiKey, apiSecret, field.linkTarget, filters, getQuery]);

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
    // STYLING: Restored "form-group" instead of Tailwind flex col
    <div className={`form-group ${className || ""}`} style={{ overflow: 'visible' }}>

      {/* STYLING: Restored "form-label" */}
      <label htmlFor={field.name} className="form-label">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>

      <Controller
        control={control}
        name={field.name}
        defaultValue={field.defaultValue || ""}
        rules={{ required: field.required ? `${field.label} is required` : false }}
        render={({ field: { onChange, onBlur, value } }) => {

          // LOGIC: New Code Smart Sync (Prevents typing glitches)
          React.useEffect(() => {
            if (value !== searchTerm && !isOpen) {
              setSearchTerm(value || "");
            }
          }, [value, isOpen]);

          const handleInputChangeWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setSearchTerm(newValue);
            setIsOpen(true);
            updateDropdownPosition();
            debouncedSearch(newValue);

            // Logic: Clear value if typing (Frappe style)
            const exactMatch = options.find(opt => opt.label === newValue);
            onChange(exactMatch ? exactMatch.value : "");
          };

          const handleOptionSelect = (option: LinkFieldOption) => {
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
            <div className="relative" ref={dropdownRef} style={{ overflow: 'visible' }}>
              <div className="relative">
                {/* STYLING: Restored "form-control" and added "pr-10" for icon space */}
                <input
                  ref={inputRef}
                  type="text"
                  id={field.name}
                  className={`form-control w-full pr-10 
                    ${error ? "border-red-500" : ""}
                    ${!isAuthenticated ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  placeholder={field.placeholder || `Select ${field.label}...`}
                  value={searchTerm}
                  onChange={handleInputChangeWrapper}
                  onFocus={handleInputFocus}
                  onBlur={() => {
                    onBlur();
                    // LOGIC: New Code Validation (Revert if invalid)
                    setTimeout(() => {
                      if (!options.find(o => o.label === searchTerm) && searchTerm !== value) {
                        setSearchTerm(value || "");
                      }
                      setIsOpen(false);
                    }, 200);
                  }}
                  disabled={!isAuthenticated || !isInitialized}
                />

                {/* ICONS: Kept from New Code for functionality, but positioned to fit form-control */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
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

              {/* DROPDOWN: Portal-based dropdown that appears outside container */}
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
                        // STYLING: Simplified hover states consistent with standard dropdowns
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50  transition-colors"
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
            </div>
          );
        }}
      />

      {/* STYLING: Restored simple error text style */}
      {error && <div className="text-red-500 text-xs mt-1">{error.message}</div>}
    </div>
  );
}