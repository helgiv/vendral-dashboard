/**
 * ============================================================
 * Vendral – Simulated Data Layer
 * ============================================================
 * 
 * This module is the "brain" of the prototype. It generates:
 *   • 50 products with names, prices (ISK 300–2000), and sales weights
 *   • 20 vending machines across 5 Icelandic locations
 *   • Random sales transactions distributed by product weight
 *   • System events (low stock, errors, motor jams, etc.)
 *
 * KEY CONCEPT: "Weighted Random Selection"
 * -----------------------------------------
 * Each product has a `weight` of 1–3. Higher weight = more likely
 * to be "sold" in a simulation tick. We use this to create realistic
 * sales distributions where popular items (Coke, water) sell faster.
 *
 * This file exports pure data + helper functions.
 * The real-time simulation loop lives in `src/lib/simulation.ts`.
 * ============================================================
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Represents a single product in the vending machine catalog */
export interface Product {
  id: string;
  name: string;
  /** Price in Icelandic Króna (ISK) */
  price: number;
  /** Sales weight: 1 = slow seller, 2 = average, 3 = popular */
  weight: number;
  /** Category for grouping in the UI */
  category: "beverage" | "snack" | "candy" | "fresh";
  /** Emoji icon (used as placeholder for product images) */
  icon: string;
}

/** Hardware component status for a vending machine */
export interface HardwareStatus {
  billValidator: "OK" | "WARNING" | "ERROR";
  cardReader: "OK" | "WARNING" | "ERROR";
  temperature: number; // in Celsius
  connectivity: number; // percentage 0-100
  connectionType: "4G" | "WiFi" | "Ethernet";
  motorBoard: "OK" | "WARNING" | "ERROR";
  display: "OK" | "WARNING" | "ERROR";
}

/** A single slot in the virtual planogram grid */
export interface PlanogramSlot {
  row: number;
  col: number;
  productId: string | null;
  /** Current stock level (0 to maxStock) */
  stock: number;
  maxStock: number;
  price: number;
}

/** The overall status of a vending machine */
export type MachineStatus = "online" | "warning" | "error" | "offline";

/** Represents one vending machine in the fleet */
export interface VendingMachine {
  id: string;
  /** Human-readable name (e.g., "Kringlan #1") */
  name: string;
  location: Location;
  status: MachineStatus;
  hardware: HardwareStatus;
  /** 10 rows × 6 columns = 60 slots */
  planogram: PlanogramSlot[];
  /** Total revenue today in ISK */
  revenueToday: number;
  /** Total transactions today */
  transactionsToday: number;
  /** Last time a transaction occurred */
  lastActivity: Date;
  /** Installed firmware version */
  firmware: string;
}

/** A geographic location with a cluster of machines */
export interface Location {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
}

/** A sales transaction event */
export interface Transaction {
  id: string;
  machineId: string;
  machineName: string;
  productId: string;
  productName: string;
  amount: number; // ISK
  /** All payments are by card in Vendral */
  paymentMethod: "card";
  timestamp: Date;
  success: boolean;
}

/** A system/hardware event */
export interface SystemEvent {
  id: string;
  machineId: string;
  machineName: string;
  type: "info" | "warning" | "error" | "success";
  category: "transaction" | "hardware" | "stock" | "connectivity" | "system";
  message: string;
  timestamp: Date;
  /** Technical log code (shown in terminal) */
  code: string;
}

// ============================================================
// PRODUCT CATALOG – 50 products
// ============================================================
// We define 50 realistic vending machine products.
// Weight 3 = popular, Weight 1 = niche/slow seller.

