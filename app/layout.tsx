import type { Metadata } from "next";
import ClientLayout from "./ClientLayout";

// This is allowed now because there is no "use client" in this file
export const metadata: Metadata = {
  title: "Jalsampada | Asset Management",
  description: "Water Resource Department ERP System",
  icons: {
    icon: "/favicon.ico", 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientLayout>
            {children}
        </ClientLayout>
      </body>
    </html>
  );
}



// // app/layout.tsx
// "use client";
// import type { Metadata } from "next";
// import "@/styles/globals.css";
// import "@/styles/assets.css";
// import "@fortawesome/fontawesome-free/css/all.min.css";

// import * as React from "react";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { Toaster } from "sonner";
// import { ThemeProvider } from "@/components/theme-provider";
// import { ModeToggle } from "@/components/ModeToggle";
// import { AuthProvider, useAuth } from "@/context/AuthContext";


// export const metadata: Metadata = {
//   title: "Jalsampada | Asset Management",
//   description: "Water Resource Department ERP System",
//   icons: {
//     icon: "/favicon.ico", // Make sure you have a favicon in /public
//   },
// };

// /* -------------------------------------------------------------------------- */
// /*  ROOT LAYOUT – just wraps everything in the providers                     */
// /* -------------------------------------------------------------------------- */
// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <body suppressHydrationWarning>
//         <AuthProvider>
//           <ThemeProvider
//             attribute="data-color-scheme"
//             defaultTheme="system"
//             enableSystem
//             disableTransitionOnChange
//           >
//             <AppContent>{children}</AppContent>
//           </ThemeProvider>
//         </AuthProvider>
//       </body>
//     </html>
//   );
// }

// /* -------------------------------------------------------------------------- */
// /*  APP CONTENT – the “security guard” + UI layout                           */
// /* -------------------------------------------------------------------------- */
// function AppContent({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const router = useRouter();

//   // Get logout function from auth context
//   const { isInitialized, isAuthenticated, currentUser, logout } = useAuth();

//   const [sidebarOpen, setSidebarOpen] = React.useState(true);
//   const isLoginPage = pathname === "/login";

//   /* ------------------- 1. REDIRECT UNAUTHENTICATED USERS ------------------- */
//   React.useEffect(() => {
//     // Wait until we have read localStorage
//     if (isInitialized && !isAuthenticated && !isLoginPage) {
//       router.replace("/login");
//     }
//   }, [isInitialized, isAuthenticated, isLoginPage, router]);

//   /* -------------------------- 2. LOADING SPINNER -------------------------- */
//   if (!isInitialized) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-background">
//         <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   /* --------------------------- 3. LOGIN PAGE ONLY -------------------------- */
//   if (isLoginPage) {
//     return <>{children}</>;
//   }

//   /* --------------------------- 4. PROTECTED UI --------------------------- */
//   return (
//     <div
//       className={`app-container ${!sidebarOpen ? "sidebar-collapsed" : ""}`}
//     >
//       {/* -------------------------- HEADER -------------------------- */}
//       <header className="header">
//         <div className="header-content">
//           <div
//             className="logo-section"
//             onClick={() => setSidebarOpen((v) => !v)}
//             style={{ cursor: "pointer" }}
//           >
//             <i className="fas fa-water"></i>
//             <h1>JALSAMPADA</h1>
//           </div>

//           <div className="user-info">
//             <span>Welcome, {currentUser ?? "Admin"}</span>
//             <i className="fas fa-user-circle"></i>
//             <ModeToggle />
//             {/* Logout button from header removed as requested */}
//           </div>
//         </div>
//       </header>

//       {/* -------------------------- SIDEBAR -------------------------- */}
//       <nav className="sidebar">
//         {/* Main navigation items */}
//         <div className="nav-items">
//           {[
//             { href: "/", icon: "fa-tachometer-alt", label: "Dashboard" },
//             { href: "/assets", icon: "fa-cogs", label: "Assets" },
//             {
//               href: "/lis-management",
//               icon: "fa-cogs",
//               label: "LIS Management",
//             },
//             { href: "/operations", icon: "fa-chart-line", label: "Operations" },
//             {
//               href: "/stock",
//               icon: "fa-boxes",
//               label: "Stock & Maintenance",
//             },
//             { href: "/reports", icon: "fa-file-alt", label: "Reports" },
//             { href: "/tp_reports", icon: "fa-file-alt", label: "TP Reports" },
//             { href: "/test", icon: "fa-vial", label: "Test Module" },
//             { href: "/tender-module", icon: "fa-gavel", label: "Tender Module" },
//           ].map((item) => (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={`nav-item ${
//                 pathname === item.href ||
//                 (item.href !== "/" && pathname.startsWith(item.href))
//                   ? "active"
//                   : ""
//               }`}
//             >
//               <i className={`fas ${item.icon}`}></i>
//               <span>{item.label}</span>
//             </Link>
//           ))}
//         </div>

//         {/* Bottom navigation items */}
//         <div className="mt-auto pb-4"> {/* mt-auto pushes it to the bottom */}
//           <div className="border-t border-gray-200 dark:border-gray-700 mx-4 my-4"></div> {/* Separator */}
          
//           {/* Profile and Notifications removed as requested */}

//           {/* Logout Button with red hover effect */}
//           <button
//             onClick={logout}
//             className="nav-item w-full flex items-center text-left text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-400 transition-colors duration-150"
//           >
//             <i className="fas fa-sign-out-alt"></i>
//             <span>Logout</span>
//           </button>
//         </div>
//       </nav>

//       {/* -------------------------- MAIN CONTENT -------------------------- */}
//       <main className="main-content">{children}</main>

//       {/* -------------------------- FOOTER -------------------------- */}
//       <footer className="footer">
//         <p>© 2025 JALSAMPADA. All rights reserved.</p>
//       </footer>

//       <Toaster richColors position="top-right" />
//     </div>
//   );
// }