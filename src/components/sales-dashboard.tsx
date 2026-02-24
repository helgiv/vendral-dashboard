/**
 * ============================================================
 * Vendral – Sales & Marketing Dashboard
 * ============================================================
 *
 * A comprehensive sales view for marketing managers with:
 *   1. KPI Tiles: Revenue, ATV, Conversion Rate
 *   2. Dual-axis area chart: Revenue vs. Foot Traffic (24h)
 *   3. Sales Heatmap: Best hours × days of the week
 *   4. Top Products grid with sparklines and stock bars
 *   5. Bottom Products (dead stock identification)
 *
 * RECHARTS:
 * We use Recharts for all chart components. Recharts is a composable
 * charting library built on React components and D3.js.
 * Each chart is built from small building blocks:
 *   <ResponsiveContainer> → auto-sizes the chart
 *   <AreaChart> / <BarChart> → the chart type
 *   <XAxis>, <YAxis> → axes
 *   <Area>, <Bar>, <Line> → data series
 *   <Tooltip> → hover information
 * ============================================================
 */

"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { formatISK, formatCompact } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TransactionTable } from "@/components/transaction-table";
import {
  DollarSign,
  TrendingUp,
  MousePointerClick,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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
// KPI TILES
// ============================================================

/**
 * Large KPI card for the sales section.
 * Shows value, label, and a trend indicator.
 */
function KpiTile({
  label,
  value,
  change,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  /** Percentage change (positive = good) */
  change: number;
  icon: React.ElementType;
  color: string;
}) {
  const isPositive = change >= 0;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            color.includes("cyan") && "bg-cyan-500/15",
            color.includes("emerald") && "bg-emerald-500/15",
            color.includes("amber") && "bg-amber-500/15",
            color.includes("purple") && "bg-purple-500/15"
          )}
        >
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <div className="flex items-center gap-1">
        {isPositive ? (
          <ArrowUp className="w-3 h-3 text-emerald-400" />
        ) : (
          <ArrowDown className="w-3 h-3 text-rose-400" />
        )}
        <span
          className={cn(
            "text-xs font-medium",
            isPositive ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {Math.abs(change)}%
        </span>
        <span className="text-xs text-muted-foreground">vs yesterday</span>
      </div>
    </div>
  );
}

// ============================================================
// CUSTOM TOOLTIP (declared outside components to avoid re-creation during render)
// ============================================================

/**
 * Custom tooltip for the revenue/traffic chart.
 * IMPORTANT: Defined outside of any component to prevent React from
 * recreating it on every render (which would reset its state).
 */
function RevenueTrafficTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-cyan-400">
        Revenue: {formatISK(Math.round(payload[0]?.value || 0))}
      </p>
      <p className="text-emerald-400">
        Foot Traffic: {payload[1]?.value || 0} transactions
      </p>
    </div>
  );
}

// ============================================================
// REVENUE VS TRAFFIC AREA CHART
// ============================================================

function RevenueTrafficChart() {
  const { hourlyData } = useSimulation();

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Revenue vs. Foot Traffic (24h)
        </h3>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          Today
        </Badge>
      </div>

      {/* ResponsiveContainer makes the chart fill its parent */}
      <ResponsiveContainer width="100%" height={250}>
        {/*
          AreaChart is a Recharts component for area/line charts.
          `data` is the array of objects to plot.
          We plot two series on the same chart (dual axis).
        */}
        <AreaChart data={hourlyData}>
          {/* Grid lines */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148,163,184,0.08)"
          />
          {/* X axis: hour labels */}
          <XAxis
            dataKey="hour"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
            tickLine={false}
          />
          {/* Left Y axis: Revenue (ISK) */}
          <YAxis
            yAxisId="revenue"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val: number) => formatCompact(val)}
          />
          {/* Right Y axis: Traffic (transaction count) */}
          <YAxis
            yAxisId="traffic"
            orientation="right"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          {/* Hover tooltip */}
          <RechartsTooltip content={<RevenueTrafficTooltip />} />

          {/* Revenue area (cyan) */}
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#22d3ee"
            fill="url(#revenueGradient)"
            strokeWidth={2}
          />
          {/* Traffic area (emerald) */}
          <Area
            yAxisId="traffic"
            type="monotone"
            dataKey="traffic"
            stroke="#34d399"
            fill="url(#trafficGradient)"
            strokeWidth={2}
          />

          {/* Gradient definitions for the filled areas */}
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// SALES HEATMAP
// ============================================================

