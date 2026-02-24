/**
 * ============================================================
 * Vendral Dashboard – Main Page
 * ============================================================
 *
 * This is the ENTRY POINT of the dashboard. In Next.js App Router,
 * `page.tsx` in the `app/` folder is the component rendered at "/".
 *
 * ARCHITECTURE:
 * This page is a "shell" that provides the layout structure:
 *   ┌────┬────────────────────────────────────┐
 *   │    │  Stats Ribbon (top)                │
 *   │ S  ├────────────────────────────────────┤
 *   │ I  │                                    │
 *   │ D  │  Main Content Area                 │
 *   │ E  │  (switches based on active tab)    │
 *   │ B  │                                    │
 *   │ A  │                                    │
 *   │ R  │                                    │
 *   └────┴────────────────────────────────────┘
 *
 * The Sidebar controls which "tab" is active, and the main area
 * renders the corresponding component.
 *
 * "use client" is needed because this component uses useState
 * to track which tab is active.
 * ============================================================
 */

"use client";

import React, { useState } from "react";
import { Sidebar, type NavTab } from "@/components/sidebar";
import { StatsRibbon } from "@/components/stats-ribbon";
import { OverviewDashboard } from "@/components/overview-dashboard";
import { DeviceHealth } from "@/components/device-health";
import { SalesDashboard } from "@/components/sales-dashboard";
import { MapView } from "@/components/map-view";
import { PlanogramView } from "@/components/planogram-view";
import { SettingsPage } from "@/components/settings-page";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  // Track which navigation tab is active
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  // Track sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /**
   * Render the main content based on the active tab.
   * Each tab maps to a different dashboard section component.
   */
  function renderContent() {
    switch (activeTab) {
      case "overview":
        return <OverviewDashboard />;
      case "monitoring":
        return <DeviceHealth />;
      case "sales":
        return <SalesDashboard />;
      case "map":
        return <MapView />;
      case "planogram":
        return <PlanogramView />;
      case "settings":
        return <SettingsPage />;
      default:
        return <OverviewDashboard />;
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ---- Sidebar (fixed left) ---- */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* ---- Main Content Area ---- */}
      {/*
        The margin-left shifts based on sidebar width.
        transition-all gives a smooth sliding effect.
      */}
      <main
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-60"
        )}
      >
        {/* Content padding */}
        <div className="p-4 lg:p-6 space-y-4">
          {/* Stats ribbon at the top (visible on all tabs) */}
          <StatsRibbon />

          {/*
            AnimatePresence tracks which component is visible and
            animates the transition between tabs.
            The `mode="wait"` ensures the exiting component finishes
            its animation before the entering one starts.
          */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
