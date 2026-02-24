/**
 * ============================================================
 * Client Providers Wrapper
 * ============================================================
 *
 * WHY THIS FILE EXISTS:
 * In Next.js App Router, layout.tsx is a Server Component by default.
 * Server Components can't use hooks (useState, useEffect, useContext).
 * But our SimulationProvider and TooltipProvider NEED hooks.
 *
 * SOLUTION: Create a thin Client Component that wraps the providers.
 * The layout.tsx imports this, and Next.js handles the boundary.
 *
 * This is a common pattern in Next.js called the "Provider Pattern."
 *
 * TANSTACK QUERY (React Query):
 * QueryClientProvider is the top-level provider for TanStack Query.
 * It holds a QueryClient instance that manages the cache, defaults,
 * and background refetching behaviour for all useQuery/useMutation hooks.
 *
 * In this prototype we create the QueryClient once inside state
 * (so it survives re-renders but is unique per client session).
 * In production you'd configure `staleTime`, `gcTime`, retries, etc.
 * ============================================================
 */

"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SimulationProvider } from "@/lib/simulation-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  /**
   * Create the QueryClient inside useState so it is:
   *  1. Created only once (the initializer function runs on first render)
   *  2. Unique to this browser tab (no cross-request leaking on the server)
   *
   * We set some reasonable defaults:
   *  - staleTime: 30 s → data is considered "fresh" for 30 seconds.
   *    During that window, navigating back to a page that uses the same
   *    query will NOT trigger a refetch – it will show the cached data.
   *  - refetchOnWindowFocus: true → re-fetches when the user returns
   *    to the browser tab (good for keeping dashboards up-to-date).
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SimulationProvider>
        {/* delayDuration=0 makes tooltips appear instantly on hover */}
        <TooltipProvider delayDuration={0}>
          {children}
        </TooltipProvider>
      </SimulationProvider>
    </QueryClientProvider>
  );
}
