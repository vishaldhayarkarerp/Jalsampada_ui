"use client";

// 1. Move all your imports here
import "@/styles/globals.css";
import "@/styles/assets.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/ModeToggle";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 2. This is the wrapper component
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="data-color-scheme"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AppContent>{children}</AppContent>
      </ThemeProvider>
    </AuthProvider>
  );
}

/* -------------------------------------------------------------------------- */
/* APP CONTENT – Your existing sidebar/header logic stays here               */
/* -------------------------------------------------------------------------- */
function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { isInitialized, isAuthenticated, currentUser, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const isLoginPage = pathname === "/login";

  // Helper function to get initials from full name
  const getInitials = (fullName: string) => {
    if (!fullName) return "U";

    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  /* ------------------- 1. REDIRECT UNAUTHENTICATED USERS ------------------- */
  React.useEffect(() => {
    if (isInitialized && !isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, isLoginPage, router]);

  /* -------------------------- 2. LOADING SPINNER -------------------------- */
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  /* --------------------------- 3. LOGIN PAGE ONLY -------------------------- */
  if (isLoginPage) {
    return <>{children}</>;
  }

  /* --------------------------- 4. PROTECTED UI --------------------------- */
  return (
    <div className={`app-container ${!sidebarOpen ? "sidebar-collapsed" : ""}`}>
      {/* HEADER */}
      <header className="header">
        <div className="header-content">
          <div
            className="logo-section"
            onClick={() => setSidebarOpen((v) => !v)}
            style={{ cursor: "pointer" }}
          >
            <i className="fas fa-water"></i>
            <h1>JALSAMPADA</h1>
          </div>

          <div className="user-info">
            <span>Welcome, {currentUser ?? "Admin"}</span>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="nav-items">
          {[
            { href: "/", icon: "fa-tachometer-alt", label: "Dashboard" },
            { href: "/test", icon: "fa-chart-pie", label: "Asset Overview" },
            { href: "/lis-management", icon: "fa-cogs", label: "Asset" },
            { href: "/tender", icon: "fa-gavel", label: "Tender" },
            { href: "/operations", icon: "fa-chart-line", label: "Operations" },
            { href: "/maintenance", icon: "fa-tools", label: "Maintenance" },
            { href: "/attendance", icon: "fa-user-check", label: "Attendance" },
            // { href: "/stock", icon: "fa-boxes", label: "Stock & Maintenance" },
            { href: "/tp_reports", icon: "fa-file-alt", label: "Reports" },
            { href: "/admin", icon: "fa-user-cog", label: "Admin" }

          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href))
                ? "active"
                : ""
                }`}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-auto pb-2">
          <div className="border-t border-gray-200 dark:border-gray-700 mx-4 my-4"></div>

          {/* Avatar Section - Bottom Corner */}
          <div className="px-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="nav-item cursor-pointer">
                  <i className="fas fa-user"></i>
                  <span>{currentUser || "Admin"}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="bg-white border border-gray-200 rounded-md shadow-lg">
                <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                  <i className="fas fa-user-circle mr-2"></i>
                  Session Default
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="main-content">{children}</main>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2025 JALSAMPADA. All rights reserved.</p>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}