export const PRODUCTS: Product[] = [
  // ---- Beverages (most popular category) ----
  { id: "p01", name: "Coca-Cola 330ml",      price: 450,  weight: 3, category: "beverage", icon: "🥤" },
  { id: "p02", name: "Pepsi 330ml",          price: 420,  weight: 2, category: "beverage", icon: "🥤" },
  { id: "p03", name: "Sprite 330ml",         price: 420,  weight: 2, category: "beverage", icon: "🥤" },
  { id: "p04", name: "Fanta Orange 330ml",   price: 420,  weight: 2, category: "beverage", icon: "🥤" },
  { id: "p05", name: "Icelandic Water 500ml",price: 350,  weight: 3, category: "beverage", icon: "💧" },
  { id: "p06", name: "Sparkling Water 500ml",price: 380,  weight: 2, category: "beverage", icon: "💧" },
  { id: "p07", name: "Red Bull 250ml",       price: 590,  weight: 3, category: "beverage", icon: "⚡" },
  { id: "p08", name: "Monster Energy 500ml", price: 650,  weight: 2, category: "beverage", icon: "⚡" },
  { id: "p09", name: "Orange Juice 330ml",   price: 480,  weight: 2, category: "beverage", icon: "🍊" },
  { id: "p10", name: "Apple Juice 330ml",    price: 480,  weight: 1, category: "beverage", icon: "🍎" },
  { id: "p11", name: "Iced Coffee Latte",    price: 550,  weight: 3, category: "beverage", icon: "☕" },
  { id: "p12", name: "Iced Tea Peach",       price: 420,  weight: 2, category: "beverage", icon: "🍑" },
  { id: "p13", name: "Chocolate Milk 250ml", price: 390,  weight: 2, category: "beverage", icon: "🍫" },
  { id: "p14", name: "Protein Shake",        price: 750,  weight: 1, category: "beverage", icon: "💪" },
  { id: "p15", name: "Kombucha Ginger",      price: 680,  weight: 1, category: "beverage", icon: "🫚" },
  // ---- Snacks ----
  { id: "p16", name: "Doritos Nacho 70g",    price: 450,  weight: 3, category: "snack",    icon: "🌮" },
  { id: "p17", name: "Lay's Classic 70g",    price: 420,  weight: 3, category: "snack",    icon: "🥔" },
  { id: "p18", name: "Pringles Original",    price: 550,  weight: 2, category: "snack",    icon: "🥔" },
  { id: "p19", name: "Cheetos Crunchy",      price: 420,  weight: 2, category: "snack",    icon: "🧀" },
  { id: "p20", name: "Popcorn Butter 50g",   price: 380,  weight: 2, category: "snack",    icon: "🍿" },
  { id: "p21", name: "Mixed Nuts 60g",       price: 590,  weight: 1, category: "snack",    icon: "🥜" },
  { id: "p22", name: "Trail Mix 80g",        price: 650,  weight: 1, category: "snack",    icon: "🥜" },
  { id: "p23", name: "Rice Crackers",        price: 380,  weight: 1, category: "snack",    icon: "🍘" },
  { id: "p24", name: "Beef Jerky 50g",       price: 850,  weight: 1, category: "snack",    icon: "🥩" },
  { id: "p25", name: "Pretzel Bites",        price: 350,  weight: 2, category: "snack",    icon: "🥨" },
  // ---- Candy & Chocolate ----
  { id: "p26", name: "Snickers Bar",         price: 380,  weight: 3, category: "candy",    icon: "🍫" },
  { id: "p27", name: "Kit Kat",              price: 350,  weight: 3, category: "candy",    icon: "🍫" },
  { id: "p28", name: "Twix Bar",             price: 380,  weight: 2, category: "candy",    icon: "🍫" },
  { id: "p29", name: "M&M's Peanut 45g",    price: 420,  weight: 2, category: "candy",    icon: "🍬" },
  { id: "p30", name: "Skittles 45g",         price: 380,  weight: 2, category: "candy",    icon: "🌈" },
  { id: "p31", name: "Haribo Gummy Bears",   price: 350,  weight: 2, category: "candy",    icon: "🐻" },
  { id: "p32", name: "Mentos Roll",          price: 300,  weight: 1, category: "candy",    icon: "🍬" },
  { id: "p33", name: "Orbit Gum",            price: 300,  weight: 2, category: "candy",    icon: "🫧" },
  { id: "p34", name: "Toblerone 50g",        price: 550,  weight: 1, category: "candy",    icon: "🍫" },
  { id: "p35", name: "Dark Chocolate 70%",   price: 620,  weight: 1, category: "candy",    icon: "🍫" },
  // ---- Fresh & Healthy ----
  { id: "p36", name: "Greek Yogurt Cup",     price: 580,  weight: 2, category: "fresh",    icon: "🥛" },
  { id: "p37", name: "Fruit Cup Mixed",      price: 650,  weight: 1, category: "fresh",    icon: "🍇" },
  { id: "p38", name: "Hummus & Crackers",    price: 720,  weight: 1, category: "fresh",    icon: "🫘" },
  { id: "p39", name: "Caesar Wrap",          price: 950,  weight: 2, category: "fresh",    icon: "🌯" },
  { id: "p40", name: "Club Sandwich",        price: 1100, weight: 2, category: "fresh",    icon: "🥪" },
  { id: "p41", name: "Chicken Salad",        price: 1200, weight: 1, category: "fresh",    icon: "🥗" },
  { id: "p42", name: "Sushi Box 8pc",        price: 1800, weight: 1, category: "fresh",    icon: "🍣" },
  { id: "p43", name: "Pasta Bowl",           price: 1400, weight: 1, category: "fresh",    icon: "🍝" },
  { id: "p44", name: "Energy Bar",           price: 450,  weight: 2, category: "fresh",    icon: "💪" },
  { id: "p45", name: "Banana",               price: 300,  weight: 2, category: "fresh",    icon: "🍌" },
  { id: "p46", name: "Apple",                price: 300,  weight: 2, category: "fresh",    icon: "🍎" },
  { id: "p47", name: "Carrot Sticks",        price: 380,  weight: 1, category: "fresh",    icon: "🥕" },
  { id: "p48", name: "Overnight Oats",       price: 650,  weight: 1, category: "fresh",    icon: "🥣" },
  { id: "p49", name: "Smoothie Berry 350ml", price: 780,  weight: 2, category: "fresh",    icon: "🫐" },
  { id: "p50", name: "Açaí Bowl",            price: 1950, weight: 1, category: "fresh",    icon: "🫐" },
];

