// "use client";

// import * as React from "react";
// import axios from "axios";
// import { useRouter } from "next/navigation";
// import { RecordCard, RecordCardField } from "@/components/RecordCard";
// import { useAuth } from "@/context/AuthContext";

// // 🟢 New Imports for Bulk Delete & Icons
// import { useSelection } from "@/hooks/useSelection";
// import { BulkActionBar } from "@/components/BulkActionBar";
// import { bulkDeleteRPC } from "@/api/rpc";
// import { toast } from "sonner";
// import { getApiMessages} from "@/lib/utils";
// import { FrappeErrorDisplay } from "@/components/FrappeErrorDisplay";
// import { Plus, List, LayoutGrid } from "lucide-react";

// // 🟢 Changed: Point to Root URL (Required for RPC calls)
// const API_BASE_URL = "http://103.219.1.138:4412";

// // ── Debounce Hook ────────────────────────────────────────────────
// function useDebounce<T>(value: T, delay: number): T {
//   const [debouncedValue, setDebouncedValue] = React.useState(value);

//   React.useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);
//     return () => clearTimeout(handler);
//   }, [value, delay]);

//   return debouncedValue;
// }

// interface PrapanSuchi {
//   name: string;
//   fiscal_year?: string;
//   lis_name?: string;
//   type?: string;
//   amount?: number | string;
// }

// type ViewMode = "grid" | "list";

// export default function DoctypePage() {
//   const router = useRouter();
//   const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
//   const doctypeName = "Parameter Checklist";

//   const [records, setRecords] = React.useState<PrapanSuchi[]>([]);
//   const [view, setView] = React.useState<ViewMode>("list");
//   const [loading, setLoading] = React.useState(true);
//   const [error, setError] = React.useState<string | null>(null);

//   const [searchTerm, setSearchTerm] = React.useState("");
//   const debouncedSearch = useDebounce(searchTerm, 300);

//   // Filter records client-side for instant results
//   const filteredRecords = React.useMemo(() => {
//     if (!debouncedSearch) return records;
//     return records.filter(record =>
//       record.name.toLowerCase().includes(debouncedSearch.toLowerCase())
//     );
//   }, [records, debouncedSearch]);

//   // 🟢 1. Initialize Selection Hook
//   const {
//     selectedIds,
//     handleSelectOne,
//     handleSelectAll,
//     clearSelection,
//     isAllSelected
//   } = useSelection(filteredRecords, "name");

//   const [isDeleting, setIsDeleting] = React.useState(false);

//   /* -------------------------------------------------
//   3. FETCH
//   ------------------------------------------------- */
//   const fetchRecords = React.useCallback(async () => {
//     if (!isInitialized) return;
//     if (!isAuthenticated || !apiKey || !apiSecret) {
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       const params = {
//         fields: JSON.stringify([
//           "name",
//           "fiscal_year",
//           "lis_name",
//           "type",
//           "amount",
//         ]),
//         limit_page_length: "20",
//         order_by: "creation desc",
//       };

//       // 🟢 Append /api/resource manually
//       const resp = await axios.get(`${API_BASE_URL}/api/resource/${doctypeName}`, {
//         params,
//         headers: {
//           Authorization: `token ${apiKey}:${apiSecret}`,
//         },
//         withCredentials: true,
//       });

//       const raw = resp.data?.data ?? [];
//       const mapped: PrapanSuchi[] = raw.map((r: any) => ({
//         name: r.name,
//         fiscal_year: r.fiscal_year ?? "",
//         lis_name: r.lis_name ?? "",
//         type: r.type ?? "",
//         amount: r.amount ?? "",
//       }));

//       setRecords(mapped);
//     } catch (err: any) {
//       console.error("API error:", err);
//       setError(
//         err.response?.status === 403
//           ? "Unauthorized – check API key/secret"
//           : `Failed to fetch ${doctypeName}`
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized]);

//   React.useEffect(() => {
//     fetchRecords();
//   }, [fetchRecords]);

//   // 🟢 2. Handle Bulk Delete
//   const handleBulkDelete = async () => {
//     const count = selectedIds.size;
//     if (!window.confirm(`Are you sure you want to permanently delete ${count} records?`)) {
//       return;
//     }

//     setIsDeleting(true);
//     try {
//       const response = await bulkDeleteRPC(
//         doctypeName,
//         Array.from(selectedIds),
//         API_BASE_URL,
//         apiKey!,
//         apiSecret!
//       );

