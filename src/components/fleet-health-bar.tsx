/**
 * ============================================================
 * Vendral – Fleet Health Bar
 * ============================================================
 *
 * A horizontal bar showing the proportion of machines in each status:
 *   🟢 Online  |  🟡 Warning  |  🔴 Error  |  ⚫ Offline
 *
 * Uses a stacked horizontal bar chart pattern – each segment's
 * width is proportional to the count of machines in that status.
 *
 * This gives operators an instant "at a glance" view of fleet health.
 * ============================================================
 */

"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";

export function FleetHealthBar() {
  const { fleetStats } = useSimulation();
  const { total, online, warning, error, offline } = fleetStats;

  // Calculate percentages for each segment
  const segments = [
    { label: "Online",  count: online,  color: "bg-emerald-500", textColor: "text-emerald-400" },
    { label: "Warning", count: warning, color: "bg-amber-500",   textColor: "text-amber-400" },
    { label: "Error",   count: error,   color: "bg-rose-500",    textColor: "text-rose-400" },
    { label: "Offline", count: offline, color: "bg-slate-600",   textColor: "text-slate-400" },
  ];

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Global Fleet Health
      </h3>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-white/5 mb-3">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-500`}
            // Width is percentage of total machines
            style={{ width: `${(seg.count / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend: status labels with counts */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            {/* Small colored dot */}
            <div className={`w-2 h-2 rounded-full ${seg.color}`} />
            <span className="text-muted-foreground">{seg.label}:</span>
            <span className={`font-semibold ${seg.textColor}`}>{seg.count}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs ml-auto">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold text-foreground">{total}</span>
        </div>
      </div>
    </div>
  );
}
