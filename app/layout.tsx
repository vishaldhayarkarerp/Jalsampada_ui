import type { Metadata } from "next";
import "@/styles/globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThemeProvider } from "@/components/theme-provider";
export const metadata: Metadata = {
  title: "JALSAMPADA",
  description: "Professional water pump and equipment management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
