"use client";

import "react-tabs/style/react-tabs.css";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  Ellipsis,
  Download,
  ChevronsUpDown,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  SquarePen,
  GripVertical,
  EllipsisVertical,
} from "lucide-react";

import {
  PointerSensor,
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

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
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

// Fetch customers based on page, size, search, sorting
function useFetchCustomers({ pageIndex, pageSize, debouncedSearch, sorting }) {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const sortBy = sorting.length ? sorting[0].id : "sort_order";
        const sortOrder = sorting.length && sorting[0].desc ? "desc" : "asc";

        const params = new URLSearchParams({
          page: String(pageIndex + 1),
          limit: String(pageSize),
          search: debouncedSearch || "",
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
        console.log("API Response:", data);
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

    fetchData();

    // Cleanup on unmount or dependency change
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [
    pageIndex,
    pageSize,
    debouncedSearch,
    sorting.map((s) => `${s.id}:${s.desc ? "desc" : "asc"}`).join("|"),
  ]);

  return { users, totalCount, loading, setUsers };
}

function DraggableTableRow({ row }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() ? "selected" : undefined}
      className="hover:bg-muted/50 border-b transition-colors"
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="px-4 py-2 text-sm">
          {cell.column.id === "drag" ? (
            <Button
              variant="ghost"
              size="icon"
              className={`cursor-grab hover:bg-transparent text-muted-foreground size-7 ${
                isDragging ? "cursor-grabbing" : ""
              }`}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-3" />
              <span className="sr-only">Drag row</span>
            </Button>
          ) : (
            flexRender(cell.column.columnDef.cell, cell.getContext())
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function TableList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize state from URL params
  const initialPageSize = Number(searchParams.get("pageSize")) || 5;
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialSearch = searchParams.get("search") || "";

  const [globalFilter, setGlobalFilter] = useState(initialSearch);
  const [pageIndex, setPageIndex] = useState(initialPage - 1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sorting, setSorting] = useState([]);
  const [activeRow, setActiveRow] = useState(null);
  const [debouncedSearch] = useDebounce(globalFilter, 500);

  const { users, totalCount, loading, setUsers } = useFetchCustomers({
    pageIndex,
    pageSize,
    debouncedSearch,
    sorting,
  });

  // Handle Delete
  const handleDeleteCustomer = async (userId, router) => {
    const confirmed = confirm("Are you sure you want to delete this customer?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/customers/${userId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to delete");
      }

      toast.success("Customer deleted successfully");
      setUsers((prev) => prev.filter((user) => user.user_id !== userId));
    } catch (err) {
      toast.error(err.message || "Failed to delete customer");
    }
  };

  // Column order state
  const [columnOrder, setColumnOrder] = useState(() => [
    "drag",
    "select",
    // "id",
    "first_name",
    "last_name",
    "company",
    "email",
    "gender",
    "created_at",
    "actions",
  ]);

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // URL param updater
  const updateUrlParams = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams.toString());
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === false
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  // Columns definition
  const columns = useMemo(
    () => [
      {
        id: "drag",
        header: "",
        cell: () => (
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab hover:bg-transparent text-muted-foreground size-7"
          >
            <GripVertical className="size-3" />
            <span className="sr-only">Drag row</span>
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 30,
      },
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 30,
      },
      // {
      //   id: "id",
      //   accessorKey: "id",
      //   header: "ID",
      // },
      {
        id: "first_name",
        accessorKey: "first_name",
        header: "FIRST NAME",
      },
      {
        id: "last_name",
        accessorKey: "last_name",
        header: "LAST NAME",
      },
      {
        id: "company",
        accessorKey: "company",
        header: "COMPANY",
      },
      {
        id: "email",
        accessorKey: "email",
        header: "EMAIL",
      },
      {
        id: "gender",
        accessorKey: "gender",
        header: "GENDER",
        cell: ({ row }) => {
          const userId = row.original.id;
          const currentGender = row.getValue("gender") || "UNKNOWN";

          const genderOptions = ["MALE", "FEMALE", "OTHER", "UNKNOWN"];
          const [loading, setLoading] = useState(false);

          const handleGenderUpdate = async (gender) => {
            if (gender === currentGender) return;
            setLoading(true);

            try {
              const res = await fetch(
                `/api/dashboard/customers/${userId}/gender`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ gender }),
                }
              );

              if (!res.ok) throw new Error("Update failed");

              toast.success(`Gender updated to ${gender.toLowerCase()}`);

              // Update setUsers
              setUsers((prevUsers) =>
                prevUsers.map((user) =>
                  user.id === userId ? { ...user, gender } : user
                )
              );
            } catch (err) {
              toast.error("Failed to update gender. Please try again.");
              console.error("Failed to update gender:", err);
            } finally {
              setLoading(false);
            }
          };

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="capitalize text-sm">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    currentGender.toLowerCase()
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {genderOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => handleGenderUpdate(option)}
                    className={cn(
                      "capitalize",
                      option === currentGender
                        ? "font-semibold text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {option.toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8 cursor-pointer"
                size="icon"
              >
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/dashboard/customers/edit/${row.original.user_id}`
                  )
                }
                aria-label={`Edit customer ${row.original.user_id}`}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500"
                onClick={() =>
                  handleDeleteCustomer(row.original.user_id, router, setUsers)
                }
                aria-label={`Delete customer ${row.original.user_id}`}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router]
  );

  // Initialize table
  const table = useReactTable({
    data: users,
    columns,
    state: {
      pagination: { pageIndex, pageSize },
      globalFilter,
      sorting,
      columnOrder,
    },
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pageSize),
    onPaginationChange: (updater) => {
      const { pageIndex: newPageIndex, pageSize: newPageSize } =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndex(newPageIndex);
      setPageSize(newPageSize);
      updateUrlParams("page", newPageIndex + 1);
      updateUrlParams("pageSize", newPageSize);
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value);
      setPageIndex(0);
      updateUrlParams("search", value);
      updateUrlParams("page", "1");
    },
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Render sort icons
  const renderSortIcon = (column) => {
    if (!column.getCanSort()) return null;
    const isSorted = column.getIsSorted();
    if (isSorted === "asc") return <ArrowUpWideNarrow size={16} />;
    if (isSorted === "desc") return <ArrowDownWideNarrow size={16} />;
    return <ChevronsUpDown size={16} />;
  };

  //  pagination with ellipsis
  const paginationItems = useMemo(() => {
    const totalPages = Math.ceil(totalCount / pageSize);
    if (totalPages <= 1) return [];

    const current = pageIndex + 1;
    const pages = [];

    const showLeftEllipsis = current > 3;
    const showRightEllipsis = current < totalPages - 2;
    const startPage = Math.max(1, current - 1);
    const endPage = Math.min(totalPages, current + 1);

    if (!showLeftEllipsis) {
      for (let i = 1; i <= Math.min(5, totalPages); i++) {
        pages.push(i);
      }
    } else if (!showRightEllipsis) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        if (i > 0) pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push("left-ellipsis");
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      pages.push("right-ellipsis");
      pages.push(totalPages);
    }
    return pages;
  }, [pageIndex, totalCount, pageSize]);

  // Handle row reordering
  const handleDragStart = useCallback((event) => {
    setActiveRow(event.active.id);
  }, []);

  // Handle Drag End - Update sort_order in backend
  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveRow(null);

      if (active && over && active.id !== over.id) {
        const oldIndex = users.findIndex((u) => u.id === active.id);
        const newIndex = users.findIndex((u) => u.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // Create new array with updated positions
        const newUsers = arrayMove(users, oldIndex, newIndex);

        // Update sort_order for all affected rows
        const updatedUsers = newUsers.map((user, index) => ({
          ...user,
          sort_order: index,
        }));

        setUsers(updatedUsers);

        try {
          // Send all rows to backend to update their sort_order
          const res = await fetch("/api/dashboard/customers/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              updatedRows: updatedUsers.map((user) => ({
                id: user.id,
                sort_order: user.sort_order,
              })),
            }),
          });

          if (!res.ok) throw new Error("Failed to reorder");

          const result = await res.json();
          console.log("Reorder successful:", result);
        } catch (err) {
          console.error("Reorder error:", err);
          // Revert to original order if update fails
          setUsers([...users]);
        }
      }
    },
    [users, setUsers]
  );

  // Export functions
  const handleExport = (type) => {
    alert(`Export to ${type} not implemented`);
  };

  return (
    <div className="container mx-auto mt-6 px-4">
      {/* Search & Column Menu */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search customers..."
          className="w-full md:w-1/3 rounded-md border border-gray-300 px-4 py-2 text-sm"
          value={globalFilter}
          onChange={(e) => {
            const value = e.target.value;
            setGlobalFilter(value);
            setPageIndex(0);
            updateUrlParams("search", value);
            updateUrlParams("page", "1");
          }}
          style={{ cursor: "text" }}
        />

        {/* Column toggle & export */}
        <div className="flex items-center gap-2">
          {/* Column toggle */}
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
                  (col) =>
                    col.getCanHide() && col.id !== "drag" && col.id !== "select"
                )
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(checked) => col.toggleVisibility(checked)}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Ellipsis className="hidden lg:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={4}>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  <Download className="mr-2 h-4 w-4" /> Export all to .json
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <Download className="mr-2 h-4 w-4" /> Export all to .csv
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                  <Download className="mr-2 h-4 w-4" /> Export all to .xlsx
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Data Table with Drag & Drop */}
      <div className="overflow-x-auto rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Table className="min-w-full divide-y divide-gray-200">
            {/* Header */}
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={`header-group-${headerGroup.id}`}>
                  {headerGroup.headers
                    .slice()
                    .sort(
                      (a, b) =>
                        columnOrder.indexOf(a.column.id) -
                        columnOrder.indexOf(b.column.id)
                    )
                    .map((header) => (
                      <TableHead
                        key={`header-${header.id}`}
                        onClick={header.column.getToggleSortingHandler()}
                        className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-muted-foreground"
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

            {/* Body */}
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-row-${i}`} className="animate-pulse">
                    {columns.map((column, j) => (
                      <TableCell
                        key={`skeleton-cell-${i}-${column.id || j}`}
                        className="px-4 py-2"
                      >
                        <Skeleton className="h-4 w-full rounded-md" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-6 text-muted-foreground text-sm"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={users.map((user) => user.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableTableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>

          <DragOverlay>
            {activeRow ? (
              <table className="table-fixed border-collapse">
                <tbody>
                  <TableRow
                    key={`overlay-row-${activeRow.id}`}
                    className="shadow-lg bg-background border"
                  >
                    {columns.map((column) => {
                      if (column.id === "id") return null;
                      const cellContent =
                        column.id === "drag" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-grabbing hover:bg-transparent text-muted-foreground size-7"
                          >
                            <GripVertical className="size-3" />
                          </Button>
                        ) : (
                          <div className="truncate max-w-xs">
                            {activeRow.getValue?.(
                              column.accessorKey || column.id
                            ) ??
                              activeRow[column.id] ??
                              ""}
                          </div>
                        );

                      return (
                        <TableCell
                          key={`overlay-cell-${
                            column.id || column.accessorKey
                          }`}
                          className="px-4 py-2 text-sm"
                        >
                          {cellContent}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </tbody>
              </table>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 mt-6">
        {/* Show filtered count */}
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        {/* Pagination controls */}
        <div className="flex w-full items-center gap-8 lg:w-fit">
          {/* Rows per page */}
          <div className="flex w-full items-center gap-2 lg:w-fit">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                const newSize = Number(value);
                setPageSize(newSize);
                updateUrlParams("pageSize", newSize);
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Pager Per Count */}
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>

          {/* Pagination buttons */}
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => {
                      if (pageIndex > 0) {
                        const newPage = pageIndex - 1;
                        setPageIndex(newPage);
                        updateUrlParams("page", newPage + 1);
                      }
                    }}
                    className={
                      pageIndex > 0 ? "" : "pointer-events-none opacity-50"
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
                    onClick={() => {
                      if (pageIndex + 1 < Math.ceil(totalCount / pageSize)) {
                        const newPage = pageIndex + 1;
                        setPageIndex(newPage);
                        updateUrlParams("page", newPage + 1);
                      }
                    }}
                    className={
                      pageIndex + 1 < Math.ceil(totalCount / pageSize)
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


// Final Status Gender 

// chatgpt pagination logic
const paginationItems = useMemo(() => {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const current = pageIndex + 1;
  const pages = [];

  pages.push(1);

  if (current > 4) {
    pages.push("left-ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < totalPages - 3) {
    pages.push("right-ellipsis");
  }

  pages.push(totalPages);

  return pages;
}, [pageIndex, totalCount, pageSize]);


