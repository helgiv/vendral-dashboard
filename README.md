# 🧊 Vendral – IoT Vending Machine Fleet Dashboard

> A futuristic prototype dashboard for managing a fleet of smart vending machines across Iceland.
> Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**,
> **Recharts**, **TanStack Table**, **TanStack Query**, and **Framer Motion**.

![Dashboard](https://img.shields.io/badge/Status-Prototype-cyan)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)

---

## 📖 Table of Contents

1. [Quick Start](#-quick-start)
2. [Project Overview](#-project-overview)
3. [Tech Stack Explained](#-tech-stack-explained)
4. [Architecture](#-architecture)
5. [Folder Structure](#-folder-structure)
6. [Dashboard Sections](#-dashboard-sections)
7. [Data Simulation](#-data-simulation)
8. [Key Patterns & Concepts](#-key-patterns--concepts)
9. [Deployment](#-deployment)
10. [Troubleshooting](#-troubleshooting)
11. [Learning Resources](#-learning-resources)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in your browser
#    → http://localhost:3000
```

That's it! No environment variables, API keys, or databases needed.
The dashboard runs entirely in the browser using simulated data.

---

## 🌐 Project Overview

**Vendral** is a fictional IoT fleet management system for vending machines in Iceland.
This dashboard is a **fully self-contained prototype** that simulates:

- **20 vending machines** across 5 Icelandic locations
- **50 products** with realistic pricing in ISK (Icelandic Króna)
- **Live transactions** (card payments) generated every 2–4 seconds
- **Hardware events** (motor jams, connectivity, temperature) every 5–10 seconds
- **Stock depletion** that triggers low-stock and out-of-stock alerts

All payments are simulated as **card transactions** (no cash).

---

## 🛠 Tech Stack Explained

If you're new to any of these technologies, here's what each one does:

### Next.js (v16)

The **React framework** that handles routing, server-side rendering, and building.

- We use the **App Router** (the `src/app/` directory).
- `layout.tsx` wraps every page; `page.tsx` is the main route.
- `"use client"` directive marks components that need browser APIs (hooks, events).

### TypeScript – Type Safety

**JavaScript with types.** Every variable, function parameter, and return value
has a declared type. This catches bugs at compile time instead of runtime.
Look for `interface` and `type` keywords in the code.

### Tailwind CSS (v4)

A **utility-first CSS framework.** Instead of writing CSS classes like `.card`,
you compose styles directly: `className="bg-white/5 rounded-lg p-4 border"`.
Tailwind v4 uses CSS-native config (in `globals.css`) instead of `tailwind.config.js`.

### shadcn/ui – Component Library

A collection of **copy-paste React components** (Button, Badge, Progress, Tooltip, etc.)
built on Radix UI primitives. They live in `src/components/ui/` and are fully customizable.

### Recharts – Charting

A **charting library** for React. We use it for area charts, and the concepts apply
to bar charts, line charts, pie charts, etc. Key components:

- `<ResponsiveContainer>` → auto-sizes the chart to its parent
- `<AreaChart data={...}>` → the chart type
- `<Area>`, `<XAxis>`, `<YAxis>`, `<Tooltip>` → composable building blocks

### TanStack Table (v8)

A **headless table library.** "Headless" means it provides the logic (sorting,
filtering, pagination) but zero UI — you bring your own markup and styling.
See `src/components/transaction-table.tsx` for a full working example.

### TanStack Query (v5)

A **data-fetching & caching library.** It manages loading states, caching,
background refetching, and error handling. Key hook: `useQuery({ queryKey, queryFn })`.
See `src/lib/queries.ts` for our custom hooks and `src/components/settings-page.tsx`
for a live demo comparing TanStack Query vs React Context.

### Framer Motion – Animations

An **animation library** for React. We use it for:

- Page transitions (`AnimatePresence` + `motion.div` in `page.tsx`)
- List animations (event ticker items sliding in)
- Hover/tap effects (planogram slot scaling)

### Lucide React

An **icon library** with 1000+ clean SVG icons. Usage: `<Monitor className="w-4 h-4" />`.

---

## 🏗 Architecture

```text
┌──────────────────────────────────────────────────┐
│                Browser (Client)                   │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │     ClientProviders (client-providers.tsx)    │ │
│  │  ┌──────────────────────────────────────┐   │ │
│  │  │   QueryClientProvider (TanStack Q)   │   │ │
│  │  │  ┌───────────────────────────────┐  │   │ │
│  │  │  │  SimulationProvider (Context)  │  │   │ │
│  │  │  │  ┌──────────┐ ┌───────────┐  │  │   │ │
│  │  │  │  │Simulation│→│  Context   │  │  │   │ │
│  │  │  │  │ Engine   │ │  (State)   │  │  │   │ │
│  │  │  │  └──────────┘ └─────┬─────┘  │  │   │ │
│  │  │  │                     │         │  │   │ │
│  │  │  │    ┌────────────────┴───┐     │  │   │ │
│  │  │  │    │  Dashboard Pages   │     │  │   │ │
│  │  │  │    │  (Overview, Sales, │     │  │   │ │
│  │  │  │    │   Map, Planogram)  │     │  │   │ │
│  │  │  │    └────────────────────┘     │  │   │ │
│  │  │  └───────────────────────────────┘  │   │ │
│  │  └──────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Data flow:**

1. `simulation.ts` runs intervals that generate transactions + events
2. `simulation-context.tsx` wraps the data in React Context (1-second tick)
3. Components call `useSimulation()` to read machines, transactions, events
4. Alternatively, components can use TanStack Query hooks from `queries.ts`

---

## 📁 Folder Structure

```text
src/
├── app/                          # Next.js App Router
│   ├── globals.css               # Tailwind v4 theme + glassmorphism utilities
│   ├── layout.tsx                # Root layout (fonts, providers)
│   └── page.tsx                  # Main dashboard shell (sidebar + tabs)
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives (Button, Badge, etc.)
│   ├── client-providers.tsx      # Client-side providers (Query + Simulation + Tooltip)
│   ├── sidebar.tsx               # Collapsible navigation sidebar
│   ├── stats-ribbon.tsx          # Top KPI ribbon (Revenue, Machines, Alerts)
│   ├── overview-dashboard.tsx    # Bento-box overview (fleet health, map, charts)
│   ├── fleet-health-bar.tsx      # Stacked bar: online/warning/error/offline
│   ├── event-ticker.tsx          # Live scrolling event feed
│   ├── geo-map.tsx               # SVG map of Iceland with cluster pins
│   ├── device-health.tsx         # Machine drill-down (3D kiosk, hardware stack, terminal)
│   ├── sales-dashboard.tsx       # Sales analytics (charts, heatmap, products)
│   ├── transaction-table.tsx     # TanStack Table: sortable/filterable TX log
│   ├── map-view.tsx              # Full map page with search + machine list
│   ├── planogram-view.tsx        # Virtual planogram grid with restock optimizer
│   └── settings-page.tsx         # Settings + TanStack Query demo
│
├── lib/                          # Shared utilities and data
│   ├── data.ts                   # Types, product catalog, machine generator
│   ├── simulation.ts             # Singleton simulation engine
│   ├── simulation-context.tsx    # React Context provider
│   ├── queries.ts                # TanStack Query hooks
│   └── utils.ts                  # cn() utility (clsx + tailwind-merge)
```

---

## 🖥 Dashboard Sections

### 1. System Overview (Default)

- **Fleet Health Bar**: Stacked horizontal bar showing machine status proportions
- **Mini Revenue Chart**: 24-hour area chart (Recharts)
- **Event Ticker**: Live feed of transactions and system events
- **SVG Map**: Iceland with color-coded location clusters
- **Top Products**: Best sellers with stock bars 
- **Machine Status**: Quick list sorted by urgency

### 2. Technical Monitoring

- **Machine Picker**: Grid of all 20 machines to select from
- **3D Kiosk SVG**: Visual representation of the selected machine
- **Hardware Stack**: 6-component status list (bill validator, card reader, temp, etc.)
- **Terminal Log**: Monospace event log with timestamps and error codes

### 3. Sales & Marketing

- **KPI Tiles**: Revenue, MTD, ATV, Conversion Rate with trend arrows
- **Dual-Axis Area Chart**: Revenue (ISK) vs Foot Traffic overlaid
- **Sales Heatmap**: Hour × Day-of-week grid (cyan intensity = sales volume)
- **Top/Bottom Products**: Best and worst sellers with stock indicators
- **Transaction Table**: Sortable, searchable table (TanStack Table)

### 4. Map & Location Filter

- **Full SVG Map**: Larger map with connection lines between locations
- **Search Bar**: Filter machines by ID, name, or city
- **Location Chips**: Quick filter by location
- **Machine Cards**: Detailed status with glow indicators and quick actions

### 5. Planogram View

- **10×6 Grid**: 60 slots with product icons, prices, stock bars
- **Color Coding**: 🔴 Empty, 🟠 Low (≤2), 🔵 Adequate (3+)
- **Restock Optimizer**: Toggle to highlight and pulse slots needing refill
- **Restock Summary**: Priority list grouped by product

### 6. Settings

- System info cards
- **TanStack Query Demo**: Live comparison of Context vs Query data fetching

---

## 🎲 Data Simulation

The simulation runs entirely in the browser (no server needed):

| Parameter | Value |
| --- | --- |
| Products | 50 (ISK 300-2,000, weights 1-3) |
| Machines | 20 (4 per location) |
| Locations | 5 (Reykjavik, Kopavogur, Akureyri, Keflavik) |
| Transaction rate | Every 2-4 seconds |
| Event rate | Every 5-10 seconds |
| Payment method | Card only (all transactions) |
| Currency | ISK (Icelandic Krona) |
| Planogram | 10 rows x 6 columns = 60 slots |

### Weighted Random Selection

Products have a `weight` property (1–3). Popular items like Coca-Cola (weight 3)
are 3× more likely to be "sold" than niche items like Açaí Bowl (weight 1).
See `weightedRandomProduct()` in `src/lib/data.ts`.

---

## 🔑 Key Patterns & Concepts

### Glassmorphism UI

The dark theme uses semi-transparent backgrounds with backdrop blur:

```css
.glass-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
```

### Provider Pattern (Next.js)

`layout.tsx` is a Server Component, but providers need client features.
Solution: wrap providers in a `"use client"` component (`client-providers.tsx`).

### Derived State vs. Effects

Instead of `useEffect(() => setState(prop), [prop])` (which causes cascading renders),
we use `useMemo` or direct computation to derive state from props.
See `device-health.tsx` and `planogram-view.tsx`.

### Headless Table (TanStack Table)

TanStack Table separates **logic** from **UI**. You define columns with `ColumnDef`,
create a table instance with `useReactTable()`, then render with `flexRender()`.
See `transaction-table.tsx` for a complete annotated example.

### TanStack Query Caching

Every `useQuery` call specifies a `queryKey` (cache key) and `queryFn` (data fetcher).
Multiple components using the same key share one cached response.
See `src/lib/queries.ts` for all hooks.

---

## 🚢 Deployment

### Option 1: Vercel (Recommended – Free Tier)

Vercel is the company behind Next.js and offers the smoothest deployment:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy (follow the prompts)
vercel

# 3. For production deployment
vercel --prod
```

Or use the **Vercel Dashboard**:

1. Push your code to GitHub / GitLab / Bitbucket
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Vercel auto-detects Next.js and deploys automatically

### Option 2: Static Export (Any static host)

Since this dashboard is entirely client-side, you can export it as static HTML:

```bash
# 1. Add output: 'export' to next.config.ts (see below)
# 2. Build the static export
npm run build
# 3. The output is in the `out/` folder
#    Upload to Netlify, Cloudflare Pages, GitHub Pages, S3, etc.
```

To enable static export, update `next.config.ts`:

```ts
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
};
export default nextConfig;
```

### Option 3: Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

For the standalone Docker output, add to `next.config.ts`:

```ts
const nextConfig = { output: 'standalone' };
```

Then build and run:

```bash
docker build -t vendral .
docker run -p 3000:3000 vendral
```

### Option 4: Node.js Server (Self-hosted)

```bash
# Build for production
npm run build

# Start the production server (port 3000)
npm start
```

---

## 🔧 Troubleshooting

### Recharts width/height warning

```text
The width(-1) and height(-1) of chart should be greater than 0
```

This is **harmless** — it happens during static page generation when there's no
real DOM to measure. The charts work perfectly in the browser.

### "Cannot find module" errors in VS Code

If VS Code shows red squiggles on imports but `npm run build` succeeds:

1. **Restart TypeScript**: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. **Rebuild**: `npm run build` to regenerate type definitions

### Port 3000 already in use

```bash
# Windows PowerShell: find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or just use a different port
npm run dev -- --port 3001
```

---

## 📚 Learning Resources

### Next.js – Learn More

- [Next.js Docs](https://nextjs.org/docs) — Official documentation
- [Learn Next.js](https://nextjs.org/learn) — Interactive tutorial

### TypeScript – Learn More

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) — Official guide
- [Total TypeScript](https://www.totaltypescript.com/) — Free beginner tutorials

### Tailwind CSS – Learn More

- [Tailwind Docs](https://tailwindcss.com/docs) — Class reference
- [Tailwind v4 Guide](https://tailwindcss.com/docs/upgrade-guide) — What changed in v4

### shadcn/ui – Learn More

- [shadcn/ui Docs](https://ui.shadcn.com/) — Component examples and installation

### Recharts – Learn More

- [Recharts API](https://recharts.org/en-US/api) — Component reference
- [Recharts Examples](https://recharts.org/en-US/examples) — Visual gallery

### TanStack Table – Learn More

- [TanStack Table Docs](https://tanstack.com/table/latest) — Official docs
- [TanStack Table Examples](https://tanstack.com/table/latest/docs/framework/react/examples/basic) — React examples

### TanStack Query – Learn More

- [TanStack Query Docs](https://tanstack.com/query/latest) — Official docs
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query) — Excellent blog series

### Framer Motion – Learn More

- [Framer Motion Docs](https://motion.dev/docs) — API reference

---

## 📄 License

This is a prototype / educational project. Use it however you like.

---

Built with ❄️ in Iceland
