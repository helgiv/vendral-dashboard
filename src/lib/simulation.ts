/**
 * ============================================================
 * Vendral – Real-Time Simulation Engine
 * ============================================================
 *
 * This module creates a singleton simulation that runs on intervals
 * and produces realistic vending machine activity:
 *
 *   • Sales transactions every 2-5 seconds
 *   • Hardware/stock events every 5-15 seconds
 *   • Terminal log messages continuously
 *
 * ARCHITECTURE PATTERN: "Event Emitter with Callbacks"
 * ---------------------------------------------------
 * Instead of using WebSockets (which would need a server),
 * we use setInterval + callback functions. Components subscribe
 * to updates via the `onTransaction` and `onEvent` callbacks.
 *
 * In a real Vendral system, these events would come via MQTT
 * or WebSocket from the IoT backend.
 * ============================================================
 */

import {
  VendingMachine,
  Transaction,
  SystemEvent,
  generateMachines,
  weightedRandomProduct,
  getProductById,
  PRODUCTS,
} from "./data";

// ============================================================
// SIMULATION STATE
// ============================================================

/** Singleton state – all machines and accumulated data */
interface SimulationState {
  machines: VendingMachine[];
  transactions: Transaction[];
  events: SystemEvent[];
  /** Hourly revenue data for the last 24 hours */
  hourlyRevenue: number[];
  /** Hourly foot traffic (transaction count) for the last 24 hours */
  hourlyTraffic: number[];
  /** Counter for unique IDs */
  txCounter: number;
  evCounter: number;
  isRunning: boolean;
}

// We keep a single global state so all components share the same data
let state: SimulationState | null = null;

/**
 * Get or initialize the simulation state.
 * This uses the "lazy singleton" pattern – the state is created
 * only when first requested.
 */
export function getSimulationState(): SimulationState {
  if (!state) {
    // Generate initial 24-hour data for charts
    const hourlyRevenue = Array.from({ length: 24 }, (_, hour) => {
      // Revenue follows a realistic daily pattern:
      // Low at night, peaks at lunch (12) and afternoon (16)
      const base = 25000;
      const lunchPeak = hour >= 11 && hour <= 14 ? 45000 : 0;
      const afternoonPeak = hour >= 15 && hour <= 17 ? 30000 : 0;
      const nightDip = hour >= 0 && hour <= 6 ? -20000 : 0;
      return Math.max(5000, base + lunchPeak + afternoonPeak + nightDip + (Math.random() * 15000));
    });

    const hourlyTraffic = hourlyRevenue.map((rev) =>
      Math.floor(rev / (400 + Math.random() * 200))
    );

    state = {
      machines: generateMachines(),
      transactions: [],
      events: [],
      hourlyRevenue,
      hourlyTraffic,
      txCounter: 0,
      evCounter: 0,
      isRunning: false,
    };

    // Seed some initial events so the feed isn't empty on load
    seedInitialEvents();
  }
  return state;
}

// ============================================================
// CALLBACK SUBSCRIPTIONS
// ============================================================
// Components register callbacks to be notified of new data.

type TransactionCallback = (tx: Transaction) => void;
type EventCallback = (ev: SystemEvent) => void;
type UpdateCallback = () => void;

const txCallbacks: TransactionCallback[] = [];
const evCallbacks: EventCallback[] = [];
const updateCallbacks: UpdateCallback[] = [];

/** Subscribe to new transactions */
export function onTransaction(cb: TransactionCallback): () => void {
  txCallbacks.push(cb);
  // Return an "unsubscribe" function (cleanup for React useEffect)
  return () => {
    const idx = txCallbacks.indexOf(cb);
    if (idx >= 0) txCallbacks.splice(idx, 1);
  };
}

/** Subscribe to new system events */
export function onSystemEvent(cb: EventCallback): () => void {
  evCallbacks.push(cb);
  return () => {
    const idx = evCallbacks.indexOf(cb);
    if (idx >= 0) evCallbacks.splice(idx, 1);
  };
}

