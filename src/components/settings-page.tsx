/**
 * ============================================================
 * Vendral – Settings Page (Placeholder) + TanStack Query Demo
 * ============================================================
 *
 * A placeholder settings page showing system information.
 * Also demonstrates TanStack Query in action — the "Fleet Status"
 * card below uses useFleetStatsQuery() instead of the simulation
 * context. Both approaches work; this lets you compare them.
 *
 * In a real system, this would include:
 *   - User management
 *   - Notification preferences
 *   - API key management
 *   - Firmware update controls
 * ============================================================
 */

"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { useFleetStatsQuery, useMachinesQuery } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Wifi,
  Database,
  Shield,
  Bell,
  Users,
  RefreshCw,
} from "lucide-react";

export function SettingsPage() {
  const { fleetStats } = useSimulation();

  /**
   * TANSTACK QUERY DEMO:
   * These two hooks demonstrate the useQuery pattern.
   * - `data` holds the latest value (undefined until first fetch)
   * - `isLoading` is true on the very first fetch (no cached data yet)
   * - `isFetching` is true during any fetch (including background refetches)
   * - `dataUpdatedAt` tells you when the data was last refreshed
   *
   * Because we set refetchInterval in the hook, these auto-update
   * every few seconds — no manual polling code needed!
   */
  const {
    data: queryStats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    dataUpdatedAt: statsUpdatedAt,
  } = useFleetStatsQuery();

  const {
    data: queryMachines,
    isLoading: machinesLoading,
  } = useMachinesQuery();

  const infoCards = [
    { icon: Monitor, label: "Fleet Size", value: `${fleetStats.total} machines`, desc: "Across 5 locations" },
    { icon: Wifi, label: "Connectivity", value: "98.5% uptime", desc: "Last 30 days" },
    { icon: Database, label: "Data Points", value: "12.4M", desc: "Events processed today" },
    { icon: Shield, label: "Security", value: "TLS 1.3", desc: "End-to-end encrypted" },
    { icon: Bell, label: "Alerts", value: `${fleetStats.criticalAlerts} active`, desc: "Notification rules: 12" },
    { icon: Users, label: "Team", value: "8 users", desc: "3 admins, 5 operators" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">System Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your Vendral fleet configuration, notifications, and team access.
        </p>
      </div>

      {/* ---- TanStack Query Demo Section ---- */}
      <div className="glass-card p-4 border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-cyan-400">
            🔬 TanStack Query Demo
          </h3>
          <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
            Live
          </Badge>
          {statsFetching && (
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          The data below is fetched via <code className="text-cyan-400 font-mono">useFleetStatsQuery()</code> and{" "}
          <code className="text-cyan-400 font-mono">useMachinesQuery()</code> — TanStack Query hooks
          that auto-refresh every 2 seconds with caching, deduplication, and background refetching.
        </p>

        {statsLoading || machinesLoading ? (
          <p className="text-xs text-muted-foreground">Loading via TanStack Query...</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-[10px] text-muted-foreground">Revenue (Query)</p>
              <p className="text-sm font-bold text-foreground">
                {queryStats?.totalRevenue.toLocaleString("is-IS")} ISK
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-[10px] text-muted-foreground">Online Machines</p>
              <p className="text-sm font-bold text-foreground">
                {queryStats?.online}/{queryStats?.total}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-[10px] text-muted-foreground">Machines Array</p>
              <p className="text-sm font-bold text-foreground">
                {queryMachines?.length ?? 0} items
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-[10px] text-muted-foreground">Last Updated</p>
              <p className="text-sm font-bold text-foreground font-mono">
                {statsUpdatedAt
                  ? new Date(statsUpdatedAt).toLocaleTimeString("en-US", { hour12: false })
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {infoCards.map(({ icon: Icon, label, value, desc }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 text-center">
        <p className="text-muted-foreground text-sm">
          ⚙️ Full settings panel coming in v2.0
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          This is a prototype dashboard. Settings configuration will be available in the production release.
        </p>
      </div>
    </div>
  );
}