// ============================================================
// LOCATIONS – 5 Icelandic locations
// ============================================================
// Lat/Lng are approximate centers for each location.

export const LOCATIONS: Location[] = [
  { id: "loc1", name: "Kringlan Mall",          city: "Reykjavík",    lat: 64.1280, lng: -21.8935 },
  { id: "loc2", name: "Smáralind Mall",         city: "Kópavogur",    lat: 64.1055, lng: -21.8789 },
  { id: "loc3", name: "Akureyri Airport",       city: "Akureyri",     lat: 65.6590, lng: -18.0878 },
  { id: "loc4", name: "University of Iceland",  city: "Reykjavík",    lat: 64.1400, lng: -21.9503 },
  { id: "loc5", name: "KEF Airport Terminal",   city: "Keflavík",     lat: 63.9850, lng: -22.6056 },
];

// ============================================================
// MACHINE GENERATION
// ============================================================

/**
 * Creates the initial planogram (product grid) for a machine.
 * 10 rows × 6 columns = 60 slots.
 * Products are randomly assigned with weighted probability.
 */
function createPlanogram(): PlanogramSlot[] {
  const slots: PlanogramSlot[] = [];

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 6; col++) {
      // Pick a random product using weighted selection
      const product = weightedRandomProduct();
      const maxStock = Math.floor(Math.random() * 5) + 6; // 6-10 items
      const stock = Math.floor(Math.random() * maxStock) + 1;

      slots.push({
        row,
        col,
        productId: product.id,
        stock,
        maxStock,
        price: product.price,
      });
    }
  }

  return slots;
}

/**
 * Weighted random product selection.
 * Products with weight=3 are 3× more likely to be chosen than weight=1.
 *
 * HOW IT WORKS:
 * 1. Sum all product weights (e.g., total might be 95)
 * 2. Pick random number 0–95
 * 3. Walk through products, subtracting each weight
 * 4. When cumulative weight exceeds random number, that's our pick
 */
export function weightedRandomProduct(): Product {
  const totalWeight = PRODUCTS.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const product of PRODUCTS) {
    random -= product.weight;
    if (random <= 0) return product;
  }

  // Fallback (should never reach here)
  return PRODUCTS[0];
}

/**
 * Generates the 20 vending machines across 5 locations (4 per location).
 * Each machine gets a unique ID, random hardware status, and planogram.
 */
export function generateMachines(): VendingMachine[] {
  const machines: VendingMachine[] = [];
  const firmwareVersions = ["3.2.1", "3.2.0", "3.1.8", "3.1.5"];

  let machineIndex = 1;

  for (const location of LOCATIONS) {
    // 4 machines per location = 20 total
    for (let i = 0; i < 4; i++) {
      const id = `VM-${String(machineIndex).padStart(3, "0")}`;
      
      // Most machines are online, some have issues
      const statusRoll = Math.random();
      let status: MachineStatus = "online";
      if (statusRoll > 0.9) status = "error";
      else if (statusRoll > 0.75) status = "warning";
      else if (statusRoll > 0.7) status = "offline";

      const hardware: HardwareStatus = {
        billValidator: status === "error" ? "ERROR" : "OK",
        cardReader: "OK",
        temperature: 3 + Math.round(Math.random() * 3), // 3-6°C
        connectivity: status === "offline" ? 0 : 70 + Math.floor(Math.random() * 30),
        connectionType: Math.random() > 0.5 ? "4G" : "WiFi",
        motorBoard: status === "error" && Math.random() > 0.5 ? "ERROR" : "OK",
        display: "OK",
      };

      machines.push({
        id,
        name: `${location.name} #${i + 1}`,
        location,
        status,
        hardware,
        planogram: createPlanogram(),
        revenueToday: Math.floor(Math.random() * 80000) + 10000, // 10k-90k ISK
        transactionsToday: Math.floor(Math.random() * 120) + 20,
        lastActivity: new Date(Date.now() - Math.random() * 3600000), // within last hour
        firmware: firmwareVersions[Math.floor(Math.random() * firmwareVersions.length)],
      });

      machineIndex++;
    }
  }

  return machines;
}

// ============================================================
// HELPER: Find product by ID
// ============================================================
export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id);
}

// ============================================================
// HELPER: Format ISK currency
// ============================================================
/**
 * Formats a number as Icelandic Króna (ISK).
 * Example: 45000 → "45.000 ISK"
 */
export function formatISK(amount: number): string {
  return `${amount.toLocaleString("is-IS")} ISK`;
}

/**
 * Compact format for large numbers.
 * Example: 1234567 → "1.2M"
 */
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toString();
}
