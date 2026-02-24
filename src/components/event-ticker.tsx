/**
 * ============================================================
 * Vendral – Real-Time Event Ticker
 * ============================================================
 *
 * A scrolling feed of live events from the vending machine fleet.
 * Shows transactions, hardware alerts, stock warnings, etc.
 *
 * DESIGN DECISIONS:
 * - Uses a fixed-height scrollable container
 * - New events appear at the top with a subtle fade-in
 * - Each event is color-coded by severity (success/info/warning/error)
 * - Events show relative time ("2s ago", "1m ago")
 *
 * FRAMER MOTION:
 * We use AnimatePresence + motion.div for smooth enter animations.
 * AnimatePresence tracks which items are in the list and animates
 * them in/out automatically.
 * ============================================================
 */

"use client";

import React from "react";
import { useSimulation } from "@/lib/simulation-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  AlertTriangle,
  Package,
  Wifi,
  XCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Returns a relative time string like "2s ago", "1m ago".
 * This is a simple implementation – in production you'd use
 * a library like `date-fns` or `dayjs`.
 */
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/**
 * Maps event type to icon and color.
 */
function getEventIcon(type: string, category: string) {
  switch (category) {
    case "transaction":
      return type === "success"
        ? { icon: CreditCard, color: "text-emerald-400" }
        : { icon: XCircle, color: "text-rose-400" };
    case "hardware":
      return type === "error"
        ? { icon: AlertTriangle, color: "text-rose-400" }
        : { icon: AlertTriangle, color: "text-amber-400" };
    case "stock":
      return type === "error"
        ? { icon: Package, color: "text-rose-400" }
        : { icon: Package, color: "text-amber-400" };
    case "connectivity":
      return { icon: Wifi, color: type === "warning" ? "text-amber-400" : "text-cyan-400" };
    default:
      return { icon: Info, color: "text-slate-400" };
  }
}

export function EventTicker() {
  const { events } = useSimulation();

  // Show the most recent 30 events
  const recentEvents = events.slice(0, 30);

  return (
    <div className="glass-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Live Events</h3>
        {/* Pulsing "LIVE" indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-xs font-medium text-cyan-400">LIVE</span>
        </div>
      </div>      {/* Scrollable event list
       * min-h-0 is critical here: flexbox children default to min-height:auto
       * which prevents them from shrinking below their content size.
       * Without min-h-0, the ScrollArea grows with its content instead of scrolling.
       */}
      <ScrollArea className="flex-1 min-h-0 -mx-1 px-1">
        <AnimatePresence initial={false}>
          {recentEvents.map((event) => {
            const { icon: Icon, color } = getEventIcon(event.type, event.category);

            return (
              <motion.div
                key={event.id}
                // Animation: slide in from left and fade in
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-2"
              >
                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  {/* Event icon */}
                  <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", color)} />

                  <div className="flex-1 min-w-0">
                    {/* Machine ID + message */}
                    <p className="text-xs text-foreground leading-snug">
                      <span className="font-semibold text-cyan-400">
                        {event.machineId}:
                      </span>{" "}
                      {event.message}
                    </p>
                    {/* Time ago */}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {timeAgo(event.timestamp)}
                    </p>
                  </div>

                  {/* Severity badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 shrink-0",
                      event.type === "error" && "border-rose-500/50 text-rose-400",
                      event.type === "warning" && "border-amber-500/50 text-amber-400",
                      event.type === "success" && "border-emerald-500/50 text-emerald-400",
                      event.type === "info" && "border-slate-500/50 text-slate-400"
                    )}
                  >
                    {event.type}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
