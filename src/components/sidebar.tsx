/**
 * ============================================================
 * Vendral – Sidebar Navigation
 * ============================================================
 *
 * A slim, collapsible sidebar with glassmorphism styling.
 * Uses Lucide icons for a clean, technical look.
 *
 * COLLAPSIBLE BEHAVIOR:
 * - Collapsed: shows only icons (w-16)
 * - Expanded: shows icons + labels (w-60)
 * - Toggle via the chevron button at the bottom
 *
 * PATTERN: "Controlled State" – the parent passes `collapsed`
 * and `onToggle` props so the layout can coordinate the width.
 * ============================================================
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Monitor,
  BarChart3,
  Map,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** The available navigation tabs in the dashboard */
export type NavTab =
  | "overview"
  | "monitoring"
  | "sales"
  | "map"
  | "planogram"
  | "settings";

interface SidebarProps {
  /** Currently active navigation tab */
  activeTab: NavTab;
  /** Callback when user clicks a nav item */
  onTabChange: (tab: NavTab) => void;
  /** Whether the sidebar is in collapsed (icon-only) mode */
  collapsed: boolean;
  /** Toggle collapsed/expanded */
  onToggle: () => void;
}

/**
 * Navigation item definition.
 * Each item has an icon, label, and tab identifier.
 */
const NAV_ITEMS: { tab: NavTab; label: string; icon: React.ElementType }[] = [
  { tab: "overview",    label: "Overview",    icon: LayoutDashboard },
  { tab: "monitoring",  label: "Monitoring",  icon: Monitor },
  { tab: "sales",       label: "Sales",       icon: BarChart3 },
  { tab: "map",         label: "Map",         icon: Map },
  { tab: "planogram",   label: "Planogram",   icon: Package },
  { tab: "settings",    label: "Settings",    icon: Settings },
];

export function Sidebar({ activeTab, onTabChange, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        // Glass sidebar styling from globals.css
        "glass-sidebar flex flex-col h-screen fixed left-0 top-0 z-40",
        // Smooth width transition when collapsing/expanding
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* ---- Logo Area ---- */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50">
        {/* Vendral logo mark: a lightning bolt icon in cyan */}
        <div className="shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
        {/* Brand name – hidden when collapsed */}
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-foreground">
            Vendral
          </span>
        )}
      </div>

      {/* ---- Navigation Items ---- */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ tab, label, icon: Icon }) => {
          const isActive = activeTab === tab;

          // The nav button – wraps in Tooltip when collapsed so
          // hovering still reveals the label
          const button = (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "text-sm font-medium transition-all duration-200",
                // Active state: cyan accent background + text
                isActive
                  ? "bg-cyan-500/15 text-cyan-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-cyan-400")} />
              {/* Label text – hidden when collapsed */}
              {!collapsed && <span>{label}</span>}
            </button>
          );

          // When collapsed, wrap in a Tooltip so the user can still
          // see what each icon means on hover
          if (collapsed) {
            return (
              <Tooltip key={tab}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="bg-popover">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </nav>

      {/* ---- Collapse Toggle Button ---- */}
      <div className="p-2 border-t border-border/50">
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-center p-2 rounded-lg",
            "text-muted-foreground hover:text-foreground hover:bg-white/5",
            "transition-colors duration-200"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {/* Arrow direction changes based on collapsed state */}
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
