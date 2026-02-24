/**
 * ============================================================
 * Vendral Dashboard – Root Layout
 * ============================================================
 *
 * This is the root layout for the entire Next.js application.
 * In Next.js App Router, layout.tsx wraps all pages and persists
 * across navigation (it doesn't re-render when you change pages).
 *
 * KEY CONCEPTS:
 * - We load the "Inter" font (clean, technical look) via next/font
 * - We wrap everything in SimulationProvider so all components
 *   can access the real-time vending machine data
 * - We apply the "dark" class to <html> to activate our dark theme
 * - TooltipProvider is required by shadcn/ui's Tooltip component
 * ============================================================
 */

import type { Metadata } from "next";
// next/font/google automatically optimizes font loading
// It downloads the font at build time and self-hosts it (no external requests)
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ClientProviders } from "@/components/client-providers";

// ---- Font Configuration ----
// Inter is our primary sans-serif font (body text, headings)
const inter = Inter({
  variable: "--font-inter",    // CSS variable name for Tailwind
  subsets: ["latin"],
});

// Geist Mono is our monospace font (terminal logs, code)
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ---- Page Metadata (shown in browser tab, SEO) ----
export const metadata: Metadata = {
  title: "Vendral – Fleet Management Dashboard",
  description:
    "Real-time IoT dashboard for vending machine fleet management. Monitor sales, inventory, and hardware status across your entire network.",
};

/**
 * RootLayout wraps every page in the application.
 * The `children` prop is whatever page component Next.js renders.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // "dark" class activates our custom dark theme CSS variables
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {/*
          ClientProviders is a Client Component that wraps children
          with SimulationProvider and TooltipProvider.
          We separate it because layout.tsx is a Server Component,
          and providers need client-side features (useState, useEffect).
        */}
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
