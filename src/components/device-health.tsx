/**
 * ============================================================
 * Vendral – Device Health Monitor
 * ============================================================
 *
 * A detailed drill-down view for a single vending machine.
 * Shows:
 *   1. 3D-style visualization of the kiosk (SVG)
 *   2. Hardware Stack: Bill Validator, Temperature, Connectivity, etc.
 *   3. Real-time Terminal Log with monospace scrolling events
 *
 * DRILL-DOWN PATTERN:
 * The user selects a machine (from the overview or map), and this
 * component shows its details. If no machine is selected, it shows
 * a machine picker grid.
 * ============================================================
 */

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSimulation } from "@/lib/simulation-context";
import { formatISK, type VendingMachine } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Thermometer,
  Wifi,
  Cpu,
  MonitorSmartphone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
} from "lucide-react";

// ============================================================
// HARDWARE STACK COMPONENT
// ============================================================

/**
 * A single row in the hardware status list.
 * Shows a component name, status badge, and value.
 */
function HardwareRow({
  icon: Icon,
  label,
  status,
  value,
}: {
  icon: React.ElementType;
  label: string;
  status: "OK" | "WARNING" | "ERROR";
  value: string;
}) {
  // Map status to icon and color
  const StatusIcon = status === "OK"
    ? CheckCircle2
    : status === "WARNING"
      ? AlertTriangle
      : XCircle;

  const statusColor = status === "OK"
    ? "text-emerald-400"
    : status === "WARNING"
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-foreground flex-1">{label}</span>
      <span className="text-xs text-muted-foreground mr-2">{value}</span>
      <StatusIcon className={cn("w-4 h-4 shrink-0", statusColor)} />
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] px-1.5 py-0",
          status === "OK" && "border-emerald-500/50 text-emerald-400",
          status === "WARNING" && "border-amber-500/50 text-amber-400",
          status === "ERROR" && "border-rose-500/50 text-rose-400"
        )}
      >
        {status}
      </Badge>
    </div>
  );
}

// ============================================================
// 3D KIOSK VISUALIZATION (SVG)
// ============================================================

/**
 * A simple 3D-perspective SVG rendering of a vending machine kiosk.
 * Uses gradients and shadows to create depth.
 */
function KioskVisualization({ machine }: { machine: VendingMachine }) {
  const statusColor = machine.status === "online"
    ? "#34d399"
    : machine.status === "warning"
      ? "#fbbf24"
      : machine.status === "error"
        ? "#fb7185"
        : "#64748b";

  return (
    <svg viewBox="0 0 200 300" className="w-full h-full max-h-75">
      <defs>
        {/* Gradient for the machine body */}
        <linearGradient id="kioskBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        {/* Gradient for the screen */}
        <linearGradient id="kioskScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0c1929" />
        </linearGradient>
        {/* Glow effect */}
        <filter id="statusGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor={statusColor} floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shadow */}
      <ellipse cx="100" cy="285" rx="70" ry="8" fill="rgba(0,0,0,0.3)" />

      {/* Machine body */}
      <rect x="35" y="20" width="130" height="260" rx="6" fill="url(#kioskBody)"
            stroke="rgba(148,163,184,0.15)" strokeWidth="1" />

      {/* Screen area */}
      <rect x="48" y="35" width="104" height="70" rx="4" fill="url(#kioskScreen)"
            stroke="rgba(148,163,184,0.1)" strokeWidth="0.5" />

      {/* Vendral text on screen */}
      <text x="100" y="65" textAnchor="middle" fill="#22d3ee" fontSize="10"
            fontWeight="bold" opacity="0.8">VENDRAL</text>
      <text x="100" y="80" textAnchor="middle" fill="rgba(148,163,184,0.5)"
            fontSize="6">{machine.id}</text>

      {/* Product rows (simplified grid) */}
      {[0, 1, 2, 3, 4].map(row => (
        <g key={row}>
          {[0, 1, 2].map(col => (
            <rect
              key={`${row}-${col}`}
              x={52 + col * 33}
              y={115 + row * 28}
              width="28"
              height="22"
              rx="2"
              fill="rgba(30, 41, 59, 0.6)"
              stroke="rgba(148,163,184,0.08)"
              strokeWidth="0.5"
            />
          ))}
        </g>
      ))}

      {/* Card reader slot */}
      <rect x="72" y="258" width="56" height="6" rx="2" fill="rgba(148,163,184,0.1)"
            stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />
      <text x="100" y="252" textAnchor="middle" fill="rgba(148,163,184,0.3)"
            fontSize="5">TAP CARD</text>

      {/* Status LED indicator */}
      <circle cx="100" cy="273" r="3" fill={statusColor} filter="url(#statusGlow)" />
    </svg>
  );
}

