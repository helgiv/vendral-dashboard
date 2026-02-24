/**
 * ============================================================
 * Vendral – Simulation Context Provider
 * ============================================================
 *
 * React Context is a way to pass data through the component tree
 * without having to pass props manually at every level ("prop drilling").
 *
 * HOW THIS WORKS:
 * 1. SimulationProvider wraps the entire app (in layout.tsx)
 * 2. It starts the simulation on mount and stops on unmount
 * 3. Any child component can call useSimulation() to get:
 *    - machines: the current list of vending machines
 *    - transactions: recent sales events
 *    - events: system/hardware events
 *    - fleetStats: computed KPIs (total revenue, alerts, etc.)
 *    - And more!
 *
 * The state re-renders on a regular interval (1 second) to keep
 * the UI responsive without re-rendering on every single event.
 * ============================================================
 */

"use client"; // This directive tells Next.js this is a Client Component
             // (it uses browser APIs like setInterval, state, effects)

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  getSimulationState,
  startSimulation,
  stopSimulation,
  getFleetStats,
  getHourlyData,
  getTopProducts,
  getBottomProducts,
  getSalesHeatmap,
} from "./simulation";
import type {
  VendingMachine,
  Transaction,
  SystemEvent,
} from "./data";

// ============================================================
// CONTEXT TYPE DEFINITION
// ============================================================
// This defines the "shape" of data available to all components.

interface SimulationContextType {
  /** All 20 vending machines with current state */
  machines: VendingMachine[];
  /** Recent transactions (up to 200) */
  transactions: Transaction[];
  /** Recent system events (up to 300) */
  events: SystemEvent[];
  /** Computed fleet KPIs */
  fleetStats: ReturnType<typeof getFleetStats>;
  /** 24-hour revenue + traffic data for charts */
  hourlyData: ReturnType<typeof getHourlyData>;
  /** Top 5 selling products */
  topProducts: ReturnType<typeof getTopProducts>;
  /** Bottom 5 selling products (dead stock) */
  bottomProducts: ReturnType<typeof getBottomProducts>;
  /** Sales heatmap data (hour × day) */
  salesHeatmap: ReturnType<typeof getSalesHeatmap>;
  /** Currently selected machine for drill-down (null = fleet view) */
  selectedMachine: VendingMachine | null;
  /** Function to select a machine for drill-down */
  selectMachine: (machine: VendingMachine | null) => void;
  /** Increments on every tick for forcing re-renders */
  tick: number;
}

// Create the context with a default value of null
// (it will always be provided by SimulationProvider)
const SimulationContext = createContext<SimulationContextType | null>(null);

// ============================================================
// PROVIDER COMPONENT
// ============================================================

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  // `tick` is a counter that increments every second.
  // When it changes, all consumers re-render with fresh data.
  const [tick, setTick] = useState(0);
  const [selectedMachine, setSelectedMachine] = useState<VendingMachine | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    // Start the simulation engine
    startSimulation();

    // Set up a 1-second refresh interval
    // This is intentionally slower than event generation to batch updates
    const refreshInterval = setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);
    }, 1000);

    // Cleanup: stop simulation and interval when component unmounts
    return () => {
      stopSimulation();
      clearInterval(refreshInterval);
    };
  }, []); // Empty dependency array = run once on mount

  // useCallback memoizes the function so it doesn't cause unnecessary re-renders
  const selectMachine = useCallback((machine: VendingMachine | null) => {
    setSelectedMachine(machine);
  }, []);

  // Get current state snapshot
  const state = getSimulationState();

  // Build the context value
  // We compute all derived data here so components just consume it
  const value: SimulationContextType = {
    machines: state.machines,
    transactions: state.transactions,
    events: state.events,
    fleetStats: getFleetStats(),
    hourlyData: getHourlyData(),
    topProducts: getTopProducts(10),
    bottomProducts: getBottomProducts(5),
    salesHeatmap: getSalesHeatmap(),
    selectedMachine,
    selectMachine,
    tick,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

// ============================================================
// CUSTOM HOOK
// ============================================================

/**
 * Custom hook to access simulation data from any component.
 * 
 * USAGE:
 * ```tsx
 * function MyComponent() {
 *   const { machines, fleetStats } = useSimulation();
 *   return <div>Total Revenue: {fleetStats.totalRevenue}</div>;
 * }
 * ```
 * 
 * Throws an error if used outside of SimulationProvider.
 */
export function useSimulation(): SimulationContextType {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}