//       // Debug: Log the actual response to understand its structure
//       console.log("Bulk Delete Response:", response);

//       // Check if the response contains server messages indicating errors
//       // For bulk delete, error messages are directly in response._server_messages
//       if (response._server_messages) {
//         // Parse the server messages to check for errors
//         const serverMessages = JSON.parse(response._server_messages);
//         const errorMessages = serverMessages.map((msgStr: string) => {
//           const parsed = JSON.parse(msgStr);
//           return parsed.message;
//         });

//         if (errorMessages.length > 0) {
//           // Show error messages from server
//           toast.error("Failed to delete records", { 
//             description: <FrappeErrorDisplay messages={errorMessages} />,
//             duration: Infinity
//           });
//           return; // Don't proceed with success handling
//         }
//       }

//       // If no error messages, proceed with success
//       toast.success(`Successfully deleted ${count} records.`);
//       clearSelection();
//       fetchRecords(); // Refresh list
//     } catch (err: any) {
//       console.error("Bulk Delete Error:", err);

//       const messages = getApiMessages(
//         null,
//         err,
//         "Records deleted successfully",
//         "Failed to delete records"
//       );

//       toast.error(messages.message, { description: messages.description, duration: Infinity });
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const title = "Prapan Suchi";

//   const handleCardClick = (id: string) => {
//     router.push(`/tender/doctype/prapan-suchi/${encodeURIComponent(id)}`);
//   };

//   const getFieldsForRecord = (record: PrapanSuchi): RecordCardField[] => {
//     const fields: RecordCardField[] = [];
//     fields.push({ label: "Fiscal Year", value: record.fiscal_year || "-" });
//     fields.push({ label: "LIS Name", value: record.lis_name || "-" });
//     fields.push({ label: "Type", value: record.type || "-" });
//     fields.push({ label: "Amount", value: String(record.amount ?? "-") });
//     return fields;
//   };

//   /* -------------------------------------------------
//   5. LIST VIEW
//   ------------------------------------------------- */
//   const renderListView = () => (
//     <div className="stock-table-container">
//       <table className="stock-table">
//         <thead>
//           <tr>
//             {/* 🟢 Header Checkbox */}
//             <th style={{ width: "40px", textAlign: "center" }}>
//               <input
//                 type="checkbox"
//                 checked={isAllSelected}
//                 onChange={handleSelectAll}
//                 style={{ cursor: "pointer", width: "16px", height: "16px" }}
//               />
//             </th>
//             <th>ID</th>
//             <th>Monitoring Type</th>
//             <th>Asset category</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filteredRecords.length ? (
//             filteredRecords.map((record) => {
//               const isSelected = selectedIds.has(record.name);
//               return (
//                 <tr
//                   key={record.name}
//                   onClick={() => handleCardClick(record.name)}
//                   style={{
//                     cursor: "pointer",
//                     backgroundColor: isSelected ? "var(--color-surface-selected, #f0f9ff)" : undefined
//                   }}
//                 >
//                   {/* 🟢 Row Checkbox */}
//                   <td
//                     style={{ textAlign: "center" }}
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <input
//                       type="checkbox"
//                       checked={isSelected}
//                       onChange={() => handleSelectOne(record.name)}
//                       style={{ cursor: "pointer", width: "16px", height: "16px" }}
//                     />
//                   </td>
//                   <td>{record.name}</td>
//                   <td>{record.fiscal_year}</td>
//                   <td>{record.lis_name}</td>
//                   <td>{record.type}</td>
//                   <td>{record.amount}</td>
//                 </tr>
//               );
//             })
//           ) : (
//             <tr>
//               <td colSpan={6} style={{ textAlign: "center", padding: "32px" }}>
//                 No records found.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );

//   const renderGridView = () => (
//     <div className="equipment-grid">
//       {filteredRecords.length ? (
//         filteredRecords.map((record) => (
//           <RecordCard
//             key={record.name}
//             title={record.name}
//             subtitle={record.lis_name}
//             fields={getFieldsForRecord(record)}
//             onClick={() => handleCardClick(record.name)}
//           />
//         ))
//       ) : (
//         <p style={{ color: "var(--color-text-secondary)" }}>
//           No records found.
//         </p>
//       )}
//     </div>
//   );

//   if (loading) {
//     return (
//       <div
//         className="module active"
//         style={{ padding: "2rem", textAlign: "center" }}
//       >
//         <p>Loading {title}...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div
//         className="module active"
//         style={{ padding: "2rem", textAlign: "center" }}
//       >
//         <p>{error}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="module active">
//       <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <div>
//           <h2>{title}</h2>
//           <p>Manage Parameter Checklist</p>
//         </div>