// ============================================================
// TERMINAL LOG COMPONENT
// ============================================================

/**
 * Monospace terminal-style log viewer.
 * Shows real-time system events with timestamps and codes.
 */
function TerminalLog({ machineId }: { machineId: string }) {
  const { events } = useSimulation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter events for this specific machine
  const machineEvents = events
    .filter(e => e.machineId === machineId)
    .slice(0, 50);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [machineEvents.length]);

  /**
   * Format a date as HH:MM:SS for the terminal timestamp.
   */
  function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", { hour12: false });
  }

  /**
   * Get the terminal color class based on event type.
   */
  function getLogColor(type: string): string {
    switch (type) {
      case "success": return "text-emerald-400";
      case "error":   return "text-rose-400";
      case "warning": return "text-amber-400";
      default:        return "text-slate-400";
    }
  }

  return (
    <div className="terminal-log p-3 h-50 overflow-y-auto" ref={scrollRef}>
      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <span className="text-[10px] text-muted-foreground">
          terminal — {machineId}
        </span>
      </div>

      {/* Log entries */}
      {machineEvents.length === 0 ? (
        <p className="text-slate-500 text-xs">Waiting for events...</p>
      ) : (
        machineEvents.map((event) => (
          <div key={event.id} className="flex gap-2 leading-snug mb-0.5">
            <span className="text-slate-600 text-[11px] shrink-0">
              [{formatTime(event.timestamp)}]
            </span>
            <span className={cn("text-[11px] shrink-0 font-semibold", getLogColor(event.type))}>
              {event.code}
            </span>
            <span className="text-slate-400 text-[11px] truncate">
              {event.message}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

// ============================================================
// MACHINE PICKER (shown when no machine is selected)
// ============================================================

function MachinePicker({
  machines,
  onSelect,
}: {
  machines: VendingMachine[];
  onSelect: (m: VendingMachine) => void;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Select a machine to view detailed hardware status and terminal logs.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {machines.map((machine) => (
          <button
            key={machine.id}
            onClick={() => onSelect(machine)}
            className={cn(
              "p-3 rounded-lg text-left transition-all duration-200",
              "bg-white/5 hover:bg-white/10 border border-transparent",
              "hover:border-cyan-500/30"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  machine.status === "online" && "bg-emerald-500",
                  machine.status === "warning" && "bg-amber-500",
                  machine.status === "error" && "bg-rose-500",
                  machine.status === "offline" && "bg-slate-600"
                )}
              />
              <span className="text-xs font-semibold text-foreground">{machine.id}</span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{machine.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function DeviceHealth() {
  const { machines, selectedMachine, selectMachine } = useSimulation();
  // Local state for selecting a machine within this tab
  const [localMachine, setLocalMachine] = useState<VendingMachine | null>(null);

  // Prefer the global selectedMachine (set from map), fall back to local
  // Using useMemo instead of useEffect+setState avoids cascading renders
  const machine = useMemo(
    () => selectedMachine ?? localMachine,
    [selectedMachine, localMachine]
  );

  // Keep machine state fresh by finding it in the current machines array
  const currentMachine = machine
    ? machines.find(m => m.id === machine.id) ?? machine
    : null;

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        {currentMachine && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLocalMachine(null);
              selectMachine(null);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
        <h2 className="text-lg font-bold text-foreground">
          {currentMachine
            ? `${currentMachine.name} (${currentMachine.id})`
            : "Device Health Monitor"}
        </h2>
        {currentMachine && (
          <Badge
            variant="outline"
            className={cn(
              "ml-auto",
              currentMachine.status === "online" && "border-emerald-500/50 text-emerald-400",
              currentMachine.status === "warning" && "border-amber-500/50 text-amber-400",
              currentMachine.status === "error" && "border-rose-500/50 text-rose-400",
              currentMachine.status === "offline" && "border-slate-500/50 text-slate-400"
            )}
          >
            {currentMachine.status.toUpperCase()}
          </Badge>
        )}
      </div>

      {!currentMachine ? (
        <MachinePicker
          machines={machines}
          onSelect={(m) => setLocalMachine(m)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: 3D Kiosk Visualization */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Kiosk Visualization
            </h3>
            <KioskVisualization machine={currentMachine} />
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">
                Firmware: v{currentMachine.firmware}
              </p>
              <p className="text-xs text-muted-foreground">
                Revenue Today: {formatISK(currentMachine.revenueToday)}
              </p>
            </div>
          </div>

          {/* Center: Hardware Stack */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Hardware Stack
            </h3>
            <div className="space-y-0.5">
              <HardwareRow
                icon={CreditCard}
                label="Bill Validator"
                status={currentMachine.hardware.billValidator}
                value="MDB v4.2"
              />
              <HardwareRow
                icon={CreditCard}
                label="Card Reader"
                status={currentMachine.hardware.cardReader}
                value="NFC+EMV"
              />
              <HardwareRow
                icon={Thermometer}
                label="Temperature"
                status={
                  currentMachine.hardware.temperature > 7
                    ? "WARNING"
                    : "OK"
                }
                value={`${currentMachine.hardware.temperature}°C`}
              />
              <HardwareRow
                icon={Wifi}
                label="Connectivity"
                status={
                  currentMachine.hardware.connectivity < 60
                    ? "WARNING"
                    : currentMachine.hardware.connectivity === 0
                      ? "ERROR"
                      : "OK"
                }
                value={`${currentMachine.hardware.connectivity}% – ${currentMachine.hardware.connectionType}`}
              />
              <HardwareRow
                icon={Cpu}
                label="Motor Board"
                status={currentMachine.hardware.motorBoard}
                value="v2.1"
              />
              <HardwareRow
                icon={MonitorSmartphone}
                label="Display"
                status={currentMachine.hardware.display}
                value="10.1″ LCD"
              />
            </div>
          </div>

          {/* Right: Quick Stats */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Machine Stats
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Revenue Today</span>
                  <span className="text-foreground font-medium">
                    {formatISK(currentMachine.revenueToday)}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (currentMachine.revenueToday / 100000) * 100)}
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="text-foreground font-medium">
                    {currentMachine.transactionsToday}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (currentMachine.transactionsToday / 150) * 100)}
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Signal Strength</span>
                  <span className="text-foreground font-medium">
                    {currentMachine.hardware.connectivity}%
                  </span>
                </div>
                <Progress
                  value={currentMachine.hardware.connectivity}
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Stock Health</span>
                  <span className="text-foreground font-medium">
                    {Math.round(
                      (currentMachine.planogram.reduce((sum, s) => sum + s.stock, 0) /
                        currentMachine.planogram.reduce((sum, s) => sum + s.maxStock, 0)) *
                        100
                    )}%
                  </span>
                </div>
                <Progress
                  value={
                    (currentMachine.planogram.reduce((sum, s) => sum + s.stock, 0) /
                      currentMachine.planogram.reduce((sum, s) => sum + s.maxStock, 0)) *
                    100
                  }
                  className="h-1.5"
                />
              </div>
            </div>
          </div>

          {/* Full-width Terminal Log */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Terminal Log
            </h3>
            <TerminalLog machineId={currentMachine.id} />
          </div>
        </div>
      )}
    </div>
  );
}
