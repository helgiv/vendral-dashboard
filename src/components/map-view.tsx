/**
 * ============================================================
 * Vendral – Full Map & Location Filter View
 * ============================================================
 *
 * An expanded map view with:
 *   - Full-width SVG map of Iceland with machine clusters
 *   - Location filter sidebar with search
 *   - Machine detail cards with status glow, quick actions
 *   - Framer Motion transitions for snappy "app-like" feel
 *
 * This component reuses the GeoMap logic but adds a full
 * location filter panel and machine details overlay.
 * ============================================================
 */

"use client";

import React, { useState, useMemo } from "react";
import { useSimulation } from "@/lib/simulation-context";
import {
  LOCATIONS,
  formatISK,
  type VendingMachine,
  type Location,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RotateCcw,
  Eye,
  MoreVertical,
  Search,
  Wifi,
  Thermometer,
  Package,
  X,
} from "lucide-react";

/**
 * Convert lat/lng to SVG coordinates.
 * Same logic as in geo-map.tsx.
 */
function latLngToSvg(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - (-24.5)) / ((-13.5) - (-24.5))) * 900 + 50;
  const y = ((66.5 - lat) / (66.5 - 63.3)) * 400 + 50;
  return { x, y };
}

function getClusterStatus(machines: VendingMachine[]): "green" | "yellow" | "red" {
  const hasError = machines.some(m => m.status === "error" || m.status === "offline");
  const hasWarning = machines.some(m => m.status === "warning");
  if (hasError) return "red";
  if (hasWarning) return "yellow";
  return "green";
}

const GLOW_COLORS = {
  green: "#34d399",
  yellow: "#fbbf24",
  red: "#fb7185",
};

// ============================================================
// MACHINE DETAIL CARD
// ============================================================