/** Subscribe to any state update (for re-rendering) */
export function onUpdate(cb: UpdateCallback): () => void {
  updateCallbacks.push(cb);
  return () => {
    const idx = updateCallbacks.indexOf(cb);
    if (idx >= 0) updateCallbacks.splice(idx, 1);
  };
}

// ============================================================
// SIMULATION LOGIC
// ============================================================

/** Interval handles so we can clean up */
let txInterval: ReturnType<typeof setInterval> | null = null;
let evInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the simulation loops.
 * Call this once from the root component (e.g., layout.tsx).
 */
export function startSimulation(): void {
  const s = getSimulationState();
  if (s.isRunning) return; // Don't start twice
  s.isRunning = true;

  // Transaction simulation: every 2-4 seconds
  txInterval = setInterval(() => {
    simulateTransaction();
  }, 2000 + Math.random() * 2000);

  // Event simulation: every 5-10 seconds
  evInterval = setInterval(() => {
    simulateSystemEvent();
  }, 5000 + Math.random() * 5000);
}

/** Stop the simulation (for cleanup) */
export function stopSimulation(): void {
  const s = getSimulationState();
  s.isRunning = false;
  if (txInterval) clearInterval(txInterval);
  if (evInterval) clearInterval(evInterval);
}

/**
 * Simulate a single sales transaction.
 *
 * FLOW:
 * 1. Pick a random ONLINE machine
 * 2. Pick a random product using weighted selection
 * 3. Find a slot with that product and decrement stock
 * 4. Update machine revenue & transaction count
 * 5. Notify all subscribers
 */
function simulateTransaction(): void {
  const s = getSimulationState();

  // Only online machines can make sales
  const onlineMachines = s.machines.filter(m => m.status === "online" || m.status === "warning");
  if (onlineMachines.length === 0) return;

  const machine = onlineMachines[Math.floor(Math.random() * onlineMachines.length)];
  const product = weightedRandomProduct();

  // Find a slot with this product that has stock
  const slot = machine.planogram.find(
    sl => sl.productId === product.id && sl.stock > 0
  );

  // 95% success rate (card transactions can fail)
  const success = Math.random() > 0.05;

  s.txCounter++;
  const tx: Transaction = {
    id: `TX-${String(s.txCounter).padStart(6, "0")}`,
    machineId: machine.id,
    machineName: machine.name,
    productId: product.id,
    productName: product.name,
    amount: product.price,
    paymentMethod: "card",
    timestamp: new Date(),
    success,
  };

  // Add to history (keep last 200 transactions for performance)
  s.transactions.unshift(tx);
  if (s.transactions.length > 200) s.transactions.pop();

  if (success && slot) {
    // Decrement stock
    slot.stock = Math.max(0, slot.stock - 1);

    // Update machine totals
    machine.revenueToday += product.price;
    machine.transactionsToday += 1;
    machine.lastActivity = new Date();

    // Update the current hour's revenue
    const currentHour = new Date().getHours();
    s.hourlyRevenue[currentHour] += product.price;
    s.hourlyTraffic[currentHour] += 1;

    // Check if stock is now low (triggers a warning event)
    if (slot.stock <= 2 && slot.stock > 0) {
      emitStockWarning(machine, product, slot.stock);
    } else if (slot.stock === 0) {
      emitStockEmpty(machine, product);
    }
  }

  // Create corresponding terminal log event
  const terminalEvent = createTerminalEvent(machine, tx, success);
  s.events.unshift(terminalEvent);
  if (s.events.length > 300) s.events.pop();

  // Notify all subscribers
  txCallbacks.forEach(cb => cb(tx));
  evCallbacks.forEach(cb => cb(terminalEvent));
  updateCallbacks.forEach(cb => cb());
}

/**
 * Simulate a random system event (hardware, connectivity, etc.)
 */
