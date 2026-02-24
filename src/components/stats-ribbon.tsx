/**
 * ============================================================
 * Vendral – Stats Ribbon (Top Bar)
 * ============================================================
 *
 * A horizontal ribbon at the top of the dashboard showing
 * high-level KPIs at a glance:
 *   - Total Revenue (today)
 *   - Active Machines
 *   - Critical Alerts
 *   - Average Transaction Value (ATV)
 *
 * DESIGN PATTERN: "Stat Cards"
 * Each stat is a small glass card with an icon, label, and value.
 * The values come from the simulation context and update in real-time.
 *
 * The ribbon uses CSS Grid with auto-fit so it's responsive —
 * cards wrap to new rows on smaller screens.
 * ============================================================
 */

"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { formatISK } from "@/lib/data";
import {
  DollarSign,
  Monitor,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A single stat tile in the ribbon.
 * Separated as its own component for reusability.
 */
function StatTile({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
  pulse,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  /** Accent color class (e.g., "text-cyan-400") */
  color: string;
  /** Whether to show a pulsing indicator (for alerts) */
  pulse?: boolean;
}) {
  return (
    <div className="glass-card p-4 flex items-center gap-4 min-w-50">
      {/* Icon container with colored background */}
      <div
        className={cn(
          "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          // Use the color prop to tint the background
          color.includes("cyan") && "bg-cyan-500/15",
          color.includes("emerald") && "bg-emerald-500/15",
          color.includes("rose") && "bg-rose-500/15",
          color.includes("amber") && "bg-amber-500/15"
        )}
      >
        <Icon className={cn("w-5 h-5", color)} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Label (muted, small) */}
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {/* Main value (large, bold) */}
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {/* Pulsing dot for alerts */}
          {pulse && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          )}
        </div>
        {/* Optional subtitle */}
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function StatsRibbon() {
  // Pull real-time data from simulation context
  const { fleetStats } = useSimulation();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatTile
        label="Total Revenue (Today)"
        value={formatISK(fleetStats.totalRevenue)}
        subtitle={`${fleetStats.totalTransactions} transactions`}
        icon={DollarSign}
        color="text-cyan-400"
      />
      <StatTile
        label="Active Machines"
        value={`${fleetStats.online + fleetStats.warning}/${fleetStats.total}`}
        subtitle={`${fleetStats.warning} warnings`}
        icon={Monitor}
        color="text-emerald-400"
      />
      <StatTile
        label="Critical Alerts"
        value={String(fleetStats.criticalAlerts + fleetStats.error)}
        subtitle={`${fleetStats.lowStockSlots} low-stock slots`}
        icon={AlertTriangle}
        color="text-rose-400"
        pulse={fleetStats.criticalAlerts > 0}
      />
      <StatTile
        label="Avg Transaction Value"
        value={formatISK(fleetStats.atv)}
        subtitle="Card payments"
        icon={TrendingUp}
        color="text-amber-400"
      />
    </div>
  );
}
