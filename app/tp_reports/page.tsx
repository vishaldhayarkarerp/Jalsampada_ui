
"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { LinkInput } from "@/components/LinkInput";

// API base URL
const API_BASE_URL = "http://103.219.1.138:4412/";

// Type definitions for API response
type AssetReportField = {
    label: string;
    fieldname: string;
    fieldtype: string;
    options?: string;
    width?: number;
};

type AssetReportData = Record<string, any>;

type AssetReportResponse = {
    message: [AssetReportField[], AssetReportData[]];
};

// Filter state type
type Filters = {
    custom_lis_name: string;
    custom_stage_no: string;
    asset_category: string;
    custom_doctype_name: string;
};

// Column configuration
type ColumnConfig = {
    fieldname: string;
    label: string;
    width: string;
    formatter?: (value: any) => string;
};

// Helper functions
const formatDate = (dateString: string | null): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount * 100000);
};

// Default column widths for fields without API width
const DEFAULT_COLUMN_WIDTHS: Record<string, string> = {
    custom_lis_name: "100px",
    custom_stage_no: "400px",
    asset_category: "150px",
    custom_asset_no: "120px",
    custom_doctype_name: "400px",
    make_model: "150px",
    capacity_rating: "150px",
    location: "120px",
    custom_installation_date: "140px",
    custom_condition: "120px",
    custom_last_repair_date: "140px",
    net_purchase_amount: "140px",
    total_expenditure: "140px"
};

// Filter fields configuration
const FILTER_FIELDS = [
    { key: 'custom_lis_name' as const, label: 'LIS Name', linkTarget: 'Lift Irrigation Scheme', placeholder: 'Search LIS Name...' },
    { key: 'custom_stage_no' as const, label: 'Stage No', linkTarget: 'Stage No', placeholder: 'Search Stage No...' },
    { key: 'asset_category' as const, label: 'Asset Category', linkTarget: 'Asset Category', placeholder: 'Search Asset Category...' },
    { key: 'custom_doctype_name' as const, label: 'Asset ID', linkTarget: 'Asset', placeholder: 'Search Asset ID...' }
];

export default function TPReportsPage() {
    // State management
    const [reportData, setReportData] = useState<AssetReportData[]>([]);
    const [filteredData, setFilteredData] = useState<AssetReportData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>({
        custom_lis_name: '',
        custom_stage_no: '',
        asset_category: '',
        custom_doctype_name: ''
    });
    const [uniqueValues, setUniqueValues] = useState<Record<string, string[]>>({});
    const [apiFields, setApiFields] = useState<AssetReportField[]>([]);

    // Memoized column configuration
    const columnConfig = useMemo((): ColumnConfig[] => {
        return apiFields.map(field => ({
            fieldname: field.fieldname,
            label: field.label,
            width: DEFAULT_COLUMN_WIDTHS[field.fieldname] || "150px",
            formatter: getFieldFormatter(field.fieldtype)
        }));
    }, [apiFields]);

    // Get appropriate formatter for field type
    function getFieldFormatter(fieldType: string): ((value: any) => string) | undefined {
        switch (fieldType) {
            case 'Date':
                return formatDate;
            case 'Currency':
                return formatCurrency;
            default:
                return undefined;
        }
    }

    // Fetch data from API
    const fetchReportData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}api/method/quantlis_management.lis_management.report.asset_register_report.asset_register_report.execute`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result: AssetReportResponse = await response.json();
            const [fields, data] = result.message;

            setApiFields(fields);
            setReportData(data);
            setFilteredData(data);

            // Extract unique values for filters
            const uniqueValuesMap: Record<string, string[]> = {};
            FILTER_FIELDS.forEach(({ key }) => {
                const values = [...new Set(data.map(item => item[key]).filter(Boolean))];
                uniqueValuesMap[key] = values;
            });

            setUniqueValues(uniqueValuesMap);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    const applyFilters = useMemo(() => {
        let filtered = reportData;

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                filtered = filtered.filter(item => item[key] === value);
            }
        });

        return filtered;
    }, [reportData, filters]);

    // Handle filter changes
    const handleFilterChange = (field: keyof Filters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Update filtered data when filters change
    useEffect(() => {
        setFilteredData(applyFilters);
    }, [applyFilters]);

    // Fetch data on component mount
    useEffect(() => {
        fetchReportData();
    }, []);

    // Calculate total table width
    const totalTableWidth = useMemo(() => {
        return columnConfig.reduce((total, col) => {
            const width = parseInt(col.width.replace('px', ''));
            return total + width;
        }, 0);
    }, [columnConfig]);

    // Render cell value
    const renderCellValue = (value: any, formatter?: ((value: any) => string) | undefined) => {
        if (value === null || value === undefined || value === '') {
            return '-';
        }

        if (formatter) {
            return formatter(value);
        }

        return String(value);
    };

    return (
        <div className="module active">
            {/* Page Header */}
            <div className="module-header">
                <div>
                    <h2>Asset Register Report</h2>
                </div>
                <button
                    className="btn btn--primary"
                    onClick={fetchReportData}
                    disabled={loading}
                >
                    <i className="fas fa-sync-alt"></i> {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Main Content */}
            <div className="tab-content active">
                {/* Error Message */}
                {error && (
                    <div className="alert alert--danger" style={{ marginBottom: '20px' }}>
                        <i className="fas fa-exclamation-triangle"></i> {error}
                    </div>
                )}

                {/* Loading Message */}
                {loading && (
                    <div className="alert alert--info" style={{ marginBottom: '20px' }}>
                        <i className="fas fa-spinner fa-spin"></i> Loading data...
                    </div>
                )}

                {/* Filters Section */}
                <div className="filters-grid">
                    {FILTER_FIELDS.map(({ key, placeholder, linkTarget }) => (
                        <div key={key} className="form-group">
                            <LinkInput
                                value={filters[key as keyof Filters]}
                                onChange={(value) => handleFilterChange(key as keyof Filters, value)}
                                placeholder={placeholder}
                                linkTarget={linkTarget}
                                className="w-full"
                            />
                        </div>
                    ))}
                </div>

                {/* Report Table */}
                <div className="stock-table-container" style={{
                    overflowX: 'auto',
                    overflowY: 'auto',
                    maxHeight: '70vh'
                }}>
                    <table className="stock-table sticky-header-table" style={{ minWidth: `${totalTableWidth}px` }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white' }}>
                            <tr>
                                {columnConfig.map((column) => (
                                    <th key={column.fieldname} style={{ width: column.width }}>
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columnConfig.length}
                                        style={{ textAlign: 'center', padding: '20px' }}
                                    >
                                        {loading ? 'Loading data...' : 'No records found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((asset: AssetReportData, index: number) => (
                                    <tr key={index}>
                                        {columnConfig.map((column) => (
                                            <td key={column.fieldname}>
                                                {renderCellValue(asset[column.fieldname], column.formatter)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}