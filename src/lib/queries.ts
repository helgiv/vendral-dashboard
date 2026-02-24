/**
 * ============================================================
 * Vendral – TanStack Query Hooks
 * ============================================================
 *
 * WHAT IS TANSTACK QUERY?
 * TanStack Query (formerly React Query) is a data-fetching library
 * that gives you:
 *   • Automatic caching → same data isn't fetched twice
 *   • Background refetching → stale data is refreshed silently
 *   • Loading / error / success states → no manual useState!
 *   • Devtools → inspect the cache in the browser
 *
 * HOW WE USE IT HERE:
 * In this prototype there's no real REST API – our data comes from
 * the in-memory simulation. But we still wrap the getters in
 * useQuery so you can see the pattern. In production you'd replace
 * the `queryFn` with a real `fetch("/api/fleet-stats")` call.
 *
 * KEY CONCEPTS:
 * -------------
 * `useQuery({ queryKey, queryFn })`
 *   - queryKey: A unique array that identifies this data. If any
 *     element in the key changes, the query is re-executed.
 *   - queryFn: An async function that returns the data.
 *   - Returns: { data, isLoading, isError, error, refetch }
 *
 * `refetchInterval`: Tells React Query to re-run the queryFn every
 *   N milliseconds. Perfect for live dashboards!
 *
 * `queryKey` NAMING CONVENTION:
 *   We use arrays like ["fleet", "stats"] or ["fleet", "hourly"].
 *   TanStack Query uses these as cache keys. If two components
 *   use the same key, they share the same cached data.
 * ============================================================
 */

import { useQuery } from "@tanstack/react-query";
import {
  getFleetStats,
  getHourlyData,
  getTopProducts,
  getBottomProducts,
  getSalesHeatmap,
  getSimulationState,
} from "./simulation";

/**
 * Fetch fleet KPI stats (total revenue, machine counts, alerts).
 *
 * USAGE:
 * ```tsx
 * function MyComponent() {
 *   const { data: stats, isLoading } = useFleetStatsQuery();
 *   if (isLoading) return <Spinner />;
 *   return <p>Revenue: {stats.totalRevenue}</p>;
 * }
 * ```
 *
 * refetchInterval: 2000 means the data refreshes every 2 seconds,
 * keeping the dashboard live without manual polling.
 */
export function useFleetStatsQuery() {
  return useQuery({
    queryKey: ["fleet", "stats"],
    queryFn: () => getFleetStats(),
    refetchInterval: 2_000, // Refresh every 2 seconds for live data
  });
}

/**
 * Fetch 24-hour revenue + traffic data for charts.
 */
export function useHourlyDataQuery() {
  return useQuery({
    queryKey: ["fleet", "hourly"],
    queryFn: () => getHourlyData(),
    refetchInterval: 5_000, // Charts update every 5 seconds
  });
}

/**
 * Fetch top N products by revenue.
 *
 * NOTE: The queryKey includes `n` so that requesting top-5 and top-10
 * are stored as separate cache entries.
 */
export function useTopProductsQuery(n: number = 10) {
  return useQuery({
    queryKey: ["fleet", "topProducts", n],
    queryFn: () => getTopProducts(n),
    refetchInterval: 5_000,
  });
}

/**
 * Fetch bottom N products (dead stock).
 */
export function useBottomProductsQuery(n: number = 5) {
  return useQuery({
    queryKey: ["fleet", "bottomProducts", n],
    queryFn: () => getBottomProducts(n),
    refetchInterval: 5_000,
  });
}

/**
 * Fetch the sales heatmap grid (hour × day of week).
 */
export function useSalesHeatmapQuery() {
  return useQuery({
    queryKey: ["fleet", "salesHeatmap"],
    queryFn: () => getSalesHeatmap(),
    // Heatmap data is semi-static – refresh every 30 seconds
    refetchInterval: 30_000,
  });
}

/**
 * Fetch all machines for the fleet table / map.
 * Returns the current snapshot of the 20 machines.
 */
export function useMachinesQuery() {
  return useQuery({
    queryKey: ["fleet", "machines"],
    queryFn: () => getSimulationState().machines,
    refetchInterval: 2_000,
  });
}

/**
 * Fetch recent transactions for the transaction log.
 */
export function useTransactionsQuery() {
  return useQuery({
    queryKey: ["fleet", "transactions"],
    queryFn: () => getSimulationState().transactions,
    refetchInterval: 2_000,
  });
}

/**
 * Fetch recent system events for the event ticker.
 */
export function useEventsQuery() {
  return useQuery({
    queryKey: ["fleet", "events"],
    queryFn: () => getSimulationState().events,
    refetchInterval: 1_000,
  });
}
