"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Search,
  Plus,
  List,
  LayoutGrid,
  ChevronDown,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Check,
  Clock,
} from "lucide-react";

// 🟢 New Imports for Bulk Delete
import { useSelection } from "@/hooks/useSelection";
import { BulkActionBar } from "@/components/BulkActionBar";
import { bulkDeleteRPC } from "@/api/rpc";
import { toast } from "sonner";
import { getApiMessages } from "@/lib/utils";
import { FrappeErrorDisplay } from "@/components/FrappeErrorDisplay";
import { TimeAgo } from "@/components/TimeAgo";

// 🟢 Changed: Point to Root URL
const API_BASE_URL = "http://103.219.3.169:2223";
const IMAGE_BASE_URL = "http://103.219.3.169:2223";

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/* -------------------------------------------------
   1. Item Type Definition
   ------------------------------------------------- */
interface ItemRow {
  name: string;
  item_name?: string;
  item_group?: string;
  status?: string;     // computed from disabled
  modified?: string;
  image?: string;
}

type SortDirection = "asc" | "dsc";
interface SortConfig {
  key: keyof ItemRow;
  direction: SortDirection;
}

const SORT_OPTIONS: { label: string; key: keyof ItemRow }[] = [
  { label: "Last Updated On", key: "modified" },
  { label: "ID", key: "name" },
  { label: "Item Name", key: "item_name" },
  { label: "Item Group", key: "item_group" },
  { label: "Status", key: "status" },
];

type ViewMode = "grid" | "list";

