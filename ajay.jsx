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

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}

import { Button } from "@/components/ui/button"

export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button>Button</Button>
    </div>
  )
}


"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function DraggableHeader({ column, header, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      onClick={column.getToggleSortingHandler()}
      className="cursor-pointer px-4 py-2 text-left font-medium text-sm text-muted-foreground"
    >
      <div className="flex items-center gap-1">
        {children}
        {header.getIsSorted() === "asc" ? (
          <ArrowUpWideNarrow size={16} />
        ) : header.getIsSorted() === "desc" ? (
          <ArrowDownWideNarrow size={16} />
        ) : (
          <ChevronsUpDown size={16} />
        )}
      </div>
    </th>
  );
}

export default function CustomerList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const abortControllerRef = useRef(null);

  const initialPageSize = Number(searchParams.get("pageSize")) || 5;
  const initialPageIndex =
    searchParams.get("page") && Number(searchParams.get("page")) > 0
      ? Number(searchParams.get("page")) - 1
      : 0;

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sorting, setSorting] = useState([]);
  const [columnOrder, setColumnOrder] = useState([]);

  const updateUrlParams = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = controller;
    setLoading(true);

    const fetchData = async () => {
      try {
        const sortBy = sorting.map((s) => s.id).join(",");
        const sortOrder = sorting.map((s) => (s.desc ? "desc" : "asc")).join(",");

        const params = new URLSearchParams({
          page: String(pageIndex + 1),
          limit: String(pageSize),
          search: globalFilter,
          sortBy,
          sortOrder,
        });

        const res = await fetch(`/api/dashboard/customers?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

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

    fetchData();
    return () => controller.abort();
  }, [globalFilter, pageIndex, pageSize, sorting]);

  const defaultColumns = useMemo(() => [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "first_name", header: "FIRST NAME" },
    { accessorKey: "last_name", header: "LAST NAME" },
    { accessorKey: "company", header: "COMPANY" },
    { accessorKey: "email", header: "EMAIL" },
    {
      id: "created_at",
      header: "REGISTERED ON",
      accessorFn: (row) => dayjs(row.created_at).format("MMM DD, YYYY"),
    },
    {
      id: "actions",
      header: "ACTIONS",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/dashboard/customers/edit/${row.original.id}`)}
          className="text-blue-500 hover:text-blue-700"
          aria-label={`Edit customer ${row.original.id}`}
        >
          <SquarePen size={18} />
        </button>
      ),
    },
  ], [router]);

  const columns = useMemo(() => {
    const colMap = Object.fromEntries(defaultColumns.map((col) => [col.id || col.accessorKey, col]));
    return columnOrder.length
      ? columnOrder.map((id) => colMap[id]).filter(Boolean)
      : defaultColumns;
  }, [columnOrder, defaultColumns]);

  const table = useReactTable({
    data: users,
    columns,
    pageCount: Math.ceil(totalCount / pageSize),
    state: { pagination: { pageIndex, pageSize }, globalFilter, sorting },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: ({ pageIndex, pageSize }) => {
      setPageIndex(pageIndex);
      setPageSize(pageSize);
      updateUrlParams("page", pageIndex + 1);
      updateUrlParams("pageSize", pageSize);
    },
    onSortingChange: (sort) => {
      setSorting(sort);
      updateUrlParams("sortBy", sort.map((s) => s.id).join(","));
      updateUrlParams("sortOrder", sort.map((s) => (s.desc ? "desc" : "asc")).join(","));
    },
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value);
      setPageIndex(0);
      updateUrlParams("page", "1");
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = columns.findIndex((c) => (c.id || c.accessorKey) === active.id);
    const newIndex = columns.findIndex((c) => (c.id || c.accessorKey) === over.id);
    const newOrder = arrayMove(columns.map((c) => c.id || c.accessorKey), oldIndex, newIndex);
    setColumnOrder(newOrder);
  };

  return (
    <div className="container mx-auto mt-6 px-4">
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search customers..."
          className="w-full md:w-1/3 rounded-md border border-gray-300 px-4 py-2 text-sm"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          disabled={loading}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              const size = Number(value);
              setPageSize(size);
              setPageIndex(0);
              updateUrlParams("page", "1");
              updateUrlParams("pageSize", value);
            }}
          >
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue placeholder="Page Size">{pageSize}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <SortableContext
                  key={headerGroup.id}
                  items={headerGroup.headers.map((h) => h.column.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tr>
                    {headerGroup.headers.map((header) => (
                      <DraggableHeader
                        key={header.id}
                        column={header.column}
                        header={header}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </DraggableHeader>
                    ))}
                  </tr>
                </SortableContext>
              ))}
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {columns.map((_, j) => (
                        <td key={j} className="px-4 py-2">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.length === 0
                ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No customers found.
                      </td>
                    </tr>
                  )
                : table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </DndContext>
      </div>

      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => table.previousPage()}
              className={
                table.getCanPreviousPage()
                  ? ""
                  : "pointer-events-none opacity-50"
              }
              href="#"
            />
          </PaginationItem>

          {[...Array(Math.ceil(totalCount / pageSize))].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                isActive={i === pageIndex}
                onClick={() => {
                  setPageIndex(i);
                  updateUrlParams("page", String(i + 1));
                }}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => table.nextPage()}
              className={
                table.getCanNextPage() ? "" : "pointer-events-none opacity-50"
              }
              href="#"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}