//         {/* 🟢 3. Header Action Switch */}
//         {selectedIds.size > 0 ? (
//           <BulkActionBar
//             selectedCount={selectedIds.size}
//             onClear={clearSelection}
//             onDelete={handleBulkDelete}
//             isDeleting={isDeleting}
//           />
//         ) : (
//           <button 
//             className="btn btn--primary flex items-center gap-2"
//             onClick={() => router.push('/tender/doctype/prapan-suchi/new')}
//           >
//             <Plus className="w-4 h-4" /> Add {title}
//           </button>
//         )}
//       </div>

//       <div
//         className="search-filter-section"
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginTop: "1rem",
//         }}
//       >
//         <div style={{ display: "flex", gap: "8px" }}>
//           <input
//             type="text"
//             placeholder={`Search ${title}...`}
//             className="form-control"
//             style={{ width: 240 }}
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <div className="view-switcher">
//           <button
//             className="btn btn--outline btn--sm flex items-center justify-center"
//             onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
//             aria-label="Toggle view"
//             title={view === "grid" ? "List view" : "Grid view"}
//           >
//             {view === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
//           </button>
//         </div>
//       </div>

//       <div className="view-container" style={{ marginTop: "0.5rem" }}>
//         {view === "grid" ? renderGridView() : renderListView()}
//       </div>
//     </div>
//   );
// }






"use client";