function simulateSystemEvent(): void {
  const s = getSimulationState();
  const machine = s.machines[Math.floor(Math.random() * s.machines.length)];

  // Weighted event types – most events are OK, some are problems
  const roll = Math.random();
  let event: SystemEvent;

  if (roll > 0.85) {
    // Hardware error (15% chance)
    event = createHardwareEvent(machine, "error");
    // Maybe change machine status
    if (Math.random() > 0.5) {
      machine.status = "error";
      machine.hardware.motorBoard = "ERROR";
    }
  } else if (roll > 0.65) {
    // Warning event (20% chance)
    event = createHardwareEvent(machine, "warning");
    if (machine.status === "online") {
      machine.status = "warning";
    }
  } else if (roll > 0.5) {
    // Connectivity fluctuation (15% chance)
    const newSignal = 60 + Math.floor(Math.random() * 40);
    machine.hardware.connectivity = newSignal;
    event = createConnectivityEvent(machine, newSignal);
  } else {
    // Everything fine – heartbeat (50% chance)
    event = createHeartbeatEvent(machine);
    // Sometimes recover from warning
    if (machine.status === "warning" && Math.random() > 0.7) {
      machine.status = "online";
      machine.hardware.motorBoard = "OK";
      machine.hardware.billValidator = "OK";
    }
  }

  s.events.unshift(event);
  if (s.events.length > 300) s.events.pop();

  evCallbacks.forEach(cb => cb(event));
  updateCallbacks.forEach(cb => cb());
}

// ============================================================
// EVENT FACTORY FUNCTIONS
// ============================================================

function createTerminalEvent(
  machine: VendingMachine,
  tx: Transaction,
  success: boolean
): SystemEvent {
  const s = getSimulationState();
  s.evCounter++;

  if (success) {
    return {
      id: `EV-${String(s.evCounter).padStart(6, "0")}`,
      machineId: machine.id,
      machineName: machine.name,
      type: "success",
      category: "transaction",
      message: `Payment Success: ${tx.productName} (${tx.amount} ISK)`,
      timestamp: new Date(),
      code: "CARD_TRANSACTION_COMPLETED",
    };
  } else {
    return {
      id: `EV-${String(s.evCounter).padStart(6, "0")}`,
      machineId: machine.id,
      machineName: machine.name,
      type: "warning",
      category: "transaction",
      message: `Payment Failed: Card declined for ${tx.productName}`,
      timestamp: new Date(),
      code: "CARD_DECLINED_RETRY",
    };
  }
}

function emitStockWarning(machine: VendingMachine, product: import("./data").Product, remaining: number): void {
  const s = getSimulationState();
  s.evCounter++;

  const event: SystemEvent = {
    id: `EV-${String(s.evCounter).padStart(6, "0")}`,
    machineId: machine.id,
    machineName: machine.name,
    type: "warning",
    category: "stock",
    message: `Low Stock: ${product.name} (${remaining} remaining)`,
    timestamp: new Date(),
    code: "STOCK_LOW_WARNING",
  };

  s.events.unshift(event);
  evCallbacks.forEach(cb => cb(event));
}

function emitStockEmpty(machine: VendingMachine, product: import("./data").Product): void {
  const s = getSimulationState();
  s.evCounter++;

  const event: SystemEvent = {
    id: `EV-${String(s.evCounter).padStart(6, "0")}`,
    machineId: machine.id,
    machineName: machine.name,
    type: "error",
    category: "stock",
    message: `Out of Stock: ${product.name}`,
    timestamp: new Date(),
    code: "STOCK_EMPTY_ALERT",
  };

  s.events.unshift(event);
  evCallbacks.forEach(cb => cb(event));
}

function createHardwareEvent(machine: VendingMachine, severity: "warning" | "error"): SystemEvent {
  const s = getSimulationState();
  s.evCounter++;

  const errorMessages = [
    { msg: "Motor Jam detected on dispensing mechanism", code: "MOTOR_JAM_DETECTED" },
    { msg: "Bill Validator communication timeout", code: "MDB_POLL_TIMEOUT" },
    { msg: "Temperature sensor reading abnormal", code: "TEMP_SENSOR_ANOMALY" },
    { msg: "Card reader magnetic stripe error", code: "CARD_READER_MAG_ERR" },
    { msg: "Display backlight flickering", code: "DISPLAY_BACKLIGHT_ERR" },
  ];

  const warningMessages = [
    { msg: "Temperature above threshold (8°C)", code: "TEMP_HIGH_WARNING" },
    { msg: "Bill Validator coin path needs cleaning", code: "MDB_CLEAN_WARNING" },
    { msg: "Power supply voltage fluctuation", code: "PSU_VOLTAGE_WARN" },
    { msg: "Compressor cycling more frequently", code: "COMPRESSOR_CYCLE_WARN" },
  ];

  const pool = severity === "error" ? errorMessages : warningMessages;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    id: `EV-${String(s.evCounter).padStart(6, "0")}`,
    machineId: machine.id,
    machineName: machine.name,
    type: severity,
    category: "hardware",
    message: picked.msg,
    timestamp: new Date(),
    code: picked.code,
  };
}