// Latest code running 
// npm install @tanstack/react-table
// npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers
// npm install papaparse xlsx
// npm install dayjs


"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "use-debounce";
import { ChevronDown, Ellipsis, Download } from "lucide-react";
import dayjs from "dayjs";
import { Label } from "@/components/ui/label";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SquarePen,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronsUpDown,
} from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const abortControllerRef = useRef(null);

  const initialPageSize = Number(searchParams.get("pageSize")) || 5;
  const initialPageIndex =
    searchParams.get("page") && Number(searchParams.get("page")) > 0
      ? Number(searchParams.get("page")) - 1
      : 0;

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [debouncedSearch] = useDebounce(globalFilter, 500);
  const [sorting, setSorting] = useState([]);

  const updateUrlParams = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const sortableId = useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

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
        if (err.name !== "AbortError") {
          console.error("Fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    return () => abortControllerRef.current?.abort();
  }, [debouncedSearch, pageIndex, pageSize, sorting]);

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "first_name", header: "FIRST NAME" },
      { accessorKey: "last_name", header: "LAST NAME" },
      { accessorKey: "company", header: "COMPANY" },
      { accessorKey: "email", header: "EMAIL" },
      {
        id: "created_at",
        header: "REGISTERED ON",
        accessorFn: (row) => dayjs(row.created_at).format("MMM DD, YYYY"),
      },
      {
        id: "actions",
        header: "ACTIONS",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            onClick={() =>
              router.push(`/dashboard/customers/edit/${row.original.id}`)
            }
            className="text-blue-500 hover:text-blue-700"
            aria-label={`Edit customer ${row.original.id}`}
          >
            <SquarePen size={18} />
          </button>
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
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndex(next.pageIndex);
      setPageSize(next.pageSize);
      updateUrlParams("page", next.pageIndex + 1);
      updateUrlParams("pageSize", next.pageSize);
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      updateUrlParams("sortBy", updater.map((s) => s.id).join(","));
      updateUrlParams(
        "sortOrder",
        updater.map((s) => (s.desc ? "desc" : "asc")).join(",")
      );
    },
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value);
      setPageIndex(0);
      updateUrlParams("page", "1");
    },
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

  const paginationItems = useMemo(() => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const current = pageIndex + 1;
    const pagesToShow = 5;
    const pageNumbers = [];

    const showLeftEllipsis = current > 3;
    const showRightEllipsis = current < totalPages - 2;

    const start = Math.max(1, current - 1);
    const end = Math.min(totalPages, current + 1);

    if (!showLeftEllipsis) {
      for (let i = 1; i <= Math.min(pagesToShow, totalPages); i++) {
        pageNumbers.push(i);
      }
    } else if (!showRightEllipsis) {
      for (let i = totalPages - pagesToShow + 1; i <= totalPages; i++) {
        if (i > 0) pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      pageNumbers.push("left-ellipsis");
      for (let i = start; i <= end; i++) pageNumbers.push(i);
      pageNumbers.push("right-ellipsis");
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  }, [pageIndex, totalCount, pageSize]);

  // Handle Drag
  function handleDragEnd(event) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="container mx-auto mt-6 px-4">
      {/* Search & Page Size */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search customers..."
          className="w-full md:w-1/3 rounded-md border border-gray-300 px-4 py-2 text-sm"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          disabled={loading}
        />

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <span className="hidden lg:inline">Customize Columns</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* List */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Ellipsis className="hidden lg:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  {" "}
                  <Download /> Export all to .json
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {" "}
                  <Download /> Export all to .csv
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {" "}
                  <Download /> Export all to .xlsx
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table className="min-w-full divide-y divide-gray-200">
            {/* Always render thead */}
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
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
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                // Show skeleton rows while loading
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(columns.length)].map((_, j) => (
                      <td key={j} className="px-4 py-2">
                        <div className="h-4 w-full bg-muted rounded-md" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-4 text-muted-foreground"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
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
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <div className="flex items-center justify-between px-4 mt-6">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        {/* Pagination */}
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => table.previousPage()}
                    className={
                      table.getCanPreviousPage()
                        ? ""
                        : "pointer-events-none opacity-50"
                    }
                    href="#"
                  />
                </PaginationItem>

                {paginationItems.map((page, index) =>
                  page === "left-ellipsis" || page === "right-ellipsis" ? (
                    <PaginationItem key={index}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        isActive={page === pageIndex + 1}
                        onClick={() => {
                          setPageIndex(page - 1);
                          updateUrlParams("page", page.toString());
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => table.nextPage()}
                    className={
                      table.getCanNextPage()
                        ? ""
                        : "pointer-events-none opacity-50"
                    }
                    href="#"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}