import * as React from "react";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { BulkActionBar } from "@/components/BulkActionBar";
import { Plus, List, LayoutGrid, Check, ChevronDown, ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { useRouter } from "next/navigation";

/* -------------------------------------------------
   Types
------------------------------------------------- */
interface ParameterChecklist {
    name: string;
    monitoring_type?: string;
    asset_category?: string;
}

type ViewMode = "grid" | "list";

interface Asset {
    name: string;
    location: string;
    custom_lis_name?: string;
    custom_stage_no?: string;
    asset_category?: string;
    status?: string;
    modified?: string;
}

type SortDirection = "asc" | "desc";
interface SortConfig {
    key: keyof Asset;
    direction: SortDirection;
}

/* -------------------------------------------------
   MOCK DATA (UI ONLY)
------------------------------------------------- */
const MOCK_RECORDS: ParameterChecklist[] = [
    {
        name: "PC-0001",
        monitoring_type: "Electrical",
        asset_category: "Pump",
    },
    {
        name: "PC-0002",
        monitoring_type: "Mechanical",
        asset_category: "Motor",
    },
    {
        name: "PC-0003",
        monitoring_type: "Civil",
        asset_category: "Pipeline",
    },
];

const SORT_OPTIONS: { label: string; key: keyof Asset }[] = [
    { label: "Last Updated On", key: "modified" },
    { label: "ID", key: "name" },
    { label: "Status", key: "status" },
    { label: "Asset Category", key: "asset_category" },
    { label: "Location", key: "location" },
    { label: "LIS", key: "custom_lis_name" },
];

export default function DoctypePage() {
    const router = useRouter()
    const title = "Parameter Checklist";

    const [records, setRecords] =
        React.useState<ParameterChecklist[]>(MOCK_RECORDS);

    const [view, setView] = React.useState<ViewMode>("list");
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isSortMenuOpen, setIsSortMenuOpen] = React.useState(false);
    const sortMenuRef = React.useRef<HTMLDivElement>(null);
    const [sortConfig, setSortConfig] = React.useState<SortConfig>({
        key: "modified",
        direction: "desc",
    });

    /* -------------------------------------------------
       Derived state
    ------------------------------------------------- */
    const filteredRecords = React.useMemo(() => {
        if (!searchTerm) return records;
        return records.filter((r) =>
            r.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [records, searchTerm]);

    const isAllSelected =
        filteredRecords.length > 0 &&
        filteredRecords.every((r) => selectedIds.has(r.name));

    /* -------------------------------------------------
       Selection handlers (UI only)
    ------------------------------------------------- */
    const handleSelectOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredRecords.map((r) => r.name)));
        }
    };

    const clearSelection = () => setSelectedIds(new Set());

    /* -------------------------------------------------
       Bulk delete (UI only)
    ------------------------------------------------- */
    const handleBulkDelete = async () => {
        setIsDeleting(true);

        setTimeout(() => {
            setRecords((prev) =>
                prev.filter((r) => !selectedIds.has(r.name))
            );
            clearSelection();
            setIsDeleting(false);
            console.log("Bulk delete completed (UI only)");
        }, 500);
    };

    /* -------------------------------------------------
       Navigation placeholders
    ------------------------------------------------- */
    const handleCardClick = (id: string) => {
        console.log("Navigate to record:", id);
    };

    const handleAddNew = () => {
        console.log("Navigate to create new", title);
    };

    /* -------------------------------------------------
       Helpers
    ------------------------------------------------- */

    const currentSortLabel = SORT_OPTIONS.find((opt) => opt.key === sortConfig.key)?.label || "Sort By";

    const getFieldsForRecord = (
        record: ParameterChecklist
    ): RecordCardField[] => [
            { label: "Monitoring Type", value: record.monitoring_type || "-" },
            { label: "Asset Category", value: record.asset_category || "-" },
        ];

    /* -------------------------------------------------
       Views
    ------------------------------------------------- */
    const renderListView = () => (
        <div className="stock-table-container">
            <table className="stock-table">
                <thead>
                    <tr>
                        <th style={{ width: 40, textAlign: "center" }}>
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th>ID</th>
                        <th>Monitoring Type</th>
                        <th>Asset Category</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRecords.length ? (
                        filteredRecords.map((record) => {
                            const isSelected = selectedIds.has(record.name);
                            return (
                                <tr
                                    key={record.name}
                                    onClick={() => handleCardClick(record.name)}
                                    style={{
                                        cursor: "pointer",
                                        backgroundColor: isSelected
                                            ? "#f0f9ff"
                                            : undefined,
                                    }}
                                >
                                    <td
                                        style={{ textAlign: "center" }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectOne(record.name)}
                                        />
                                    </td>
                                    <td>{record.name}</td>
                                    <td>{record.monitoring_type}</td>
                                    <td>{record.asset_category}</td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                                No records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderGridView = () => (
        <div className="equipment-grid">
            {filteredRecords.length ? (
                filteredRecords.map((record) => (
                    <RecordCard
                        key={record.name}
                        title={record.name}
                        fields={getFieldsForRecord(record)}
                        onClick={() => handleCardClick(record.name)}
                    />
                ))
            ) : (
                <p>No records found.</p>
            )}
        </div>
    );

    /* -------------------------------------------------
       Render
    ------------------------------------------------- */
    return (
        <div className="module active">
            <div
                className="module-header"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <h2>{title}</h2>
                    <p>Manage Parameter Checklist</p>
                </div>

                {selectedIds.size > 0 ? (
                    <BulkActionBar
                        selectedCount={selectedIds.size}
                        onClear={clearSelection}
                        onDelete={handleBulkDelete}
                        isDeleting={isDeleting}
                    />
                ) : (
                    <button
                        className="btn btn--primary flex items-center gap-2"
                        onClick={() => router.push('/maintenance/doctype/parameter-checklist/new')}
                    >
                        <Plus className="w-4 h-4" /> Add {title}
                    </button>
                )}
            </div>

            <div
                className="search-filter-section"
                style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center"
                }}
            >
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: "1" }}>
                    <div style={{ minWidth: "200px" }}>
                        <input
                            type="text"
                            placeholder="Search ID"
                            className="form-control w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search Assets"
                        />
                    </div>
                    <div style={{ minWidth: "200px" }}>
                        <select
                            className="form-control w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Monitoring Type"
                        >
                            <option value="" disabled>
                                Select Monitoring Type
                            </option>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Half-Yearly">Quarterly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>
                    <div style={{ minWidth: "200px" }}>
                        <input
                            type="text"
                            placeholder="Asset category"
                            className="form-control w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search Assets"
                        />
                    </div>


                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginLeft: "auto" }}>
                    <div className="relative">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                            <button
                                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                                onClick={() =>
                                    setSortConfig((prev) => ({
                                        ...prev,
                                        direction: prev.direction === "asc" ? "desc" : "asc",
                                    }))
                                }
                            >
                                {sortConfig.direction === "asc" ? (
                                    <ArrowDownWideNarrow className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                ) : (
                                    <ArrowUpNarrowWide className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                )}
                            </button>
                            <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1"></div>
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
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort By</div>
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
                                            {sortConfig.key === option.key && <Check className="w-4 h-4 text-blue-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        className="btn btn--outline btn--sm flex items-center justify-center"
                        onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
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