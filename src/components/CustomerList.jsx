// npm install @tanstack/react-table
// npm install papaparse xlsx

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
  const [sorting, setSorting] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [debouncedSearch] = useDebounce(globalFilter, 500);

  const updateUrlParams = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const sortableId = useId();
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
          // disabled={loading}
          style={{ cursor: 'text' }} 
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
                      className="cursor-pointer select-none px-4 py-2 text-left text-sm font-medium text-muted-foreground"
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
                  <TableRow key={i} className="animate-pulse">
                    {[...Array(columns.length)].map((_, j) => (
                      <td key={j} className="px-4 py-2">
                        <div className="h-4 w-full bg-muted rounded-md" />
                      </td>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-4 text-muted-foreground"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-2 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
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