export default function ItemPage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();

  const doctypeName = "Item";

  const [rows, setRows] = React.useState<ItemRow[]>([]);
  const [view, setView] = React.useState<ViewMode>("list");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: "modified",
    direction: "dsc",
  });

  const [isSortMenuOpen, setIsSortMenuOpen] = React.useState(false);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);

  // New Imports for Bulk Delete
  const {
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    isAllSelected
  } = useSelection(rows, "name");

  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* -------------------------------------------------
     3. FETCH ITEMS
     ------------------------------------------------- */
  const fetchItems = React.useCallback(async () => {
    if (!isInitialized) return;
    if (!isAuthenticated || !apiKey || !apiSecret) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: any = {
        fields: JSON.stringify([
          "name",
          "item_name",
          "item_group",
          "disabled",  // use disabled instead of status
          "modified",
          "image",
        ]),
        limit_page_length: "20",
        order_by: "modified desc",
      };

      if (debouncedSearch) {
        params.or_filters = JSON.stringify({
          name: ["like", `%${debouncedSearch}%`],
          item_name: ["like", `%${debouncedSearch}%`],
          item_group: ["like", `%${debouncedSearch}%`],
        });
      }

      // Append /api/resource manually
      const resp = await axios.get(
        `${API_BASE_URL}/api/resource/${encodeURIComponent(doctypeName)}`,
        {
          params,
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        }
      );

      const raw = resp.data?.data ?? [];
      const mapped: ItemRow[] = raw.map((r: any) => ({
        name: r.name,
        item_name: r.item_name,
        item_group: r.item_group,
        status: r.disabled === 1 ? "Disabled" : "Enabled",
        modified: r.modified,
        image: r.image,
      }));

      setRows(mapped);
    } catch (err: any) {
      console.error("API error:", err);
      setError(err.response?.status === 403 ? "Unauthorized" : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized, debouncedSearch]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // New Imports for Bulk Delete
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (!window.confirm(`Are you sure you want to permanently delete ${count} records?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await bulkDeleteRPC(
        doctypeName,
        Array.from(selectedIds),
        API_BASE_URL,
        apiKey!,
        apiSecret!
      );

      // Debug: Log the actual response to understand its structure
      console.log("Bulk Delete Response:", response);

      // Check if the response contains server messages indicating errors
      // For bulk delete, error messages are directly in response._server_messages
      if (response._server_messages) {
        // Parse the server messages to check for errors
        const serverMessages = JSON.parse(response._server_messages);
        const errorMessages = serverMessages.map((msgStr: string) => {
          const parsed = JSON.parse(msgStr);
          return parsed.message;
        });

        if (errorMessages.length > 0) {
          // Show error messages from server
          toast.error("Failed to delete records", {
            description: <FrappeErrorDisplay messages={errorMessages} />,
            duration: Infinity
          });
          return; // Don't proceed with success handling
        }
      }

      // If no error messages, proceed with success
      toast.success(`Successfully deleted ${count} records.`);
      clearSelection();
      fetchItems();
    } catch (err: any) {
      console.error("Bulk Delete Error:", err);

      const messages = getApiMessages(
        null,
        err,
        "Records deleted successfully",
        "Failed to delete records"
      );

      toast.error(messages.message, { description: messages.description, duration: Infinity });
    } finally {
      setIsDeleting(false);
    }
  };

  /* -------------------------------------------------
     4. SORTING LOGIC
     ------------------------------------------------- */
  const sortedRows = React.useMemo(() => {
    const sortable = [...rows];
    sortable.sort((a, b) => {
      const aValue = (a[sortConfig.key] || "") as string;
      const bValue = (b[sortConfig.key] || "") as string;
      const compare = aValue.localeCompare(bValue);
      return sortConfig.direction === "asc" ? compare : -compare;
    });
    return sortable;
  }, [rows, sortConfig]);

  const requestSort = (key: keyof ItemRow) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "dsc";
    }
    setSortConfig({ key, direction });
  };

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.key === sortConfig.key)?.label || "Sort By";

  // Inside app/operations/doctype/item/page.tsx

  const getFieldsForRow = (row: ItemRow): RecordCardField[] => {
    const fields: RecordCardField[] = [];

    // 1. Status (Will now appear in the header automatically)
    if (row.status) {
      fields.push({
        label: "Status",
        value: row.status,
        type: row.status === "Enabled" ? "success" : "danger",
      });
    }

    // 2. Item Group (Will appear as a tag at the bottom)
    if (row.item_group) {
      fields.push({
        label: "Group",
        value: row.item_group,
        type: "default"
      });
    }

    return fields;
  };

  const title = "Item";

  const handleCardClick = (id: string) => {
    router.push(`/operations/doctype/item/${encodeURIComponent(id)}`);
  };

  /* -------------------------------------------------
     6. RENDERERS
     ------------------------------------------------- */

  const renderListView = () => (
    <div
      className="stock-table-container thin-scroll-x"
      style={{ overflowX: "auto" }}
    >
      <table
        className="stock-table"
        style={{ minWidth: "900px", whiteSpace: "nowrap" }}
      >
        <thead>
          <tr>
            {/* Header Checkbox */}
            <th style={{ width: "40px", textAlign: "center" }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                style={{ cursor: "pointer", width: "16px", height: "16px" }}
              />
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 160 }}
              onClick={() => requestSort("name")}
            >
              ID
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 220 }}
              onClick={() => requestSort("item_name")}
            >
              Item Name
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 180 }}
              onClick={() => requestSort("item_group")}
            >
              Item Group
            </th>
            <th
              style={{ cursor: "pointer", minWidth: 140 }}
              onClick={() => requestSort("status")}
            >
              Status
            </th>
            <th className="text-right pr-4" style={{ width: "100px" }}>
              <Clock className="w-4 h-4 mr-1 float-right" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.length ? (
            sortedRows.map((row) => {
              const isSelected = selectedIds.has(row.name);
              return (
                <tr
                  key={row.name}
                  onClick={() => handleCardClick(row.name)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--color-surface-selected, #f0f9ff)" : undefined
                  }}
                >
                  {/* 🟢 Row Checkbox */}
                  <td
                    style={{ textAlign: "center" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(row.name)}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                  </td>
                  <td style={{ minWidth: 160 }}>{row.name}</td>
                  <td style={{ minWidth: 220 }}>{row.item_name || "—"}</td>
                  <td style={{ minWidth: 180 }}>{row.item_group || "—"}</td>
                  <td style={{ minWidth: 140 }}>{row.status || "—"}</td>
                  <td className="text-right pr-4">
                    <TimeAgo date={row.modified} />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderGridView = () => (
    // 'gap-6' gives nice breathing room. 'p-1' prevents shadow clipping.
    <div className="equipment-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1">
      {rows.length ? (
        rows.map((row) => (
          <RecordCard
            key={row.name}
            title={row.item_name || row.name}
            subtitle={row.name} // The ID goes here
            image={row.image ? `${IMAGE_BASE_URL}${row.image}` : undefined}
            fields={getFieldsForRow(row)}
            onClick={() => handleCardClick(row.name)}
          />
        ))
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-zinc-400">
          <div className="bg-zinc-100 rounded-full p-4 mb-3">
            <LayoutGrid className="w-8 h-8 opacity-20" />
          </div>
          <p>No items found.</p>
        </div>
      )}
    </div>
  );

  if (loading && rows.length === 0)
    return (
      <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>
        Loading items...
      </div>
    );

  if (error && rows.length === 0)
    return (
      <div className="module active" style={{ padding: "2rem" }}>
        {error}
      </div>
    );

  return (
    <div className="module active">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>{title}</h2>
          <p>Items with group and enabled/disabled status</p>
        </div>

        {/* 🟢 3. Header Action Switch */}
        {selectedIds.size > 0 ? (
          <BulkActionBar
            selectedCount={selectedIds.size}
            onClear={clearSelection}
            onDelete={handleBulkDelete}
            isDeleting={isDeleting}
          />
        ) : (
          <Link href="/operations/doctype/item/new" passHref>
            <button className="btn btn--primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add {title}
            </button>
          </Link>
        )}
      </div>

      {/* --- FILTER BAR --- */}
      <div
        className="search-filter-section"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "1rem",
          gap: "8px",
        }}
      >
        {/* Left: Single Omni-Search */}
        <div className="relative" style={{ flexGrow: 1, maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="Search ID, Item Name, Group..."
            className="form-control w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search Item"
          />

        </div>

        {/* Right: Sort Pill + View Switcher */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Sort Pill */}
          <div className="relative" ref={sortMenuRef}>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button
                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() =>
                  setSortConfig((prev) => ({
                    ...prev,
                    direction: prev.direction === "asc" ? "dsc" : "asc",
                  }))
                }
                title={`Sort ${sortConfig.direction === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortConfig.direction === "asc" ? (
                  <ArrowDownWideNarrow className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <ArrowUpNarrowWide className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>

              <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1" />

              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              >
                {currentSortLabel}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </div>

            {isSortMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sort By
                  </div>
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${sortConfig.key === option.key
                          ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 font-medium"
                          : "text-gray-700 dark:text-gray-200"
                        }`}
                      onClick={() => {
                        setSortConfig((prev) => ({ ...prev, key: option.key }));
                        setIsSortMenuOpen(false);
                      }}
                    >
                      {option.label}
                      {sortConfig.key === option.key && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Switcher */}
          <button
            className="btn btn--outline btn--sm flex items-center justify-center"
            onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
            aria-label={view === "grid" ? "Switch to List View" : "Switch to Grid View"}
          >
            {view === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="view-container" style={{ marginTop: "0.5rem" }}>
        {view === "grid" ? renderGridView() : renderListView()}
      </div>
    </div>
  );
}