"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { LinkInput } from "@/components/LinkInput";
import { useAuth } from "@/context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- API Configuration ---
const API_BASE_URL = "http://103.219.3.169:2223/";
const REPORT_API_PATH = "api/method/frappe.desk.query_report.run";
const REPORT_NAME = "Logbook Ledger";

// --- Type Definitions ---
type ReportField = {
  label: string;
  fieldname: string;
  fieldtype: string;
  options?: string;
  width?: number;
};

type ReportData = Record<string, any>;

type Filters = {
  from_date: string;
  to_date: string;
  lis_name: string;
  stage: string;
  asset: string;
  status: string;
};

type ColumnConfig = {
  fieldname: string;
  label: string;
  width: string;
  isHtml?: boolean;
  formatter?: (value: any) => string;
};

// --- Helper Functions ---

const formatDateForAPI = (date: Date | null): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-GB"); 
};

const formatCurrency = (value: number | string): string => {
   if (!value) return "-";
   return `₹ ${parseFloat(String(value)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
};

// NEW: Helper to convert Decimal Hours (3.5) to HH:MM (03:30)
const formatDuration = (value: any): string => {
    if (value === null || value === undefined || value === "") return "00:00";
    
    const num = Number(value);
    if (isNaN(num)) return "00:00";

    // Calculate total minutes to handle rounding correctly
    const totalMinutes = Math.round(num * 60);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Pad with leading zeros (e.g., 3 -> 03)
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');

    return `${hh}:${mm}`;
};

export default function LogBookSheetReportPage() {
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  // --- State ---
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [apiFields, setApiFields] = useState<ReportField[]>([]); 
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    from_date: "",
    to_date: "",
    lis_name: "",
    stage: "",
    asset: "",
    status: "",
  });

  // --- Dynamic Column Configuration ---
  const getFieldFormatter = (fieldtype: string) => {
      switch (fieldtype) {
          case "Datetime": return formatDateTime;
          case "Date": return (val: string) => val ? new Date(val).toLocaleDateString("en-GB") : "-";
          case "Currency": return formatCurrency;
          
          // CHANGE: Map 'Float' to our new formatDuration function
          // This ensures Previous Hours and Running Hours show as HH:MM
          case "Float": return formatDuration; 
          
          default: return undefined;
      }
  };

  const columnConfig = useMemo((): ColumnConfig[] => {
    if (apiFields.length === 0) return [];

    return apiFields.map(field => ({
        fieldname: field.fieldname,
        label: field.label,
        width: field.width ? `${field.width}px` : "150px",
        formatter: getFieldFormatter(field.fieldtype)
    }));
  }, [apiFields]);

  // --- Actions ---
  const fetchReportData = useCallback(async (currentFilters: Filters) => {
    if (!isInitialized) return;
    if (!isAuthenticated || !apiKey || !apiSecret) {
      setError("Please log in to view this report.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanedFilters: Record<string, string> = {};
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          cleanedFilters[key] = value;
        }
      });

      const params = new URLSearchParams({
        report_name: REPORT_NAME,
        filters: JSON.stringify(cleanedFilters)
      });

      const response = await fetch(
        `${API_BASE_URL}${REPORT_API_PATH}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${apiKey}:${apiSecret}`
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();

      if (result.message) {
        setApiFields(result.message.columns || []); 
        setReportData(result.message.result || []);
      } else {
        setApiFields([]);
        setReportData([]);
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [apiKey, apiSecret, isAuthenticated, isInitialized]);

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReportData(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, fetchReportData]);

  // --- Handlers ---
  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const headers = columnConfig.map(c => c.label).join(",");
    const rows = reportData.map(row => {
      return columnConfig.map(col => {
        let val = row[col.fieldname];
        
        // Apply the same formatting logic (HH:MM) to the CSV export
        if (col.formatter) {
             val = col.formatter(val);
        } else {
             val = val === null || val === undefined ? "" : String(val);
        }

        if (val.includes(",") || val.includes("\n") || val.includes('"')) {
            val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",");
    }).join("\n");

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + headers + "\n" + rows);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "logbook_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      if (field === 'lis_name') { newFilters.stage = ""; newFilters.asset = ""; }
      if (field === 'stage') { newFilters.asset = ""; }
      return newFilters;
    });
  };

  const totalTableWidth = useMemo(() => {
    return columnConfig.reduce((total, col) => {
      const width = parseInt(col.width.replace("px", ""));
      return total + (isNaN(width) ? 150 : width);
    }, 0);
  }, [columnConfig]);

  const renderCellValue = (row: ReportData, col: ColumnConfig) => {
    const value = row[col.fieldname];
    // Check if value is null/undefined, but allow 0 to pass through to the formatter
    if (value === null || value === undefined || value === "") return "-";
    if (col.formatter) return col.formatter(value);
    return String(value);
  };

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Logbook Ledger</h2>
          <p>Track pump running hours and operator entries.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn--primary" onClick={() => fetchReportData(filters)} disabled={loading}>
            <i className="fas fa-sync-alt"></i> {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="btn btn--outline" onClick={handleExportCSV}>
             <i className="fas fa-file-csv"></i> CSV
          </button>
        </div>
      </div>

      <div className="tab-content active relative">
        {error && <div className="alert alert--danger mb-5"><i className="fas fa-exclamation-triangle"></i> {error}</div>}
        {loading && !reportData.length && <div className="alert alert--info mb-5"><i className="fas fa-spinner fa-spin"></i> Loading...</div>}

        <div className="filters-grid grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 relative z-[60]">
          
          <div className="form-group z-[150]">
            <label className="text-sm font-medium mb-1 block">From Date</label>
            <DatePicker 
                selected={filters.from_date ? new Date(filters.from_date) : null} 
                onChange={(date: Date | null) => handleFilterChange("from_date", formatDateForAPI(date))} 
                placeholderText="DD/MM/YYYY" 
                dateFormat="dd/MM/yyyy" 
                className="form-control w-full" 
            />
          </div>

          <div className="form-group z-[150]">
            <label className="text-sm font-medium mb-1 block">To Date</label>
            <DatePicker 
                selected={filters.to_date ? new Date(filters.to_date) : null} 
                onChange={(date: Date | null) => handleFilterChange("to_date", formatDateForAPI(date))} 
                placeholderText="DD/MM/YYYY" 
                dateFormat="dd/MM/yyyy" 
                className="form-control w-full" 
            />
          </div>

          <div className="form-group z-[110]">
            <label className="text-sm font-medium mb-1 block">LIS</label>
            <LinkInput value={filters.lis_name} onChange={(v) => handleFilterChange("lis_name", v)} placeholder="Select LIS..." linkTarget="Lift Irrigation Scheme" className="w-full relative" />
          </div>

          <div className="form-group relative z-[110]">
            <label className="text-sm font-medium mb-1 block">Stage</label>
            <LinkInput value={filters.stage} onChange={(v) => handleFilterChange("stage", v)} placeholder="Select Stage..." linkTarget="Stage No" className="w-full" filters={{ lis_name: filters.lis_name || undefined }} />
          </div>

          <div className="form-group z-[50]">
            <label className="text-sm font-medium mb-1 block">Asset Name</label>
            <LinkInput value={filters.asset} onChange={(v) => handleFilterChange("asset", v)} placeholder="Select Asset..." linkTarget="Asset" className="w-full relative" filters={{ custom_lis_name: filters.lis_name || undefined, custom_stage_no: filters.stage || undefined, asset_category: "Pump" }} />
          </div>

          <div className="form-group z-[50]">
            <label className="text-sm font-medium mb-1 block">Status</label>
            <select className="form-control w-full" value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
              <option value="">All</option>
              <option value="Running">Running</option>
              <option value="Stopped">Stopped</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="stock-table-container border rounded-md relative z-10" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh" }}>
          <table className="stock-table sticky-header-table" style={{ minWidth: `${totalTableWidth}px` }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "white" }}>
              <tr>
                {columnConfig.map((column) => (
                  <th key={column.fieldname} style={{ width: column.width }}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr><td colSpan={Math.max(columnConfig.length, 1)} className="text-center p-10">{loading ? "Fetching..." : "No records found"}</td></tr>
              ) : (
                reportData.map((row, index) => (
                  <tr key={index}>
                    {columnConfig.map((column) => (
                      <td key={`${index}-${column.fieldname}`}>{renderCellValue(row, column)}</td>
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