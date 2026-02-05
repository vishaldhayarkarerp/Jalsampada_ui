"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { LinkInput } from "@/components/LinkInput";
import { useAuth } from "@/context/AuthContext";
import { useVirtualizer } from '@tanstack/react-virtual';

// --- Constants ---
const API_BASE_URL = "http://103.219.1.138:4412/";
const REPORT_API_PATH = "api/method/frappe.desk.query_report.run";
const REPORT_NAME = "Expenditure Details Report";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 300;
const ROW_HEIGHT = 40;
const VIRTUAL_LIST_HEIGHT = 500;
const VIRTUAL_SCROLL_THRESHOLD = 100;

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
  stage: string;
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

type DragState = {
  isGrabbing: boolean;
  startX: number;
  scrollLeft: number;
};

// --- Helper Functions ---
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB");
};

const formatCurrency = (val: any): string => {
  if (!val) return "";
  return `₹ ${parseFloat(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
};

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

const getFieldFormatter = (fieldType: string): ((value: any) => string) | undefined => {
  switch (fieldType) {
    case "Date":
      return formatDate;
    case "Currency":
      return formatCurrency;
    default:
      return undefined;
  }
};

// --- Memoized Components ---
const CellValue = React.memo(({ row, column }: { row: ReportData; column: ColumnConfig }) => {
  const value = row[column.fieldname];
  const isBoldRow = row.bold === 1;

  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400">-</span>;
  }

  const formattedValue = column.formatter ? column.formatter(value) : String(value);

  return (
    <span className={isBoldRow ? "font-bold text-gray-900" : ""}>
      {formattedValue}
    </span>
  );
});
CellValue.displayName = 'CellValue';

const TableRow = React.memo(({
  row,
  index,
  columnConfig,
}: {
  row: ReportData;
  index: number;
  columnConfig: ColumnConfig[];
}) => {
  const isBoldRow = row.bold === 1;

  return (
    <tr className={`${isBoldRow ? "bg-gray-50 font-bold" : ""} ${index % 2 === 1 ? "bg-gray-25" : ""}`}>
      {columnConfig.map((column, columnIndex) => (
        <td
          key={`${index}-${column.fieldname}`}
          style={{
            position: columnIndex === 0 ? "sticky" : "static",
            left: columnIndex === 0 ? 0 : "auto",
            zIndex: columnIndex === 0 ? 25 : 20,
            backgroundColor: columnIndex === 0 ? (index % 2 === 1 ? "#fafafa" : "white") : "inherit"
          }}
        >
          <CellValue row={row} column={column} />
        </td>
      ))}
    </tr>
  );
});
TableRow.displayName = 'TableRow';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
    <span className="ml-3 text-gray-600">Loading data...</span>
  </div>
);

const EmptyState = ({ loading }: { loading: boolean }) => (
  <div className="text-center py-12">
    <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
    <p className="text-gray-500">
      {loading ? "Fetching records..." : "No records found matching criteria"}
    </p>
  </div>
);

// --- Custom Hooks ---
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// --- Main Component ---
export default function ExpenditureDetailsReport() {
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  // State Management
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [filteredData, setFilteredData] = useState<ReportData[]>([]);
  const [apiFields, setApiFields] = useState<ReportField[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);

  const [filters, setFilters] = useState<Filters>({
    fiscal_year: "",
    from_date: getOneMonthAgo(),
    to_date: getToday(),
    lift_irrigation_scheme: "",
    stage: "",
    work_type: "",
    tender_number: "",
  });

  // Refs
  const tableRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const parentRef = useRef<HTMLDivElement>(null);

  // Drag State
  const [dragState, setDragState] = useState<DragState>({
    isGrabbing: false,
    startX: 0,
    scrollLeft: 0,
  });

  // Debounced filters
  const debouncedFilters = useDebounce(filters, DEBOUNCE_DELAY);

  // Column Configuration
  const columnConfig = useMemo((): ColumnConfig[] => {
    return apiFields.map((field) => ({
      fieldname: field.fieldname,
      label: field.label,
      width: DEFAULT_COLUMN_WIDTHS[field.fieldname] || `${field.width || 150}px`,
      formatter: getFieldFormatter(field.fieldtype),
    }));
  }, [apiFields]);

  // Total table width calculation
  const totalTableWidth = useMemo(() => {
    return columnConfig.reduce((total, col) => {
      const width = parseInt(col.width.replace("px", ""));
      return total + (isNaN(width) ? 150 : width);
    }, 0);
  }, [columnConfig]);

  // Fetch Report Data
  const fetchReportData = useCallback(async (currentFilters: Filters) => {
    if (!isInitialized || !isAuthenticated || !apiKey || !apiSecret) {
      if (isInitialized && !isAuthenticated) {
        setError("Please log in to view this report.");
      }
      return;
    }

    const cacheKey = JSON.stringify(currentFilters);
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();

    // Check cache
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      const result = cached.data;
      processReportData(result);
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

      // Cache the result
      cacheRef.current.set(cacheKey, { data: result, timestamp: now });

      // Clean old cache entries
      cacheRef.current.forEach((value, key) => {
        if (now - value.timestamp > CACHE_DURATION) {
          cacheRef.current.delete(key);
        }
      });

      processReportData(result);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [apiKey, apiSecret, isAuthenticated, isInitialized]);

  const processReportData = (result: any) => {
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
      setCurrentPage(1); // Reset to first page
    }
  };

  // Effects
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    fetchReportData(debouncedFilters);
  }, [debouncedFilters, fetchReportData, isInitialized, isAuthenticated]);

  // Export Functions
  const handleExportCSV = useCallback(() => {
    if (filteredData.length === 0) return;

    const headers = columnConfig.map(c => c.label).join(",");
    const rows = filteredData.map(row => {
      return columnConfig.map(col => {
        let val = row[col.fieldname];
        val = val === null || val === undefined ? "" : String(val);
        val = val.replace(/"/g, '""');
        if (val.includes(",") || val.includes("\n") || val.includes('"')) {
          val = `"${val}"`;
        }
        return val;
      }).join(",");
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenditure_details_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredData, columnConfig]);

  const handleExportPDF = useCallback(async () => {
    if (filteredData.length === 0) return;

    setPdfLoading(true);

    setTimeout(async () => {
      try {
        const { default: jsPDF } = await import('jspdf');

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

        // Title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text('Expenditure Details Report', pageWidth / 2, 20, { align: 'center' });

        // Summary
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const summaryY = 30;
        pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`, margin, summaryY);
        pdf.text(`Total Records: ${filteredData.length}`, margin, summaryY + 7);

        const activeFilters = Object.entries(filters)
          .filter(([_, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        pdf.text(`Filters: ${activeFilters || 'None'}`, margin, summaryY + 14);

        // Calculate column widths
        const columnWidths: number[] = [];
        const minColumnWidth = 20;
        const maxColumnWidth = usableWidth / 4;

        columnConfig.forEach(col => {
          let maxWidth = pdf.getStringUnitWidth(col.label) * pdf.getFontSize();
          const sampleRows = filteredData.slice(0, 100);
          sampleRows.forEach(row => {
            const value = row[col.fieldname];
            const displayValue = value === null || value === undefined || value === '' ? '-' : String(value);
            const textWidth = pdf.getStringUnitWidth(displayValue) * pdf.getFontSize();
            if (textWidth > maxWidth) maxWidth = textWidth;
          });
          let colWidth = maxWidth / pdf.internal.scaleFactor;
          colWidth = Math.max(minColumnWidth, Math.min(maxColumnWidth, colWidth));
          columnWidths.push(colWidth);
        });

        const totalCalculatedWidth = columnWidths.reduce((sum, width) => sum + width, 0);
        const scaleFactor = usableWidth / totalCalculatedWidth;
        const finalColumnWidths = columnWidths.map(width => width * scaleFactor);

        // Headers
        let currentY = summaryY + 25;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');

        let headerMaxHeight = 0;
        columnConfig.forEach((col, index) => {
          const textLines = pdf.splitTextToSize(col.label, finalColumnWidths[index] - 4);
          const textHeight = (textLines.length * pdf.getFontSize()) / pdf.internal.scaleFactor;
          if (textHeight > headerMaxHeight) headerMaxHeight = textHeight;
        });

        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, currentY - 5, usableWidth, headerMaxHeight + 5, 'F');

        pdf.setTextColor(0, 0, 0);
        columnConfig.forEach((col, index) => {
          const x = margin + finalColumnWidths.slice(0, index).reduce((sum, w) => sum + w, 0);
          const textLines = pdf.splitTextToSize(col.label, finalColumnWidths[index] - 4);
          const textHeight = (textLines.length * pdf.getFontSize()) / pdf.internal.scaleFactor;
          const yOffset = (headerMaxHeight + 5 - textHeight) / 2;
          pdf.text(textLines, x + 2, currentY - 5 + yOffset);
        });

        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, currentY + headerMaxHeight + 3, pageWidth - margin, currentY + headerMaxHeight + 3);

        // Data rows
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        currentY += headerMaxHeight + 8;

        let rowsOnPage = 0;
        const maxRowsPerPage = Math.floor((usableHeight - currentY) / 10);

        filteredData.forEach((row, rowIndex) => {
          if (rowsOnPage >= maxRowsPerPage) {
            pdf.addPage();
            currentY = margin + 10;
            rowsOnPage = 0;

            // Redraw headers
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, currentY - 5, usableWidth, headerMaxHeight + 5, 'F');
            pdf.setTextColor(0, 0, 0);
            columnConfig.forEach((col, index) => {
              const x = margin + finalColumnWidths.slice(0, index).reduce((sum, w) => sum + w, 0);
              const textLines = pdf.splitTextToSize(col.label, finalColumnWidths[index] - 4);
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

          if (rowIndex % 2 === 1) {
            pdf.setFillColor(249, 249, 249);
            pdf.rect(margin, currentY - 4, usableWidth, 8, 'F');
          }

          let rowMaxHeight = 0;
          columnConfig.forEach((col, index) => {
            const x = margin + finalColumnWidths.slice(0, index).reduce((sum, w) => sum + w, 0);
            const value = row[col.fieldname];
            let displayValue = value === null || value === undefined || value === '' ? '-' : String(value);

            if (col.formatter) {
              displayValue = col.formatter(value);
            }

            const textLines = pdf.splitTextToSize(displayValue, finalColumnWidths[index] - 4);
            const textHeight = (textLines.length * pdf.getFontSize()) / pdf.internal.scaleFactor;
            if (textHeight > rowMaxHeight) rowMaxHeight = textHeight;
          });

          pdf.setTextColor(0, 0, 0);
          columnConfig.forEach((col, index) => {
            const x = margin + finalColumnWidths.slice(0, index).reduce((sum, w) => sum + w, 0);
            const value = row[col.fieldname];
            let displayValue = value === null || value === undefined || value === '' ? '-' : String(value);

            if (col.formatter) {
              displayValue = col.formatter(value);
            }

            const textLines = pdf.splitTextToSize(displayValue, finalColumnWidths[index] - 4);
            pdf.text(textLines, x + 2, currentY);
          });

          pdf.setDrawColor(200, 200, 200);
          let xPos = margin;
          finalColumnWidths.forEach((width) => {
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
        setError('Failed to generate PDF. Please try again.');
      } finally {
        setPdfLoading(false);
      }
    }, 0);
  }, [filteredData, filters, columnConfig]);

  // Filter Handlers
  const handleFilterChange = useCallback((field: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Drag Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tableRef.current) return;
    setDragState({
      isGrabbing: true,
      startX: e.pageX - tableRef.current.offsetLeft,
      scrollLeft: tableRef.current.scrollLeft,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.isGrabbing || !tableRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableRef.current.offsetLeft;
    const walk = (x - dragState.startX) * 1.5;
    tableRef.current.scrollLeft = dragState.scrollLeft - walk;
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isGrabbing: false }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDragState(prev => ({ ...prev, isGrabbing: false }));
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragState.isGrabbing) {
        setDragState(prev => ({ ...prev, isGrabbing: false }));
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragState.isGrabbing]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // Virtual Scrolling
  const virtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  // Determine rendering strategy
  const useVirtualScroll = filteredData.length > VIRTUAL_SCROLL_THRESHOLD;

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
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i> 
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <div className="export-buttons flex gap-2 ml-2">
            <button 
              className="btn btn--outline" 
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
            >
              <i className="fas fa-file-csv"></i> CSV
            </button>
            <button 
              className="btn btn--danger" 
              onClick={handleExportPDF} 
              disabled={pdfLoading || filteredData.length === 0}
            >
              <i className={`fas ${pdfLoading ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i> 
              {pdfLoading ? 'Generating...' : 'PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="tab-content active relative">
        {error && (
          <div className="alert alert--danger mb-5">
            <i className="fas fa-exclamation-triangle"></i> {error}
          </div>
        )}

        {/* Filters */}
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
            <label className="text-sm font-medium mb-1 block">Stage</label>
            <LinkInput
              value={filters.stage}
              onChange={(value) => handleFilterChange("stage", value)}
              placeholder="Select Stage..."
              linkTarget="Stage No"
              filters={{ lis_name: filters.lift_irrigation_scheme }}
              className="w-full relative"
            />
          </div>

          <div className="form-group z-[65]">
            <label className="text-sm font-medium mb-1 block">Tender Number</label>
            <LinkInput
              value={filters.tender_number}
              onChange={(value) => handleFilterChange("tender_number", value)}
              placeholder="Select Tender..."
              linkTarget="Project"
              filters={{ custom_lis_name: filters.lift_irrigation_scheme }}
              className="w-full relative"
            />
          </div>

          <div className="form-group z-[64]">
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

        {/* Table */}
        {loading && !reportData.length ? (
          <LoadingSpinner />
        ) : filteredData.length === 0 ? (
          <EmptyState loading={loading} />
        ) : (
          <div
            ref={tableRef}
            className="stock-table-container border rounded-md relative z-10"
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: "70vh",
              cursor: dragState.isGrabbing ? "grabbing" : "grab",
              userSelect: dragState.isGrabbing ? "none" : "auto",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {useVirtualScroll ? (
              // Virtual scrolling for large datasets
              <div>
                <table
                  className="stock-table"
                  style={{
                    minWidth: `${totalTableWidth}px`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    backgroundColor: 'white'
                  }}
                >
                  <thead style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#3683f6" }}>
                    <tr>
                      {columnConfig.map((column, index) => (
                        <th
                          key={column.fieldname}
                          style={{
                            width: column.width,
                            position: index === 0 ? "sticky" : "static",
                            left: index === 0 ? 0 : "auto",
                            zIndex: index === 0 ? 40 : 15,
                            backgroundColor: index === 0 ? "#3683f6" : "inherit"
                          }}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                </table>

                <div
                  ref={parentRef}
                  style={{
                    height: `${VIRTUAL_LIST_HEIGHT}px`,
                    width: '100%',
                    overflow: 'auto',
                    minWidth: `${totalTableWidth}px`
                  }}
                >
                  <div
                    style={{
                      height: `${virtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualItem) => (
                      <div
                        key={virtualItem.index}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <table style={{ width: '100%', tableLayout: 'fixed' }}>
                          <tbody>
                            <TableRow
                              row={filteredData[virtualItem.index]}
                              index={virtualItem.index}
                              columnConfig={columnConfig}
                            />
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Standard pagination for smaller datasets
              <div>
                <table
                  className="stock-table sticky-header-table"
                  style={{ minWidth: `${totalTableWidth}px` }}
                >
                  <thead style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#3683f6" }}>
                    <tr>
                      {columnConfig.map((column, index) => (
                        <th
                          key={column.fieldname}
                          style={{
                            width: column.width,
                            position: index === 0 ? "sticky" : "static",
                            left: index === 0 ? 0 : "auto",
                            zIndex: index === 0 ? 40 : 15,
                            backgroundColor: index === 0 ? "#3683f6" : "inherit"
                          }}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, index) => (
                      <TableRow
                        key={index}
                        row={row}
                        index={(currentPage - 1) * itemsPerPage + index}
                        columnConfig={columnConfig}
                      />
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-lg border-t">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                      </span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="form-control form-control-sm"
                        style={{ width: 'auto' }}
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                      </select>
                      <span className="text-sm text-gray-600">per page</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="btn btn--outline btn--sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-chevron-left"></i> Previous
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              className={`btn btn--sm ${currentPage === pageNum
                                ? 'btn--primary'
                                : 'btn--outline'
                              }`}
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        className="btn btn--outline btn--sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}