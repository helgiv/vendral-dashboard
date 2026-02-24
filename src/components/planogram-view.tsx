/**
 * ============================================================
 * Vendral – Virtual Planogram View
 * ============================================================
 *
 * A visual grid representation of a vending machine's product layout.
 * 10 rows × 6 columns = 60 slots.
 *
 * Each slot shows:
 *   - Product emoji icon
 *   - Price tag
 *   - Vertical stock level indicator
 *   - Color coding:
 *     🔴 Red    = Out of stock (0 items)
 *     🟠 Orange = Low stock (1-2 items)
 *     🔵 Blue   = Full/adequate stock (3+ items)
 *
 * RESTOCK OPTIMIZER:
 * A button that highlights the slots needing the most attention,
 * sorted by urgency (out of stock first, then low stock).
 *
 * PLANOGRAM CONCEPT:
 * A "planogram" is a retail merchandising diagram that shows where
 * products should be placed on shelves. In vending machines, it
 * defines which product goes in each spiral/slot position.
 * ============================================================
 */

"use client";

import React, { useState, useMemo } from "react";
import { useSimulation } from "@/lib/simulation-context";
import {
  formatISK,
  getProductById,
  type VendingMachine,
  type PlanogramSlot,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PackageSearch,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";

// ============================================================
// SLOT COLOR LOGIC
// ============================================================

/**
 * Determine the background color class for a planogram slot
 * based on its stock level.
 */
function getSlotColor(stock: number, maxStock: number): string {
  // maxStock is available for future threshold logic (e.g., percentage-based)
  void maxStock;
  if (stock === 0) return "bg-rose-500/20 border-rose-500/40"; // Out of stock
  if (stock <= 2) return "bg-amber-500/20 border-amber-500/40"; // Low stock
  return "bg-cyan-500/10 border-cyan-500/20"; // Adequate
}

/**
 * Get a vertical fill percentage for the stock level indicator.
 */
function getStockPercent(stock: number, maxStock: number): number {
  if (maxStock === 0) return 0;
  return (stock / maxStock) * 100;
}

/**
 * Get text color for the stock level.
 */
function getStockTextColor(stock: number): string {
  if (stock === 0) return "text-rose-400";
  if (stock <= 2) return "text-amber-400";
  return "text-cyan-400";
}

// ============================================================
// PLANOGRAM GRID COMPONENT
// ============================================================

function PlanogramGrid({
  machine,
  highlightRestock,
}: {
  machine: VendingMachine;
  /** When true, animate slots that need restocking */
  highlightRestock: boolean;
}) {
  // Organize slots into a 2D grid for rendering
  const grid: PlanogramSlot[][] = [];
  for (let row = 0; row < 10; row++) {
    grid.push(
      machine.planogram.filter(slot => slot.row === row).sort((a, b) => a.col - b.col)
    );
  }

  return (
    <div className="space-y-1">
      {/* Row labels on the left */}
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-1">
          {/* Row number label */}
          <span className="text-[9px] text-muted-foreground w-4 text-right shrink-0">
            {rowIndex + 1}
          </span>

          {/* Slot cells */}
          <div className="flex gap-1 flex-1">
            {row.map((slot) => {
              const product = slot.productId
                ? getProductById(slot.productId)
                : null;
              const needsRestock = slot.stock <= 2;
              const shouldHighlight = highlightRestock && needsRestock;

              return (
                <Tooltip key={`${slot.row}-${slot.col}`}>
                  <TooltipTrigger asChild>
                    <motion.div
                      className={cn(
                        "flex-1 aspect-square rounded-md border p-1",
                        "flex flex-col items-center justify-center gap-0.5",
                        "transition-all duration-300 cursor-pointer",
                        "hover:scale-105",
                        getSlotColor(slot.stock, slot.maxStock),
                        // Pulsing animation when restock optimizer is active
                        shouldHighlight && "ring-2 ring-rose-500/50"
                      )}
                      animate={
                        shouldHighlight
                          ? { scale: [1, 1.05, 1] }
                          : { scale: 1 }
                      }
                      transition={
                        shouldHighlight
                          ? { repeat: Infinity, duration: 1.5 }
                          : {}
                      }
                    >
                      {/* Product icon (emoji) */}
                      <span className="text-sm leading-none">
                        {product?.icon ?? "📦"}
                      </span>

                      {/* Price tag */}
                      <span className="text-[8px] text-muted-foreground leading-none">
                        {slot.price} kr
                      </span>

                      {/* Stock level bar (vertical) */}
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            slot.stock === 0 && "bg-rose-500",
                            slot.stock > 0 && slot.stock <= 2 && "bg-amber-500",
                            slot.stock > 2 && "bg-cyan-500"
                          )}
                          style={{ width: `${getStockPercent(slot.stock, slot.maxStock)}%` }}
                        />
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  {/* Tooltip with full details on hover */}
                  <TooltipContent className="bg-popover p-2">
                    <p className="font-semibold text-xs">
                      {product?.name ?? "Empty Slot"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Position: Row {slot.row + 1}, Col {slot.col + 1}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Price: {formatISK(slot.price)}
                    </p>
                    <p className={cn("text-[10px] font-medium", getStockTextColor(slot.stock))}>
                      Stock: {slot.stock} / {slot.maxStock}
                      {slot.stock === 0 && " ⚠️ OUT OF STOCK"}
                      {slot.stock > 0 && slot.stock <= 2 && " ⚠️ LOW"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ))}

      {/* Column labels at the bottom */}
      <div className="flex gap-1 ml-5">
        {[1, 2, 3, 4, 5, 6].map(col => (
          <div key={col} className="flex-1 text-center">
            <span className="text-[9px] text-muted-foreground">{col}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// RESTOCK SUMMARY SIDEBAR
// ============================================================

function RestockSummary({ machine }: { machine: VendingMachine }) {
  // Calculate restock needs
  const outOfStock = machine.planogram.filter(s => s.stock === 0);
  const lowStock = machine.planogram.filter(s => s.stock > 0 && s.stock <= 2);
  const adequate = machine.planogram.filter(s => s.stock > 2);

  // Group restocking needs by product
  const restockItems: {
    productId: string;
    name: string;
    icon: string;
    slotsNeeding: number;
    totalNeeded: number;
  }[] = [];

  const needySlots = [...outOfStock, ...lowStock];
  const grouped: Record<string, { count: number; needed: number }> = {};

  for (const slot of needySlots) {
    if (!slot.productId) continue;
    if (!grouped[slot.productId]) {
      grouped[slot.productId] = { count: 0, needed: 0 };
    }
    grouped[slot.productId].count++;
    grouped[slot.productId].needed += slot.maxStock - slot.stock;
  }

  for (const [productId, data] of Object.entries(grouped)) {
    const product = getProductById(productId);
    restockItems.push({
      productId,
      name: product?.name ?? "Unknown",
      icon: product?.icon ?? "📦",
      slotsNeeding: data.count,
      totalNeeded: data.needed,
    });
  }

  // Sort by urgency (most needed first)
  restockItems.sort((a, b) => b.totalNeeded - a.totalNeeded);

  return (
    <div className="space-y-3">
      {/* Status counters */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-rose-500/10">
          <p className="text-lg font-bold text-rose-400">{outOfStock.length}</p>
          <p className="text-[10px] text-rose-400/70">Empty</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-amber-500/10">
          <p className="text-lg font-bold text-amber-400">{lowStock.length}</p>
          <p className="text-[10px] text-amber-400/70">Low</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-cyan-500/10">
          <p className="text-lg font-bold text-cyan-400">{adequate.length}</p>
          <p className="text-[10px] text-cyan-400/70">OK</p>
        </div>
      </div>

      {/* Restock list */}
      <h4 className="text-xs font-semibold text-foreground">Restock Priority</h4>
      <ScrollArea className="h-75">
        {restockItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">All slots adequately stocked!</p>
        ) : (
          <div className="space-y-1">
            {restockItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
              >
                <span className="text-sm">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.slotsNeeding} slots need refill
                  </p>
                </div>
                <Badge className="bg-rose-500/20 text-rose-400 text-[10px] border-0">
                  +{item.totalNeeded}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ============================================================
// MACHINE PICKER FOR PLANOGRAM
// ============================================================

function PlanogramMachinePicker({
  machines,
  onSelect,
}: {
  machines: VendingMachine[];
  onSelect: (m: VendingMachine) => void;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Select a vending machine to view its virtual planogram layout.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {machines.map((machine) => {
          const emptySlots = machine.planogram.filter(s => s.stock === 0).length;
          const lowSlots = machine.planogram.filter(
            s => s.stock > 0 && s.stock <= 2
          ).length;

          return (
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
                <span className="text-xs font-semibold text-foreground">
                  {machine.id}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate mb-1">
                {machine.name}
              </p>
              {(emptySlots > 0 || lowSlots > 0) && (
                <div className="flex gap-2">
                  {emptySlots > 0 && (
                    <span className="text-[9px] text-rose-400">
                      {emptySlots} empty
                    </span>
                  )}
                  {lowSlots > 0 && (
                    <span className="text-[9px] text-amber-400">
                      {lowSlots} low
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN EXPORT
// ============================================================

export function PlanogramView() {
  const { machines, selectedMachine, selectMachine } = useSimulation();
  const [localMachine, setLocalMachine] = useState<VendingMachine | null>(null);
  const [highlightRestock, setHighlightRestock] = useState(false);

  // Derive machine selection from global or local state (avoids setState in effect)
  const machine = useMemo(
    () => selectedMachine ?? localMachine,
    [selectedMachine, localMachine]
  );

  // Keep machine state fresh
  const currentMachine = machine
    ? machines.find(m => m.id === machine.id) ?? machine
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {currentMachine && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLocalMachine(null);
              selectMachine(null);
              setHighlightRestock(false);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
        <h2 className="text-lg font-bold text-foreground">
          {currentMachine
            ? `Planogram – ${currentMachine.name}`
            : "Virtual Planogram"}
        </h2>
        {currentMachine && (
          <Button
            variant={highlightRestock ? "default" : "outline"}
            size="sm"
            onClick={() => setHighlightRestock(!highlightRestock)}
            className={cn(
              "ml-auto text-xs",
              highlightRestock && "bg-rose-500/20 text-rose-400 border-rose-500/30"
            )}
          >
            <PackageSearch className="w-3.5 h-3.5 mr-1" />
            Restock Optimizer
          </Button>
        )}
      </div>

      {!currentMachine ? (
        <PlanogramMachinePicker
          machines={machines}
          onSelect={(m) => setLocalMachine(m)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Planogram Grid (takes 2 columns) */}
          <div className="lg:col-span-2 glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Slot Layout (10 × 6)
              </h3>
              <div className="flex items-center gap-3">
                {/* Legend */}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded bg-rose-500" />
                  <span className="text-[9px] text-muted-foreground">Empty</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded bg-amber-500" />
                  <span className="text-[9px] text-muted-foreground">Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded bg-cyan-500" />
                  <span className="text-[9px] text-muted-foreground">OK</span>
                </div>
              </div>
            </div>

            <PlanogramGrid
              machine={currentMachine}
              highlightRestock={highlightRestock}
            />
          </div>

          {/* Restock Summary (right sidebar) */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Restock Summary
            </h3>
            <RestockSummary machine={currentMachine} />
          </div>
        </div>
      )}
    </div>
  );
}
