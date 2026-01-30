"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { LinkInput } from "@/components/LinkInput";
import { useAuth } from "@/context/AuthContext";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- API Configuration ---
const API_BASE_URL = "http://103.219.1.138:4412/";
const REPORT_API_PATH = "api/method/frappe.desk.query_report.run";
const REPORT_NAME = "Expenditure Details Report";

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
  fiscal_year: string;
  from_date: string;
  to_date: string;
  lift_irrigation_scheme: string;
  phase: string;
  stage: string; // Matches Python: filters.get("stage")
  work_type: string;
  tender_number: string;
};

type ColumnConfig = {
  fieldname: string;
  label: string;
  width: string;
  isHtml?: boolean;
  formatter?: (value: any) => string;
};

// --- Helper Functions ---
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB");
};

// Calculate default dates (Today and Today - 1 Month)
const getToday = () => new Date().toISOString().split('T')[0];
const getOneMonthAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
};

const DEFAULT_COLUMN_WIDTHS: Record<string, string> = {
  tender_number: "150px",
  fiscal_year: "120px",
  lis: "150px",
  stage: "100px",
  work_type: "150px",
  work_subtype: "150px",
  asset_no: "100px",
  bill_amount: "150px",
  bill_number: "120px",
  bill_date: "120px",
  remarks: "300px",
};