function SalesHeatmap() {
  const { salesHeatmap } = useSimulation();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  /**
   * Map a value (0-100) to a color intensity.
   * Low values → dark navy, High values → bright cyan.
   */
  function getHeatColor(value: number): string {
    if (value < 15) return "rgba(15, 23, 42, 0.8)";
    if (value < 30) return "rgba(34, 211, 238, 0.1)";
    if (value < 50) return "rgba(34, 211, 238, 0.25)";
    if (value < 70) return "rgba(34, 211, 238, 0.45)";
    return "rgba(34, 211, 238, 0.7)";
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Sales Heatmap (Hour × Day)
      </h3>

      <div className="overflow-x-auto">
        <div className="min-w-150">
          {/* Hour labels across the top */}
          <div className="flex mb-1 ml-10">
            {hours.filter((_, i) => i % 3 === 0).map(h => (
              <div
                key={h}
                className="text-[9px] text-muted-foreground"
                style={{ width: `${(100 / 24) * 3}%` }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Grid rows (one per day) */}
          {days.map(day => (
            <div key={day} className="flex items-center mb-0.5">
              {/* Day label */}
              <span className="text-[10px] text-muted-foreground w-10 shrink-0">
                {day}
              </span>
              {/* Hour cells */}
              <div className="flex flex-1 gap-0.5">
                {hours.map(hour => {
                  const cell = salesHeatmap.find(
                    c => c.day === day && c.hour === hour
                  );
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="flex-1 h-5 rounded-sm transition-colors"
                      style={{ backgroundColor: getHeatColor(cell?.value ?? 0) }}
                      title={`${day} ${String(hour).padStart(2, "0")}:00 – ${cell?.value ?? 0} sales`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 ml-10">
            <span className="text-[9px] text-muted-foreground">Low</span>
            {["rgba(15,23,42,0.8)", "rgba(34,211,238,0.1)", "rgba(34,211,238,0.25)", "rgba(34,211,238,0.45)", "rgba(34,211,238,0.7)"].map(
              (color, i) => (
                <div
                  key={i}
                  className="w-6 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              )
            )}
            <span className="text-[9px] text-muted-foreground">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TOP/BOTTOM PRODUCTS
// ============================================================

function ProductPerformance() {
  const { topProducts, bottomProducts } = useSimulation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top 5 Products */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Top Selling Products
          </h3>
          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
            Best Performers
          </Badge>
        </div>

        <div className="space-y-2">
          {topProducts.slice(0, 5).map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {/* Rank number */}
              <span className="text-xs font-bold text-cyan-400 w-4">
                #{index + 1}
              </span>
              {/* Product icon */}
              <span className="text-lg">{product.icon}</span>
              {/* Product info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {product.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {/* Stock level bar */}
                  <div className="flex-1">
                    <Progress
                      value={
                        product.maxStock > 0
                          ? (product.stock / product.maxStock) * 100
                          : 0
                      }
                      className="h-1"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {product.stock}/{product.maxStock}
                  </span>
                </div>
              </div>              {/* Revenue */}
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-foreground">
                  {formatISK(product.revenue)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {product.count} sold
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 5 Products (Dead Stock) */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Slow Movers (Dead Stock)
          </h3>
          <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/30">
            Needs Attention
          </Badge>
        </div>

        <div className="space-y-2">
          {bottomProducts.map((product) => (
            <div
              key={product.productId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="text-lg">{product.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {product.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatISK(product.price)} each
                </p>
              </div>              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-rose-400">
                  {product.count} sold
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatISK(product.revenue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN EXPORT
// ============================================================

export function SalesDashboard() {
  const { fleetStats } = useSimulation();

  // Calculate a simulated conversion rate
  // useState with a lazy initializer (function form) runs only once on mount,
  // which avoids calling Math.random() during every render cycle.
  const [conversionRate] = React.useState(() => 68 + Math.random() * 10);

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          label="Gross Revenue (Today)"
          value={formatISK(fleetStats.totalRevenue)}
          change={12.3}
          icon={DollarSign}
          color="text-cyan-400"
        />
        <KpiTile
          label="Month-to-Date"
          value={formatISK(fleetStats.totalRevenue * 24)}
          change={8.7}
          icon={TrendingUp}
          color="text-emerald-400"
        />
        <KpiTile
          label="Avg Transaction Value"
          value={formatISK(fleetStats.atv)}
          change={3.2}
          icon={ShoppingCart}
          color="text-amber-400"
        />
        <KpiTile
          label="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          change={1.5}
          icon={MousePointerClick}
          color="text-purple-400"
        />
      </div>

      {/* Revenue vs Traffic Chart */}
      <RevenueTrafficChart />

      {/* Heatmap */}
      <SalesHeatmap />      {/* Product Performance (Top 5 vs Bottom 5) */}
      <ProductPerformance />

      {/* Transaction Log (TanStack Table) */}
      <TransactionTable />
    </div>
  );
}