function createConnectivityEvent(machine: VendingMachine, signal: number): SystemEvent {
  const s = getSimulationState();
  s.evCounter++;

  return {
    id: `EV-${String(s.evCounter).padStart(6, "0")}`,
    machineId: machine.id,
    machineName: machine.name,
    type: signal < 70 ? "warning" : "info",
    category: "connectivity",
    message: `Signal strength: ${signal}% (${machine.hardware.connectionType})`,
    timestamp: new Date(),
    code: signal < 70 ? "CONN_SIGNAL_WEAK" : "CONN_SIGNAL_OK",
  };
}

function createHeartbeatEvent(machine: VendingMachine): SystemEvent {
  const s = getSimulationState();
  s.evCounter++;

  const codes = ["MDB_POLL_SUCCESS", "HEARTBEAT_OK", "SYSTEM_CHECK_PASS", "FIRMWARE_UPTODATE"];

  return {
    id: `EV-${String(s.evCounter).padStart(6, "0")}`,
    machineId: machine.id,
    machineName: machine.name,
    type: "info",
    category: "system",
    message: `System heartbeat OK – Temp: ${machine.hardware.temperature}°C`,
    timestamp: new Date(),
    code: codes[Math.floor(Math.random() * codes.length)],
  };
}

/**
 * Creates ~10 initial events so the dashboard isn't empty on first load.
 */
function seedInitialEvents(): void {
  const s = getSimulationState();

  for (let i = 0; i < 10; i++) {
    const machine = s.machines[Math.floor(Math.random() * s.machines.length)];
    const product = weightedRandomProduct();

    s.evCounter++;
    s.txCounter++;

    // Create a past transaction
    const pastTime = new Date(Date.now() - (10 - i) * 30000); // 30s apart

    const tx: Transaction = {
      id: `TX-${String(s.txCounter).padStart(6, "0")}`,
      machineId: machine.id,
      machineName: machine.name,
      productId: product.id,
      productName: product.name,
      amount: product.price,
      paymentMethod: "card",
      timestamp: pastTime,
      success: true,
    };

    s.transactions.push(tx);

    s.events.push({
      id: `EV-${String(s.evCounter).padStart(6, "0")}`,
      machineId: machine.id,
      machineName: machine.name,
      type: "success",
      category: "transaction",
      message: `Payment Success: ${product.name} (${product.price} ISK)`,
      timestamp: pastTime,
      code: "CARD_TRANSACTION_COMPLETED",
    });
  }
}

// ============================================================
// COMPUTED DATA HELPERS (for charts & KPIs)
// ============================================================

/** Get sales performance data for the past 24 hours */
export function getHourlyData() {
  const s = getSimulationState();
  return s.hourlyRevenue.map((revenue, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    revenue,
    traffic: s.hourlyTraffic[hour],
  }));
}

