/**
 * ============================================================
 * Vendral – System Overview (Default View)
 * ============================================================
 *
 * The default landing page showing a "bento box" grid layout:
 *   ┌─────────────┬───────────┐
 *   │ Fleet Health │ Quick Map │
 *   ├─────────────┤           │
 *   │  Rev Chart  │           │
 *   ├─────────────┼───────────┤
 *   │ Top Products│  Events   │
 *   └─────────────┴───────────┘
 *
 * BENTO BOX LAYOUT:
 * A "bento box" is a grid where cards have different sizes,
 * creating visual hierarchy. Popular items get more space.
 * We use CSS Grid with `grid-template-areas` for this.
 * ============================================================
 */

"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { FleetHealthBar } from "./fleet-health-bar";
import { EventTicker } from "./event-ticker";
import { GeoMap } from "./geo-map";
import { formatISK, formatCompact } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

// ============================================================
// CUSTOM TOOLTIP (declared outside components to avoid re-creation during render)
// ============================================================

/**
 * Recharts custom tooltip component.
 * IMPORTANT: Must be defined outside of any component that uses it.
 * Defining it inside a component causes React to recreate it on every render,
 * which resets its internal state and causes flickering.
 */
function OverviewTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-2 text-xs">
      <p className="text-foreground font-medium">{label}</p>
      <p className="text-cyan-400">{formatISK(Math.round(payload[0]?.value || 0))}</p>
    </div>
  );
}

// ============================================================
// MINI REVENUE CHART (for overview)
// ============================================================

function MiniRevenueChart() {
  const { hourlyData } = useSimulation();

  return (    <div className="glass-card p-4 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Revenue Today</h3>
        <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">
          Live
        </Badge>
      </div>
      {/* min-h-0 lets the flex child shrink below its content height
       * so the chart stays within the grid cell instead of overflowing */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#94a3b8", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val: number) => formatCompact(val)}
            />
            <RechartsTooltip content={<OverviewTooltip />} />
            <defs>
              <linearGradient id="overviewGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#22d3ee"
              fill="url(#overviewGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================================
// QUICK MACHINE LIST (compact overview)
// ============================================================

function QuickMachineList() {
  const { machines } = useSimulation();

  // Sort by status urgency: error > warning > offline > online
  const sorted = [...machines].sort((a, b) => {
    const order = { error: 0, warning: 1, offline: 2, online: 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Machine Status
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1">
        {sorted.map((machine) => (
          <div
            key={machine.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5 transition-colors"
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                machine.status === "online" && "bg-emerald-500",
                machine.status === "warning" && "bg-amber-500",
                machine.status === "error" && "bg-rose-500",
                machine.status === "offline" && "bg-slate-600"
              )}
            />
            <span className="text-[11px] text-foreground flex-1 truncate">
              {machine.id}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatISK(machine.revenueToday)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TOP PRODUCTS COMPACT
// ============================================================

function TopProductsCompact() {
  const { topProducts } = useSimulation();

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Top Sellers
      </h3>
      <div className="flex-1 space-y-2">
        {topProducts.slice(0, 5).map((product, i) => (
          <div key={product.productId} className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 w-4">#{i + 1}</span>
            <span className="text-sm">{product.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-foreground truncate">{product.name}</p>
              <Progress
                value={product.maxStock > 0 ? (product.stock / product.maxStock) * 100 : 0}
                className="h-1 mt-0.5"
              />
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {product.count} sold
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN OVERVIEW EXPORT
// ============================================================

export function OverviewDashboard() {
  return (
    <div className="space-y-4">
      {/* Fleet health bar (full width) */}
      <FleetHealthBar />      {/* Bento box grid
       *
       * WHY THE FIXED HEIGHT?
       * CSS Grid `1fr` rows only divide *available* space. If the grid
       * has no constrained height (i.e. it's in normal document flow),
       * `1fr` resolves to "fit the content" — which means the
       * EventTicker's ever-growing list pushes all rows taller.
       *
       * By giving the grid a definite height (`h-[600px]` on lg+),
       * the two `1fr` rows each get exactly half (300px), and the
       * EventTicker's `overflow-hidden` clips + scrolls internally.
       *
       * On mobile (single column) we use `auto` rows so cards stack
       * naturally, with each card having its own max-height constraint.
       */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-[1fr_1fr] lg:h-150">
        {/* Revenue chart (2 cols wide) */}
        <div className="lg:col-span-2 min-h-60 lg:min-h-0">
          <MiniRevenueChart />
        </div>

        {/* Live events (spans both rows — scrolls inside its fixed bounds) */}
        <div className="lg:row-span-2 max-h-80 lg:max-h-none overflow-hidden">
          <EventTicker />
        </div>

        {/* Map view */}
        <div className="lg:col-span-2 min-h-60 lg:min-h-0">
          <GeoMap />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopProductsCompact />
        <QuickMachineList />
      </div>
    </div>
  );
}