function MachineCard({
  machine,
  onViewDetails,
}: {
  machine: VendingMachine;
  onViewDetails: () => void;
}) {
  const emptySlots = machine.planogram.filter(s => s.stock === 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className="p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors border border-transparent hover:border-cyan-500/20"
    >
      <div className="flex items-start gap-3">
        {/* Status glow indicator */}
        <div
          className={cn(
            "w-3 h-3 rounded-full mt-0.5 shrink-0",
            machine.status === "online" && "bg-emerald-500 glow-green",
            machine.status === "warning" && "bg-amber-500 glow-yellow",
            machine.status === "error" && "bg-rose-500 glow-red",
            machine.status === "offline" && "bg-slate-600"
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">{machine.name}</h4>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                machine.status === "online" && "border-emerald-500/50 text-emerald-400",
                machine.status === "warning" && "border-amber-500/50 text-amber-400",
                machine.status === "error" && "border-rose-500/50 text-rose-400",
                machine.status === "offline" && "border-slate-500/50 text-slate-400"
              )}
            >
              {machine.status}
            </Badge>
          </div>

          <p className="text-[10px] text-muted-foreground mt-0.5">
            {machine.id} • {machine.location.city}
          </p>

          {/* Quick metrics row */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Wifi className="w-3 h-3" />
              {machine.hardware.connectivity}%
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Thermometer className="w-3 h-3" />
              {machine.hardware.temperature}°C
            </div>
            {emptySlots > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-rose-400">
                <Package className="w-3 h-3" />
                {emptySlots} empty
              </div>
            )}
            <span className="text-[10px] text-cyan-400 ml-auto">
              {formatISK(machine.revenueToday)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={onViewDetails} className="text-xs">
              <Eye className="w-3.5 h-3.5 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-2" />
              Remote Reboot
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onViewDetails} className="text-xs">
              <Package className="w-3.5 h-3.5 mr-2" />
              View Planogram
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN EXPORT
// ============================================================

export function MapView() {
  const { machines, selectMachine } = useSimulation();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Group machines by location
  const locationGroups = useMemo(
    () =>
      LOCATIONS.map(location => ({
        location,
        machines: machines.filter(m => m.location.id === location.id),
      })),
    [machines]
  );

  // Filter machines based on search and selected location
  const filteredMachines = useMemo(() => {
    let result = machines;

    if (selectedLocation) {
      result = result.filter(m => m.location.id === selectedLocation.id);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        m =>
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.location.city.toLowerCase().includes(q)
      );
    }

    return result;
  }, [machines, selectedLocation, searchQuery]);

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* ---- Left: Machine List Panel ---- */}
      <div className="w-80 shrink-0 glass-card p-4 flex flex-col">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search machines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        {/* Location filter chips */}
        <div className="flex flex-wrap gap-1 mb-3">
          <button
            onClick={() => setSelectedLocation(null)}
            className={cn(
              "text-[10px] px-2 py-1 rounded-full transition-colors",
              !selectedLocation
                ? "bg-cyan-500/20 text-cyan-400"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            All ({machines.length})
          </button>
          {LOCATIONS.map(loc => {
            const count = machines.filter(m => m.location.id === loc.id).length;
            return (
              <button
                key={loc.id}
                onClick={() =>
                  setSelectedLocation(
                    selectedLocation?.id === loc.id ? null : loc
                  )
                }
                className={cn(
                  "text-[10px] px-2 py-1 rounded-full transition-colors",
                  selectedLocation?.id === loc.id
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                {loc.city} ({count})
              </button>
            );
          })}
        </div>

        {/* Machine list */}
        <ScrollArea className="flex-1">
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {filteredMachines.map((machine) => (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  onViewDetails={() => selectMachine(machine)}
                />
              ))}
            </div>
          </AnimatePresence>
        </ScrollArea>

        <div className="pt-2 mt-2 border-t border-border/50 text-[10px] text-muted-foreground">
          Showing {filteredMachines.length} of {machines.length} machines
        </div>
      </div>

      {/* ---- Right: SVG Map ---- */}
      <div className="flex-1 glass-card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Fleet Map – Iceland</h3>
          {selectedLocation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLocation(null)}
              className="text-xs text-muted-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Filter
            </Button>
          )}
        </div>

        <div className="flex-1 relative">
          <svg viewBox="0 0 1000 500" className="w-full h-full">
            <defs>
              {Object.entries(GLOW_COLORS).map(([name, color]) => (
                <filter key={name} id={`map-glow-${name}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feFlood floodColor={color} floodOpacity="0.5" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            {/* Grid */}
            {Array.from({ length: 11 }, (_, i) => i * 100).map(x => (
              <line key={`vl-${x}`} x1={x} y1="0" x2={x} y2="500"
                    stroke="rgba(148,163,184,0.04)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 6 }, (_, i) => i * 100).map(y => (
              <line key={`hl-${y}`} x1="0" y1={y} x2="1000" y2={y}
                    stroke="rgba(148,163,184,0.04)" strokeWidth="0.5" />
            ))}

            {/* Iceland outline (simplified) */}
            <path
              d="M150,220 C180,170 250,140 350,130 C420,125 470,118 540,112
                 C600,108 650,115 710,130 C760,145 810,168 860,195
                 C880,208 895,225 880,245 C865,268 830,290 780,308
                 C730,322 670,330 600,333 C530,335 470,330 410,318
                 C350,308 290,290 240,270 C200,255 165,240 150,220Z"
              fill="rgba(30, 41, 59, 0.3)"
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth="1.5"
            />

            {/* Connection lines between locations */}
            {locationGroups.map(({ location }, i) => {
              if (i === 0) return null;
              const prev = locationGroups[i - 1].location;
              const from = latLngToSvg(prev.lat, prev.lng);
              const to = latLngToSvg(location.lat, location.lng);
              return (
                <line
                  key={`conn-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="rgba(34, 211, 238, 0.08)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Location clusters */}
            {locationGroups.map(({ location, machines: locMachines }) => {
              const pos = latLngToSvg(location.lat, location.lng);
              const status = getClusterStatus(locMachines);
              const isSelected = selectedLocation?.id === location.id;
              const totalRevenue = locMachines.reduce((s, m) => s + m.revenueToday, 0);

              return (
                <g
                  key={location.id}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedLocation(isSelected ? null : location)
                  }
                >
                  {/* Outer ring */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 35 : 25}
                    fill="none"
                    stroke={GLOW_COLORS[status]}
                    strokeWidth={isSelected ? "2" : "1"}
                    opacity={0.3}
                    className="animate-vendral-pulse"
                  />

                  {/* Background circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 20 : 14}
                    fill={GLOW_COLORS[status]}
                    opacity={isSelected ? 0.9 : 0.7}
                    filter={`url(#map-glow-${status})`}
                    className="transition-all duration-300"
                  />

                  {/* Machine count */}
                  <text
                    x={pos.x}
                    y={pos.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#0a0f1c"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {locMachines.length}
                  </text>

                  {/* Location name */}
                  <text
                    x={pos.x}
                    y={pos.y + 32}
                    textAnchor="middle"
                    fill={isSelected ? "#e2e8f0" : "rgba(148,163,184,0.6)"}
                    fontSize="10"
                    fontWeight={isSelected ? "bold" : "normal"}
                  >
                    {location.name}
                  </text>

                  {/* Revenue subtitle */}
                  <text
                    x={pos.x}
                    y={pos.y + 44}
                    textAnchor="middle"
                    fill="rgba(148,163,184,0.4)"
                    fontSize="8"
                  >
                    {formatISK(totalRevenue)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