/** Get Top N products by total revenue across all machines */
export function getTopProducts(n: number = 5) {
  const s = getSimulationState();
  const productSales: Record<string, { count: number; revenue: number; stock: number; maxStock: number }> = {};

  // Tally up sales from transactions
  for (const tx of s.transactions) {
    if (!tx.success) continue;
    if (!productSales[tx.productId]) {
      productSales[tx.productId] = { count: 0, revenue: 0, stock: 0, maxStock: 0 };
    }
    productSales[tx.productId].count += 1;
    productSales[tx.productId].revenue += tx.amount;
  }

  // Also tally current stock levels across all machines
  for (const machine of s.machines) {
    for (const slot of machine.planogram) {
      if (!slot.productId) continue;
      if (!productSales[slot.productId]) {
        productSales[slot.productId] = { count: 0, revenue: 0, stock: 0, maxStock: 0 };
      }
      productSales[slot.productId].stock += slot.stock;
      productSales[slot.productId].maxStock += slot.maxStock;
    }
  }

  // Sort and return top N
  return Object.entries(productSales)
    .map(([productId, data]) => {
      const product = getProductById(productId);
      return {
        productId,
        name: product?.name ?? "Unknown",
        icon: product?.icon ?? "📦",
        price: product?.price ?? 0,
        ...data,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, n);
}

/** Get Bottom N products (dead stock) */
export function getBottomProducts(n: number = 5) {
  const s = getSimulationState();
  const productSales: Record<string, { count: number; revenue: number }> = {};

  for (const tx of s.transactions) {
    if (!tx.success) continue;
    if (!productSales[tx.productId]) {
      productSales[tx.productId] = { count: 0, revenue: 0 };
    }
    productSales[tx.productId].count += 1;
    productSales[tx.productId].revenue += tx.amount;
  }

  // Include products with zero sales too
  for (const p of PRODUCTS) {
    if (!productSales[p.id]) {
      productSales[p.id] = { count: 0, revenue: 0 };
    }
  }

  return Object.entries(productSales)
    .map(([productId, data]) => {
      const product = getProductById(productId);
      return {
        productId,
        name: product?.name ?? "Unknown",
        icon: product?.icon ?? "📦",
        price: product?.price ?? 0,
        ...data,
      };
    })
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, n);
}

/** Generate sales heatmap data (hour × day of week) */
export function getSalesHeatmap(): { day: string; hour: number; value: number }[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data: { day: string; hour: number; value: number }[] = [];

  for (const day of days) {
    for (let hour = 0; hour < 24; hour++) {
      // Simulate realistic patterns
      let base = 20;
      // Weekdays have higher lunch peaks
      if (["Mon", "Tue", "Wed", "Thu", "Fri"].includes(day)) {
        if (hour >= 11 && hour <= 13) base = 80 + Math.random() * 20;
        else if (hour >= 15 && hour <= 17) base = 60 + Math.random() * 20;
        else if (hour >= 7 && hour <= 9) base = 50 + Math.random() * 15;
        else if (hour >= 0 && hour <= 5) base = 5 + Math.random() * 5;
        else base = 30 + Math.random() * 20;
      } else {
        // Weekends: more even distribution, lower overall
        if (hour >= 11 && hour <= 16) base = 50 + Math.random() * 20;
        else if (hour >= 0 && hour <= 7) base = 5 + Math.random() * 5;
        else base = 25 + Math.random() * 15;
      }
      data.push({ day, hour, value: Math.round(base) });
    }
  }

  return data;
}

/** Fleet summary statistics */
export function getFleetStats() {
  const s = getSimulationState();
  const total = s.machines.length;
  const online = s.machines.filter(m => m.status === "online").length;
  const warning = s.machines.filter(m => m.status === "warning").length;
  const error = s.machines.filter(m => m.status === "error").length;
  const offline = s.machines.filter(m => m.status === "offline").length;

  const totalRevenue = s.machines.reduce((sum, m) => sum + m.revenueToday, 0);
  const totalTransactions = s.machines.reduce((sum, m) => sum + m.transactionsToday, 0);

  // Average transaction value
  const atv = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  // Count critical alerts (recent error events in last 5 minutes)
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const criticalAlerts = s.events.filter(
    e => e.type === "error" && e.timestamp.getTime() > fiveMinAgo
  ).length;

  // Low stock count
  let lowStockSlots = 0;
  for (const machine of s.machines) {
    for (const slot of machine.planogram) {
      if (slot.stock <= 2 && slot.productId) lowStockSlots++;
    }
  }

  return {
    total,
    online,
    warning,
    error,
    offline,
    totalRevenue,
    totalTransactions,
    atv,
    criticalAlerts,
    lowStockSlots,
  };
}
