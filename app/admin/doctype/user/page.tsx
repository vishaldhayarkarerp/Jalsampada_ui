"use client";

import * as React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RecordCard, RecordCardField } from "@/components/RecordCard";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
// Performance Fix: Import lightweight SVGs instead of loading heavy FontAwesome fonts
import {
  Search,
  Plus,
  List,
  LayoutGrid,
  ChevronDown,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Check
} from "lucide-react";

const API_BASE_URL = "http://103.219.3.169:2223/api/resource"; // Fixed double slash

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/* -------------------------------------------------
   1. User Type Definition
   ------------------------------------------------- */
interface User {
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  enabled?: boolean;
  modified?: string;
  creation?: string;
  mobile_no?: string;
  phone?: string;
  user_type?: string;
  user_image?: string;
}

type SortDirection = "asc" | "dsc";
interface SortConfig {
  key: keyof User;
  direction: SortDirection;
}

const SORT_OPTIONS: { label: string; key: keyof User }[] = [
  { label: "Last Updated On", key: "modified" },
  { label: "Email", key: "email" },
  { label: "Full Name", key: "full_name" },
  { label: "User Type", key: "user_type" },
  { label: "Creation Date", key: "creation" },
];

type ViewMode = "grid" | "list";

export default function UserDoctypePage() {
  const router = useRouter();
  const { apiKey, apiSecret, isAuthenticated, isInitialized } = useAuth();
  const doctypeName = "user";

  const [users, setUsers] = React.useState<User[]>([]);
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
     3. FETCH USERS
     ------------------------------------------------- */
  React.useEffect(() => {
    const fetchUsers = async () => {
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
            "name", "email", "first_name", "last_name", "full_name",
            "enabled", "modified", "creation", "mobile_no", "phone",
            "user_type", "user_image"
          ]),
          limit_page_length: "20",
          order_by: "modified desc",
        };

        if (debouncedSearch) {
          params.or_filters = JSON.stringify({
            email: ["like", `%${debouncedSearch}%`],
            full_name: ["like", `%${debouncedSearch}%`],
            first_name: ["like", `%${debouncedSearch}%`],
            last_name: ["like", `%${debouncedSearch}%`]
          });
        }

        const resp = await axios.get(`${API_BASE_URL}/User`, {
          params,
          headers: { Authorization: `token ${apiKey}:${apiSecret}` },
          withCredentials: true,
        });

        const raw = resp.data?.data ?? [];
        const mapped: User[] = raw.map((r: any) => ({
          name: r.name,
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          full_name: r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
          enabled: r.enabled,
          modified: r.modified,
          creation: r.creation,
          mobile_no: r.mobile_no,
          phone: r.phone,
          user_type: r.user_type,
        }));

        setUsers(mapped);
      } catch (err: any) {
        console.error("API error:", err);
        setError(err.response?.status === 403 ? "Unauthorized" : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    if (doctypeName === "user") fetchUsers();
  }, [doctypeName, apiKey, apiSecret, isAuthenticated, isInitialized, debouncedSearch]);

  /* -------------------------------------------------
     4. SORTING LOGIC
     ------------------------------------------------- */
  const sortedUsers = React.useMemo(() => {
    const sortableUsers = [...users];
    sortableUsers.sort((a, b) => {
      const aValue = String(a[sortConfig.key] || '');
      const bValue = String(b[sortConfig.key] || '');
      const compare = aValue.localeCompare(bValue);
      return sortConfig.direction === 'asc' ? compare : -compare;
    });
    return sortableUsers;
  }, [users, sortConfig]);

  const requestSort = (key: keyof User) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'dsc';
    }
    setSortConfig({ key, direction });
  };

  const currentSortLabel = SORT_OPTIONS.find(opt => opt.key === sortConfig.key)?.label || "Sort By";

  const getFieldsForUser = (user: User): RecordCardField[] => {
    const fields: RecordCardField[] = [];
    if (user.email) fields.push({ label: "Email", value: user.email });
    if (user.user_type) fields.push({ label: "User Type", value: user.user_type });
    if (user.mobile_no) fields.push({ label: "Mobile", value: user.mobile_no });
    if (user.enabled !== undefined) fields.push({
      label: "Status",
      value: user.enabled ? "Active" : "Disabled",
      type: user.enabled ? "success" : "danger"
    });
    return fields;
  };

  const title = "User";
  const handleCardClick = (id: string) => {
    router.push(`/admin/doctype/user/${encodeURIComponent(id)}`);
  };

  /* -------------------------------------------------
     6. RENDERERS
     ------------------------------------------------- */
  const renderListView = () => (
    <div className="stock-table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => requestSort('name')}>Username</th>
            <th style={{ cursor: 'pointer' }} onClick={() => requestSort('full_name')}>Full Name</th>
            <th style={{ cursor: 'pointer' }} onClick={() => requestSort('email')}>Email</th>
            <th style={{ cursor: 'pointer' }} onClick={() => requestSort('user_type')}>User Type</th>
            <th style={{ cursor: 'pointer' }} onClick={() => requestSort('enabled')}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.length ? (
            sortedUsers.map((user) => (
              <tr key={user.name} onClick={() => handleCardClick(user.name)} style={{ cursor: "pointer" }}>
                <td>{user.name}</td>
                <td>{user.full_name || "—"}</td>
                <td>{user.email || "—"}</td>
                <td>{user.user_type || "—"}</td>
                <td>
                  <span className={`badge ${user.enabled ? 'badge-success' : 'badge-danger'}`}>
                    {user.enabled ? 'Active' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px" }}>No users found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderGridView = () => (
    <div className="equipment-grid">
      {users.length ? users.map(user => (
        <RecordCard
          key={user.name}
          title={user.full_name || user.name}
          subtitle={user.email}
          fields={getFieldsForUser(user)}
          onClick={() => handleCardClick(user.name)}
        />
      )) : <p style={{ color: "var(--color-text-secondary)" }}>No users found.</p>}
    </div>
  );

  if (loading && users.length === 0) return <div className="module active" style={{ padding: "2rem", textAlign: "center" }}>Loading users...</div>;
  if (error && users.length === 0) return <div className="module active" style={{ padding: "2rem" }}>{error}</div>;

  return (
    <div className="module active">
      <div className="module-header">
        <div>
          <h2>{title}</h2>
          <p>Manage system users and their permissions</p>
        </div>
        <Link href="/admin/doctype/user/new" passHref>
          {/* Replaced icon with SVG (Lucide) for speed */}
          <button className="btn btn--primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add {title}
          </button>
        </Link>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="search-filter-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", gap: "8px" }}>

        {/* Left: Single Omni-Search */}
        <div className="relative" style={{ flexGrow: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by name, email..."
            className="form-control w-full pl-10" // Increased padding for icon
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // Accessibility: Label the input
            aria-label="Search Users"
          />
          {/* Replaced FontAwesome 'i' with Lucide 'Search' component */}
          {/* Contrast Fix: Changed text-gray-400 to text-gray-500 */}
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
        </div>

        {/* Right: Sort Pill + View Switcher */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>

          {/* Sort Pill */}
          <div className="relative" ref={sortMenuRef}>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">

              <button
                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'dsc' : 'asc' }))}
                title={`Sort ${sortConfig.direction === 'asc' ? 'Descending' : 'Ascending'}`}
                // Accessibility: Added aria-label
                aria-label={sortConfig.direction === 'asc' ? "Sort Descending" : "Sort Ascending"}
              >
                {/* SVG Icons */}
                {sortConfig.direction === 'asc' ?
                  <ArrowDownWideNarrow className="w-4 h-4 text-gray-600 dark:text-gray-300" /> :
                  <ArrowUpNarrowWide className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                }
              </button>

              <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1"></div>

              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                // Accessibility: Added aria-label
                aria-label="Open Sort Options"
              >
                {currentSortLabel}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </div>

            {isSortMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="py-1">
                  {/* Contrast Fix: Darker text */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort By</div>
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${sortConfig.key === option.key ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
                      onClick={() => {
                        setSortConfig(prev => ({ ...prev, key: option.key }));
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

          {/* View Switcher */}
          <button
            className="btn btn--outline btn--sm flex items-center justify-center"
            onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
            // Accessibility: Added aria-label
            aria-label={view === "grid" ? "Switch to List View" : "Switch to Grid View"}
          >
            {/* SVG Icons */}
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