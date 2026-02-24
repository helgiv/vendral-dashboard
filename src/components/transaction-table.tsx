/**
 * ============================================================
 * Vendral – Transaction Table (TanStack Table)
 * ============================================================
 *
 * A sortable, filterable table of recent sales transactions using
 * TanStack Table (formerly React Table v8).
 *
 * TANSTACK TABLE KEY CONCEPTS:
 * ------------------------------------------------------------
 * 1. **Column Definitions**: Describe each column (header, accessor, cell renderer)
 * 2. **useReactTable()**: The main hook — you give it data + columns,
 *    and it returns helpers for rendering (getHeaderGroups, getRowModel, etc.)
 * 3. **Sorting/Filtering**: Built-in plugins activated via `getSortedRowModel()`
 *    and `getFilteredRowModel()`. You just enable them and TanStack handles the rest.
 * 4. **Headless**: TanStack Table gives you the *logic* — you bring your own markup.
 *    This means full control over styling (perfect for our glassmorphism design).
 *
 * WHY TANSTACK TABLE?
 * It's the standard for data-rich React tables. It's headless (no locked-in
 * styling), tree-shakeable, and supports sorting, filtering, pagination,
 * row selection, column resizing, and virtual scrolling out of the box.
 * ============================================================
 */

"use client";

import React, { useState } from "react";
import { useSimulation } from "@/lib/simulation-context";
import { formatISK, type Transaction } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, CheckCircle2, XCircle } from "lucide-react";

/**
 * TanStack Table imports:
 * - ColumnDef: Type for defining columns (generic over your data type)
 * - useReactTable: The main hook that creates the table instance
 * - getCoreRowModel: Required — the basic row processing pipeline
 * - getSortedRowModel: Adds sorting support
 * - getFilteredRowModel: Adds global/column filtering
 * - flexRender: Helper to render cells (handles both strings and components)
 * - SortingState: Type for tracking which column is sorted + direction
 */
import {
  type ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";

// ============================================================
// COLUMN DEFINITIONS
// ============================================================
/**
 * Column definitions describe the structure of the table.
 * Each column maps to a property on the Transaction type.
 *
 * `accessorKey` tells TanStack which field to read from the row data.
 * `cell` is a custom render function for complex formatting.
 * `header` can be a string or a function (for sortable headers).
 */
const columns: ColumnDef<Transaction>[] = [
  {
    // Column: Status (success/failure icon)
    accessorKey: "success",
    header: "Status",
    /**
     * Custom cell renderer: show a green check or red X icon
     * `info.getValue()` returns the raw cell value (boolean)
     */
    cell: (info) => {
      const success = info.getValue<boolean>();
      return success ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      ) : (
        <XCircle className="w-4 h-4 text-rose-400" />
      );
    },
    // Disable sorting on status (not very useful to sort by)
    enableSorting: false,
  },
  {
    // Column: Transaction ID
    accessorKey: "id",
    header: "TX ID",
    cell: (info) => (
      <span className="font-mono text-xs text-cyan-400">
        {info.getValue<string>()}
      </span>
    ),
  },
  {
    // Column: Machine
    accessorKey: "machineName",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Machine
        <ArrowUpDown className="w-3 h-3" />
      </button>
    ),
  },
  {
    // Column: Product Name
    accessorKey: "productName",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Product
        <ArrowUpDown className="w-3 h-3" />
      </button>
    ),
  },
  {
    // Column: Amount (ISK)
    accessorKey: "amount",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="w-3 h-3" />
      </button>
    ),
    /** Format the raw number as ISK currency */
    cell: (info) => (
      <span className="font-medium text-foreground">
        {formatISK(info.getValue<number>())}
      </span>
    ),
  },
  {
    // Column: Payment Method
    accessorKey: "paymentMethod",
    header: "Payment",
    cell: () => (
      <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
        💳 Card
      </Badge>
    ),
  },
  {
    // Column: Timestamp
    accessorKey: "timestamp",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Time
        <ArrowUpDown className="w-3 h-3" />
      </button>
    ),
    /** Format Date as a readable time string */
    cell: (info) => {
      const date = info.getValue<Date>();
      return (
        <span className="text-xs text-muted-foreground">
          {date.toLocaleTimeString("en-US", { hour12: false })}
        </span>
      );
    },
    /** Tell TanStack how to sort dates (compare timestamps) */
    sortingFn: "datetime",
  },
];

// ============================================================
// TRANSACTION TABLE COMPONENT
// ============================================================

export function TransactionTable() {
  "use no memo"; // TanStack Table returns mutable objects; opt out of React Compiler memoization
  const { transactions } = useSimulation();

  /**
   * Sorting state tracks which column is sorted and in which direction.
   * Default: sort by timestamp descending (newest first).
   * SortingState is an array because TanStack supports multi-column sorting.
   */
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);

  /**
   * Global filter: a single search string applied across all columns.
   * TanStack automatically checks every column's value against this string.
   */
  const [globalFilter, setGlobalFilter] = useState("");

  /**
   * useReactTable is the core hook. It takes:
   * - data: your rows (Transaction[])
   * - columns: your column definitions
   * - state: current UI state (sorting, filters)
   * - on*Change: callbacks to update state when user interacts
   * - get*RowModel: pipeline plugins to process rows
   *
   * It returns a table instance with methods for rendering.
   */
  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="glass-card p-4">
      {/* Header with search */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Transaction Log
          </h3>
          <p className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {transactions.length} transactions
          </p>
        </div>

        {/* Global search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-white/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          {/* Table Head */}
          <thead>
            {/**
             * getHeaderGroups() returns header rows.
             * Most tables have one header group, but TanStack supports
             * grouped/nested headers for complex layouts.
             */}
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left py-2 px-2 text-muted-foreground font-medium"
                  >
                    {/**
                     * flexRender handles both string headers and
                     * React component headers (like our sortable buttons).
                     */}
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Table Body */}
          <tbody>
            {/**
             * getRowModel().rows returns the processed rows
             * (filtered, sorted, paginated — whatever plugins you enabled).
             */}
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  No transactions yet. Waiting for sales...
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border/20 hover:bg-white/5 transition-colors",
                    // Highlight failed transactions with a subtle red tint
                    !row.original.success && "bg-rose-500/5"
                  )}
                >
                  {/**
                   * getVisibleCells() returns cells for this row.
                   * flexRender renders the cell content using the
                   * cell function from our column definition.
                   */}
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-2 px-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Showing latest {Math.min(transactions.length, 200)} transactions (live updating)
        </span>
        <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">
          All Payments by Card 💳
        </Badge>
      </div>
    </div>
  );
}
