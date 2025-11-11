// app/layout.tsx

"use client"; // Required for state and hooks

import "@/styles/globals.css";
import "@/styles/assets.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThemeProvider } from "@/components/theme-provider";

// --- New Imports ---
import * as React from "react";
import Link from "next/link"; // Use Link for navigation
import { usePathname } from "next/navigation"; // Hook to read the current URL
import { ModeToggle } from "@/components/ModeToggle";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // --- State for the sidebar now LIVES in the layout ---
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  // --- Get the current URL path to set the active link ---
  const pathname = usePathname();

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <ThemeProvider
          attribute="data-color-scheme" // Use the attribute we fixed
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* This container wraps your whole app */}
          <div className={`app-container ${!isSidebarOpen ? "sidebar-collapsed" : ""}`}>

            {/* Header: This is now part of the layout */}
            <header className="header">
              <div className="header-content">
                <div
                  className="logo-section"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="fas fa-water"></i>
                  <h1>JALSAMPADA</h1>
                </div>
                <div className="user-info">
                  <span>Welcome, Admin</span>
                  <i className="fas fa-user-circle"></i>
                  <ModeToggle />
                </div>
              </div>
            </header>

            {/* Sidebar: This is now part of the layout */}
            <nav className="sidebar">
              <div className="nav-items">

                {/* We replace <a> tags with <Link> */}
                <Link
                  href="/"
                  className={`nav-item ${pathname === "/" ? "active" : ""}`}
                >
                  <i className="fas fa-tachometer-alt"></i>
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/assets"
                  className={`nav-item ${pathname.startsWith("/assets") ? "active" : ""}`}
                >
                  <i className="fas fa-cogs"></i>
                  <span>Assets</span>
                </Link>

                <Link
                  href="/lis-management"
                  className={`nav-item ${pathname.startsWith("/lis-management") ? "active" : ""}`}
                >
                  <i className="fas fa-cogs"></i>
                  <span>LIS Management</span>
                </Link>

                <Link
                  href="/operations"
                  className={`nav-item ${pathname === "/operations" ? "active" : ""}`}
                >
                  <i className="fas fa-chart-line"></i>
                  <span>Operations</span>
                </Link>

                <Link
                  href="/stock"
                  className={`nav-item ${pathname === "/stock" ? "active" : ""}`}
                >
                  <i className="fas fa-boxes"></i>
                  <span>Stock & Maintenance</span>
                </Link>

                <Link
                  href="/reports"
                  className={`nav-item ${pathname === "/reports" ? "active" : ""}`}
                >
                  <i className="fas fa-file-alt"></i>
                  <span>Reports</span>
                </Link>

                <Link
                  href="/tp_reports"
                  className={`nav-item ${pathname === "/tp_reports" ? "active" : ""}`}
                >
                  <i className="fas fa-file-alt"></i>
                  <span>TP  Reports</span>
                </Link>

              </div>
            </nav>

            {/* Main Content: This is where your pages will be injected */}
            <main className="main-content">
              {children} {/* <-- Your pages render here! */}
            </main>

            {/* Footer: This is now part of the layout */}
            <footer className="footer">
              <p>&copy; 2025 JALSAMPADA. All rights reserved.</p>
            </footer>

          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}