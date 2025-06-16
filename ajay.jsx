"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import dayjs from "dayjs";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  SquarePen,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronsUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerList() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [debouncedSearch] = useDebounce(globalFilter, 500);
  const [pageSize, setPageSize] = useState(5);
  const [sorting, setSorting] = useState([]);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const sortBy = sorting.map((s) => s.id).join(",");
        const sortOrder = sorting
          .map((s) => (s.desc ? "desc" : "asc"))
          .join(",");

        const params = new URLSearchParams({
          page: String(pageIndex + 1),
          limit: String(pageSize),
          search: debouncedSearch,
          sortBy,
          sortOrder,
        });

        const res = await fetch(
          `/api/dashboard/customers?${params.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!res.ok) throw new Error("Failed to fetch users");

        const data = await res.json();
        setUsers(data.users || []);
        setTotalCount(data.totalCount || 0);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    return () => abortControllerRef.current?.abort();
  }, [debouncedSearch, pageIndex, sorting]);

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "first_name", header: "First Name" },
      { accessorKey: "last_name", header: "Last Name" },
      { accessorKey: "company", header: "Company" },
      { accessorKey: "email", header: "Email" },
      {
        id: "created_at",
        header: "Registered On",
        accessorFn: (row) => dayjs(row.created_at).format("MMM DD, YYYY"),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            
            onClick={() =>
              router.push(`/dashboard/customers/edit/${row.original.id}`)
            }
          >
            <SquarePen className="cursor-pointer" size={16} />
          </Button>
        ),
      },
    ],
    [router]
  );

  const table = useReactTable({
    data: users,
    columns,
    pageCount: Math.ceil(totalCount / pageSize),
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
      globalFilter,
      sorting,
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: (updater) => {
      const nextPage =
        typeof updater === "function"
          ? updater({ pageIndex }).pageIndex
          : updater.pageIndex;
      setPageIndex(nextPage);
    },
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value);
      setPageIndex(0);
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const renderSortIcon = (column) => {
    if (!column.getCanSort()) return null;
    const isSorted = column.getIsSorted();
    if (isSorted === "asc") return <ArrowUpWideNarrow size={16} />;
    if (isSorted === "desc") return <ArrowDownWideNarrow size={16} />;
    return <ChevronsUpDown size={16} />;
  };

  return (
    <div className="p-4">
      {/* Search Input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search customers..."
          value={globalFilter}
          autoFac
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4">
                {[...Array(6)].map((_, j) => (
                  <Skeleton
                    key={j}
                    className="h-4 rounded-md bg-muted w-full"
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer px-4 py-2 text-left font-medium text-sm text-muted-foreground"
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {renderSortIcon(header.column)}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center text-muted-foreground py-4"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 text-sm">
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
        )}
      </div>

      {/* Pagination */}
      <Pagination className="mt-4">
        <PaginationContent className="flex items-center justify-between w-full">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => table.previousPage()}
              className={
                table.getCanPreviousPage()
                  ? ""
                  : "pointer-events-none opacity-50"
              }
            />
          </PaginationItem>
          <span className="text-sm text-muted-foreground">
            Page {pageIndex + 1} of {Math.ceil(totalCount / pageSize)}
          </span>
          <PaginationItem>
            <PaginationNext
              onClick={() => table.nextPage()}
              className={
                table.getCanNextPage() ? "" : "pointer-events-none opacity-50"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