export default function ExpenditureDetailsReport() {
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  // --- State ---
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [filteredData, setFilteredData] = useState<ReportData[]>([]);
  const [apiFields, setApiFields] = useState<ReportField[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    fiscal_year: "",
    from_date: getOneMonthAgo(),
    to_date: getToday(),
    lift_irrigation_scheme: "",
    phase: "",
    stage: "",
    work_type: "",
    tender_number: "",
  });

  // --- Configuration ---
  const columnConfig = useMemo((): ColumnConfig[] => {
    return apiFields.map((field) => ({
      fieldname: field.fieldname,
      label: field.label,
      width: DEFAULT_COLUMN_WIDTHS[field.fieldname] || `${field.width || 150}px`,
      formatter: getFieldFormatter(field.fieldtype),
    }));
  }, [apiFields]);

  function getFieldFormatter(fieldType: string): ((value: any) => string) | undefined {
    switch (fieldType) {
      case "Date":
        return formatDate;
      case "Currency":
        return (val) => val ? `₹ ${parseFloat(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "";
      default:
        return undefined;
    }
  }

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.message) {
         setReportData([]);
         setFilteredData([]);
         setApiFields([]);
      } else {
        const columns = result.message.columns || [];
        const data = result.message.result || [];

        setApiFields(columns);
        setReportData(data);
        setFilteredData(data);
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [apiKey, apiSecret, isAuthenticated, isInitialized]);

  // --- Effects ---

  // Auto-refresh when filters change (Debounced 500ms)
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    const timer = setTimeout(() => {
      fetchReportData(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters, fetchReportData, isInitialized, isAuthenticated]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = columnConfig.map(c => c.label).join(",");
    const rows = filteredData.map(row => {
      return columnConfig.map(col => {
        let val = row[col.fieldname];
        val = val === null || val === undefined ? "" : String(val);
        // Clean special chars for CSV
        val = val.replace(/"/g, '""'); 
        if (val.includes(",") || val.includes("\n")) {
             val = `"${val}"`;
        }
        return val;
      }).join(",");
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenditure_details_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (filteredData.length === 0) return;

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const usableWidth = pageWidth - (margin * 2);
      const usableHeight = pageHeight - (margin * 2);

      // Set font
      pdf.setFont('helvetica');

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Expenditure Details Report', pageWidth / 2, 20, { align: 'center' });

      // Summary information
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const summaryY = 30;
      pdf.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`, margin, summaryY);
      pdf.text(`Total Records: ${filteredData.length}`, margin, summaryY + 7);
      
      const filtersApplied = Object.values(filters).filter(v => v).length > 0 
        ? Object.entries(filters).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'None';
      pdf.text(`Filters Applied: ${filtersApplied}`, margin, summaryY + 14);

      // Calculate column widths based on content
      const columnWidths: number[] = [];
      const minColumnWidth = 20;
      const maxColumnWidth = usableWidth / 4;

      columnConfig.forEach(col => {
        let maxWidth = pdf.getStringUnitWidth(col.label) * pdf.getFontSize();
        filteredData.forEach(row => {
          const value = row[col.fieldname];
          const displayValue = value === null || value === undefined || value === '' ? '-' : String(value);
          const textWidth = pdf.getStringUnitWidth(displayValue) * pdf.getFontSize();
          if (textWidth > maxWidth) {
            maxWidth = textWidth;
          }
        });
        let colWidth = maxWidth / pdf.internal.scaleFactor; 
        colWidth = Math.max(minColumnWidth, Math.min(maxColumnWidth, colWidth));
        columnWidths.push(colWidth);
      });

      // Normalize column widths to fit usableWidth
      const totalCalculatedWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      const scaleFactor = usableWidth / totalCalculatedWidth;
      const finalColumnWidths = columnWidths.map(width => width * scaleFactor);

      // Table headers
      let currentY = summaryY + 25;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      
      // Calculate header heights first
      let headerMaxHeight = 0;
      columnConfig.forEach((col, index) => {
        const text = col.label;
        const textLines = pdf.splitTextToSize(text, finalColumnWidths[index] - 4);
        const textHeight = (textLines.length * pdf.getFontSize()) / pdf.internal.scaleFactor;
        if (textHeight > headerMaxHeight) {
          headerMaxHeight = textHeight;
        }
      });

      // Draw header background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY - 5, usableWidth, headerMaxHeight + 5, 'F');

      // Draw headers with text wrapping
      pdf.setTextColor(0, 0, 0);
      columnConfig.forEach((col, index) => {
        const x = margin + finalColumnWidths.slice(0, index).reduce((sum, w) => sum + w, 0);
        const text = col.label;
        const textLines = pdf.splitTextToSize(text, finalColumnWidths[index] - 4);
        const textHeight = (textLines.length * pdf.getFontSize()) / pdf.internal.scaleFactor;
        const yOffset = (headerMaxHeight + 5 - textHeight) / 2;
        pdf.text(textLines, x + 2, currentY - 5 + yOffset);
      });

      // Draw horizontal line after headers
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, currentY + headerMaxHeight + 3, pageWidth - margin, currentY + headerMaxHeight + 3);

      // Table data
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      currentY += headerMaxHeight + 8;

      let rowsOnPage = 0;
      const maxRowsPerPage = Math.floor((usableHeight - currentY) / 10);

      filteredData.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (rowsOnPage >= maxRowsPerPage) {
          pdf.addPage();
          currentY = margin + 10;
          rowsOnPage = 0;

          // Redraw headers on new page
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, currentY - 5, usableWidth, headerMaxHeight + 5, 'F');
          
          pdf.setTextColor(0, 0, 0);
          columnConfig.forEach((col, index) => {
            const x = margin + finalColumnWidths.slice(0, index).reduce((sum, w) => sum + w, 0);
            const text = col.label;
            const textLines = pdf.splitTextToSize(text, finalColumnWidths[index] - 4);
            const textHeight = (textLines.length * pdf.getFontSize()) / pdf.internal.scaleFactor;
            const yOffset = (headerMaxHeight + 5 - textHeight) / 2;
            pdf.text(textLines, x + 2, currentY - 5 + yOffset);
          });

          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, currentY + headerMaxHeight + 3, pageWidth - margin, currentY + headerMaxHeight + 3);
          
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          currentY += headerMaxHeight + 8;
        }

        // Alternating row background
        if (rowIndex % 2 === 1) {
          pdf.setFillColor(249, 249, 249);
          pdf.rect(margin, currentY - 4, usableWidth, 8, 'F');
        }

        // Draw row data with text wrapping
        let rowMaxHeight = 0;

        columnConfig.forEach((col, index) => {
          const x = margin + finalColumnWidths.slice(0, index).reduce((sum, w) => sum + w, 0);
          const value = row[col.fieldname];
          let displayValue = value === null || value === undefined || value === '' ? '-' : String(value);
          
          // Apply formatter if available
          if (col.formatter) {
            displayValue = col.formatter(value);
          }
          
          const textLines = pdf.splitTextToSize(displayValue, finalColumnWidths[index] - 4);
          const textHeight = (textLines.length * pdf.getFontSize()) / pdf.internal.scaleFactor;
          
          if (textHeight > rowMaxHeight) {
            rowMaxHeight = textHeight;
          }
        });

        // Draw all cells with proper height
        pdf.setTextColor(0, 0, 0);
        columnConfig.forEach((col, index) => {
          const x = margin + finalColumnWidths.slice(0, index).reduce((sum, w) => sum + w, 0);
          const value = row[col.fieldname];
          let displayValue = value === null || value === undefined || value === '' ? '-' : String(value);
          
          // Apply formatter if available
          if (col.formatter) {
            displayValue = col.formatter(value);
          }
          
          const textLines = pdf.splitTextToSize(displayValue, finalColumnWidths[index] - 4);
          pdf.text(textLines, x + 2, currentY);
        });

        // Draw cell borders
        pdf.setDrawColor(200, 200, 200);
        let xPos = margin;
        finalColumnWidths.forEach((width, index) => {
          pdf.line(xPos, currentY - 4, xPos, currentY + rowMaxHeight);
          xPos += width;
        });
        pdf.line(pageWidth - margin, currentY - 4, pageWidth - margin, currentY + rowMaxHeight);
        pdf.line(margin, currentY + rowMaxHeight, pageWidth - margin, currentY + rowMaxHeight);

        currentY += rowMaxHeight + 2;
        rowsOnPage++;
      });

      pdf.save(`expenditure_details_report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const totalTableWidth = useMemo(() => {
    return columnConfig.reduce((total, col) => {
      const width = parseInt(col.width.replace("px", ""));
      return total + (isNaN(width) ? 150 : width);
    }, 0);
  }, [columnConfig]);

  const renderCellValue = (row: ReportData, col: ColumnConfig) => {
    const value = row[col.fieldname];

    // Check if this is a Total row (backend sets 'bold' flag)
    const isBoldRow = row.bold === 1;

    if (value === null || value === undefined || value === "") {
      return "-";
    }

    const formattedValue = col.formatter ? col.formatter(value) : String(value);

    if (isBoldRow) {
       return <span className="font-bold text-gray-900">{formattedValue}</span>;
    }

    return formattedValue;
  };

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>Expenditure Details Report</h2>
          <p>Track tender expenditures, bills, and work details.</p>
        </div>
        
        <div className="flex gap-2">
            <button
                className="btn btn--primary"
                onClick={() => fetchReportData(filters)}
                disabled={loading}
            >
                <i className="fas fa-sync-alt"></i> {loading ? "Refreshing..." : "Refresh"}
            </button>
            <div className="export-buttons flex gap-2 ml-2">
                <button className="btn btn--outline" onClick={handleExportCSV}>
                    <i className="fas fa-file-csv"></i> CSV
                </button>
                <button className="btn btn--danger" onClick={handleExportPDF}>
                    <i className="fas fa-file-pdf"></i> PDF
                </button>
            </div>
        </div>
      </div>

      <div className="tab-content active relative">
        {error && (
          <div className="alert alert--danger" style={{ marginBottom: "20px" }}>
            <i className="fas fa-exclamation-triangle"></i> {error}
          </div>
        )}

        {loading && !reportData.length && (
          <div className="alert alert--info" style={{ marginBottom: "20px" }}>
            <i className="fas fa-spinner fa-spin"></i> Loading data...
          </div>
        )}

        {/* Filters Grid with Z-Index Handling */}
        <div className="filters-grid grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 relative z-[60]">
            <div className="form-group z-[70]">
                <label className="text-sm font-medium mb-1 block">Fiscal Year</label>
                <LinkInput
                    value={filters.fiscal_year}
                    onChange={(value) => handleFilterChange("fiscal_year", value)}
                    placeholder="Select Year..."
                    linkTarget="Fiscal Year"
                    className="w-full relative"
                />
            </div>
            <div className="form-group z-[69]">
                <label className="text-sm font-medium mb-1 block">From Date</label>
                <input 
                    type="date" 
                    className="form-control w-full" 
                    value={filters.from_date}
                    onChange={(e) => handleFilterChange("from_date", e.target.value)}
                />
            </div>
            <div className="form-group z-[68]">
                <label className="text-sm font-medium mb-1 block">To Date</label>
                <input 
                    type="date" 
                    className="form-control w-full" 
                    value={filters.to_date}
                    onChange={(e) => handleFilterChange("to_date", e.target.value)}
                />
            </div>

            <div className="form-group z-[67]">
                <label className="text-sm font-medium mb-1 block">Lift Irrigation Scheme</label>
                <LinkInput
                    value={filters.lift_irrigation_scheme}
                    onChange={(value) => handleFilterChange("lift_irrigation_scheme", value)}
                    placeholder="Select LIS..."
                    linkTarget="Lift Irrigation Scheme"
                    className="w-full relative"
                />
            </div>

            <div className="form-group z-[66]">
                <label className="text-sm font-medium mb-1 block">Phase</label>
                <LinkInput
                    value={filters.phase || ""}
                    onChange={(value) => handleFilterChange("phase", value)}
                    placeholder="Select Phase..."
                    linkTarget="Phase"
                    className="w-full relative"
                />
            </div>

            {/* Stage Filter - Dependent on LIS */}
            <div className="form-group z-[65]">
                <label className="text-sm font-medium mb-1 block">Stage</label>
                <LinkInput
                    value={filters.stage}
                    onChange={(value) => handleFilterChange("stage", value)}
                    placeholder="Select Stage..."
                    linkTarget="Stage No"
                    // Pass current LIS filter to constrain the Stage search
                    filters={{ lis_name: filters.lift_irrigation_scheme }} 
                    className="w-full relative"
                />
            </div>

            {/* Tender Number Filter - Dependent on LIS */}
            <div className="form-group z-[64]">
                <label className="text-sm font-medium mb-1 block">Tender Number</label>
                <LinkInput
                    value={filters.tender_number}
                    onChange={(value) => handleFilterChange("tender_number", value)}
                    placeholder="Select Tender..."
                    linkTarget="Project" // Options: "Project" as per JS snippet
                    // Pass current LIS filter to constrain the Tender search
                    filters={{ custom_lis_name: filters.lift_irrigation_scheme }}
                    className="w-full relative"
                />
            </div>

            <div className="form-group z-[63]">
                <label className="text-sm font-medium mb-1 block">Work Type</label>
                <LinkInput
                    value={filters.work_type}
                    onChange={(value) => handleFilterChange("work_type", value)}
                    placeholder="Select Work Type..."
                    linkTarget="Work Type"
                    className="w-full relative"
                />
            </div>
        </div>

        {/* Table Section */}
        <div
          className="stock-table-container border rounded-md relative z-10"
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "70vh",
          }}
        >
          <table
            className="stock-table sticky-header-table"
            style={{ minWidth: `${totalTableWidth}px` }}
          >
            <thead style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "white" }}>
              <tr>
                {columnConfig.map((column, index) => (
                  <th 
                    key={column.fieldname} 
                    style={{ 
                      width: column.width,
                      position: index === 0 ? "sticky" : "static",
                      left: index === 0 ? 0 : "auto",
                      zIndex: index === 0 ? 25 : 20,
                      backgroundColor: index === 0 ? "white" : "inherit"
                    }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(columnConfig.length, 1)}
                    style={{ textAlign: "center", padding: "40px" }}
                  >
                    {loading ? "Fetching records..." : "No records found matching criteria"}
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => {
                  const isBoldRow = row.bold === 1;
                  return (
                    <tr 
                        key={index} 
                        className={isBoldRow ? "bg-gray-50 font-bold" : ""}
                    >
                      {columnConfig.map((column, columnIndex) => (
                        <td 
                          key={`${index}-${column.fieldname}`} 
                          style={{
                            position: columnIndex === 0 ? "sticky" : "static",
                            left: columnIndex === 0 ? 0 : "auto",
                            zIndex: columnIndex === 0 ? 25 : 20,
                            backgroundColor: columnIndex === 0 ? "white" : "inherit"
                          }}
                        >
                          {renderCellValue(row, column)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
