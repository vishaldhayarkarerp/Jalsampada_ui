import * as React from "react";

type DropdownMultiSelectProps = {
    label: string;
    options: string[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    className?: string;
};

export const DropdownMultiSelect: React.FC<DropdownMultiSelectProps> = ({
    label,
    options,
    selectedValues,
    onChange,
    className = "",
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        if (selectedValues.includes(option)) {
            onChange(selectedValues.filter((v) => v !== option));
        } else {
            onChange([...selectedValues, option]);
        }
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
        setIsOpen(false); // Close dropdown
    };

    const filteredOptions = React.useMemo(() => {
        if (!searchTerm.trim()) return options;
        return options.filter((opt) => opt.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [options, searchTerm]);

    const hasValue = selectedValues.length > 0;

    const displayText = !hasValue
        ? `Select ${label}...`
        : selectedValues.length === 1
            ? `1 ${label} selected`
            : `${selectedValues.length} ${label}s selected`;

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <label className="text-sm font-medium mb-1 block">{label}</label>
            <div
                className="form-control w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer flex justify-between items-center focus:outline-none hover:border-gray-400"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={hasValue ? "text-gray-800" : "text-gray-400"}>
                    {displayText}
                </span>
                <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div
                    className="absolute z-50 left-0 right-0 mt-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                    style={{ top: "100%" }} // Reduced gap
                >
                    <div className="p-2">
                        <input
                            type="text"
                            className="w-full border border-gray-200 rounded-md px-2 py-1 mb-2 focus:outline-none focus:ring focus:border-blue-300"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option}
                                onClick={() => toggleOption(option)}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${selectedValues.includes(option) ? "bg-gray-100" : ""
                                    }`}
                            >
                                {option}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">No results found</div>
                    )}

                    {selectedValues.length > 0 && (
                        <div className="flex justify-end p-2 border-t">
                            <button
                                className="btn btn--outline btn--sm text-sm"
                                onClick={handleClearAll}
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};