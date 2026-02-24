/**
 * ============================================================
 * Vendral – Geospatial Map View
 * ============================================================
 *
 * An interactive SVG-based map of Iceland showing vending machine
 * clusters at each location. Color-coded pins indicate status:
 *   🟢 Green = All machines OK
 *   🟡 Yellow = Some warnings/low stock
 *   🔴 Red = Error or offline machines
 *
 * WHY SVG INSTEAD OF MAPBOX:
 * For this prototype, we use an SVG map to avoid needing a Mapbox
 * API key. In production, you'd swap this for a real Mapbox GL
 * or Leaflet map with vector tiles.
 *
 * FRAMER MOTION:
 * Location pins have a subtle hover scale effect and a click
 * handler that drills into the machine list for that location.
 * ============================================================
 */

"use client";

import React, { useState } from "react";
import { useSimulation } from "@/lib/simulation-context";
import { LOCATIONS, type VendingMachine, type Location, formatISK } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  Eye,
  ChevronRight,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/**
 * Determine the "cluster color" for a location based on
 * the statuses of all machines at that location.
 */
function getClusterStatus(machines: VendingMachine[]): "green" | "yellow" | "red" {
  const hasError = machines.some(m => m.status === "error" || m.status === "offline");
  const hasWarning = machines.some(m => m.status === "warning");
  if (hasError) return "red";
  if (hasWarning) return "yellow";
  return "green";
}

/**
 * Convert real lat/lng to SVG coordinates for our simplified map.
 * Iceland roughly spans lat 63.3–66.5 and lng -24.5 to -13.5.
 * We map these ranges onto our SVG viewBox (0-800 x 0-400).
 */
function latLngToSvg(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - (-24.5)) / ((-13.5) - (-24.5))) * 700 + 50;
  // Y is inverted (higher lat = lower Y in SVG)
  const y = ((66.5 - lat) / (66.5 - 63.3)) * 300 + 50;
  return { x, y };
}

/** Status glow colors for the map pins */
const GLOW_COLORS = {
  green: "#34d399",
  yellow: "#fbbf24",
  red: "#fb7185",
};

export function GeoMap() {
  const { machines, selectMachine } = useSimulation();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Group machines by location
  const locationGroups = LOCATIONS.map(location => ({
    location,
    machines: machines.filter(m => m.location.id === location.id),
  }));

  return (
    <div className="glass-card p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Fleet Map</h3>
        <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">
          {LOCATIONS.length} Locations
        </Badge>
      </div>

      <div className="flex-1 flex gap-4">
        {/* ---- SVG Map ---- */}
        <div className="flex-1 relative">
          <svg
            viewBox="0 0 800 400"
            className="w-full h-full"
            style={{ minHeight: "250px" }}
          >
            {/* Background – simplified Iceland shape */}
            <defs>
              {/* Glow filter for pins */}
              {Object.entries(GLOW_COLORS).map(([name, color]) => (
                <filter key={name} id={`glow-${name}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feFlood floodColor={color} floodOpacity="0.6" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            {/* Simplified Iceland outline */}
            <path
              d="M120,180 C150,140 200,120 280,110 C340,105 380,100 430,95
                 C480,92 520,98 560,110 C600,120 640,140 680,160
                 C700,170 710,185 700,200 C690,220 660,240 620,255
                 C580,268 530,275 480,278 C430,280 380,275 330,265
                 C280,256 230,242 190,225 C160,212 130,200 120,180Z"
              fill="rgba(30, 41, 59, 0.4)"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1"
            />

            {/* Grid lines for a techy feel */}
            {[0, 100, 200, 300, 400, 500, 600, 700, 800].map(x => (
              <line key={`vl-${x}`} x1={x} y1="0" x2={x} y2="400"
                    stroke="rgba(148,163,184,0.05)" strokeWidth="0.5" />
            ))}
            {[0, 100, 200, 300, 400].map(y => (
              <line key={`hl-${y}`} x1="0" y1={y} x2="800" y2={y}
                    stroke="rgba(148,163,184,0.05)" strokeWidth="0.5" />
            ))}

            {/* Location clusters */}
            {locationGroups.map(({ location, machines: locMachines }) => {
              const pos = latLngToSvg(location.lat, location.lng);
              const status = getClusterStatus(locMachines);
              const isSelected = selectedLocation?.id === location.id;

              return (
                <g
                  key={location.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedLocation(
                    isSelected ? null : location
                  )}
                >
                  {/* Pulse ring for the cluster */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 28 : 20}
                    fill="none"
                    stroke={GLOW_COLORS[status]}
                    strokeWidth="1"
                    opacity={0.3}
                    className="animate-vendral-pulse"
                  />

                  {/* Main pin circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 14 : 10}
                    fill={GLOW_COLORS[status]}
                    opacity={0.8}
                    filter={`url(#glow-${status})`}
                    className="transition-all duration-300"
                  />

                  {/* Machine count inside the pin */}
                  <text
                    x={pos.x}
                    y={pos.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#0a0f1c"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {locMachines.length}
                  </text>

                  {/* Location label below the pin */}
                  <text
                    x={pos.x}
                    y={pos.y + 26}
                    textAnchor="middle"
                    fill="rgba(148,163,184,0.7)"
                    fontSize="9"
                  >
                    {location.city}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ---- Machine List Panel (shows when a location is selected) ---- */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="w-65 h-full bg-white/5 rounded-lg p-3 flex flex-col">
                {/* Panel header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {selectedLocation.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedLocation.city}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="p-1 rounded hover:bg-white/10 text-muted-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Machine list */}
                <ScrollArea className="flex-1">
                  {machines
                    .filter(m => m.location.id === selectedLocation.id)
                    .map((machine) => (
                      <div
                        key={machine.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors mb-1"
                      >
                        {/* Status glow dot */}
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            machine.status === "online" && "bg-emerald-500 glow-green",
                            machine.status === "warning" && "bg-amber-500 glow-yellow",
                            machine.status === "error" && "bg-rose-500 glow-red",
                            machine.status === "offline" && "bg-slate-600"
                          )}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {machine.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatISK(machine.revenueToday)} today
                          </p>
                        </div>

                        {/* Quick Actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem
                              onClick={() => selectMachine(machine)}
                              className="text-xs"
                            >
                              <Eye className="w-3.5 h-3.5 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs">
                              <RotateCcw className="w-3.5 h-3.5 mr-2" />
                              Remote Reboot
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => selectMachine(machine)}
                              className="text-xs"
                            >
                              <Eye className="w-3.5 h-3.5 mr-2" />
                              View Planogram
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
