"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";
import type { EtcItem } from "@/lib/items";

const PAGE_SIZE = 48;

const sortOptions = [
  { value: "id", label: "Default (ID)" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
  { value: "group", label: "Group" },
  { value: "sell", label: "Sell Peso" },
  { value: "cash", label: "Cash" },
];

function ItemCard({ item, server }: { item: EtcItem; server: string }) {
  return (
    <Link href={`/${server}/items/${item.id}`} prefetch={false} className="group block cursor-pointer">
      <div className="ls-card flex items-center gap-3 p-3 h-full">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-[#0b1120]">
          {item.icon ? (
            <ItemIcon icon={item.icon} maxSize={48} />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary"
            title={item.name}
          >
            {item.name || item.shopName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            #{item.id}
            {item.iconKey && (
              <span className="ml-2 font-mono text-[10px]">{item.iconKey}</span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded bg-[#0e1626] px-1.5 py-0.5 font-mono text-muted-foreground">
              Code {item.type}
            </span>
            {item.value !== undefined && item.value > 0 && (
              <span className="rounded bg-[#0e1626] px-1.5 py-0.5 text-muted-foreground">
                ×{item.value}
              </span>
            )}
            {item.cash !== undefined && item.cash > 0 && (
              <span className="rounded bg-[#0e1626] px-1.5 py-0.5 text-[#f59e0b]">
                {item.cash.toLocaleString("en-US")} cash
              </span>
            )}
            {item.sellPeso > 0 && (
              <span className="rounded bg-[#0e1626] px-1.5 py-0.5 text-muted-foreground">
                {item.sellPeso.toLocaleString("en-US")} peso
              </span>
            )}
            {!item.active && (
              <span className="rounded bg-[#0e1626] px-1.5 py-0.5 text-destructive">
                Inactive
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

interface ItemListProps {
  items: EtcItem[];
  itemGroups: number[];
  server: string;
  q?: string;
  group?: string;
  type?: string;
  sort?: string;
  page?: number;
}

export function ItemList({
  items,
  itemGroups,
  server,
  q = "",
  group = "",
  type = "",
  sort = "id",
  page: initialPage = 1,
}: ItemListProps) {
  const [search, setSearch] = useState(q);
  const [groupFilter, setGroupFilter] = useState(group);
  const [typeFilter, setTypeFilter] = useState(type);
  const [sortKey, setSortKey] = useState(sort);
  const [page, setPage] = useState(initialPage);

  const updateUrl = (
    patch: Partial<{ q: string; group: string; type: string; sort: string; page: number }>
  ) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = {
      q: search,
      group: groupFilter,
      type: typeFilter,
      sort: sortKey,
      page,
      ...patch,
    };

    const setOrDelete = (key: string, value: string | number, defaultValue: string | number) => {
      if (value === defaultValue || value === "" || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    };

    setOrDelete("q", next.q, "");
    setOrDelete("group", next.group, "");
    setOrDelete("type", next.type, "");
    setOrDelete("sort", next.sort, "id");
    setOrDelete("page", next.page, 1);

    const qs = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    updateUrl({ q: value, page: 1 });
  };

  const handleGroupChange = (value: string) => {
    setGroupFilter(value);
    setPage(1);
    updateUrl({ group: value, page: 1 });
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
    updateUrl({ type: value, page: 1 });
  };

  const handleSortChange = (value: string) => {
    setSortKey(value);
    updateUrl({ sort: value });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
  };

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const typeQuery = typeFilter.trim();

    return items.filter((item) => {
      if (groupFilter === "none") {
        if (item.group !== undefined) return false;
      } else if (groupFilter !== "") {
        if (item.group !== Number(groupFilter)) return false;
      }

      if (typeQuery && !String(item.type).includes(typeQuery)) return false;

      if (!query) return true;
      const idMatch = String(item.id).includes(query);
      const nameMatch = item.name.toLowerCase().includes(query);
      const shopNameMatch = item.shopName.toLowerCase().includes(query);
      const iconMatch = item.iconKey?.toLowerCase().includes(query) ?? false;
      return idMatch || nameMatch || shopNameMatch || iconMatch;
    });
  }, [items, search, groupFilter, typeFilter]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    switch (sortKey) {
      case "name":
        list.sort((a, b) => (a.name || a.shopName).localeCompare(b.name || b.shopName));
        break;
      case "type":
        list.sort((a, b) => a.type - b.type);
        break;
      case "group":
        list.sort((a, b) => (a.group ?? -1) - (b.group ?? -1));
        break;
      case "sell":
        list.sort((a, b) => a.sellPeso - b.sellPeso);
        break;
      case "cash":
        list.sort((a, b) => (a.cash ?? -1) - (b.cash ?? -1));
        break;
      default:
        list.sort((a, b) => a.id - b.id);
    }
    return list;
  }, [filteredItems, sortKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE)),
    [sortedItems.length]
  );

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedItems.slice(start, start + PAGE_SIZE);
  }, [sortedItems, page]);

  const hasFilters =
    search.trim() || groupFilter || typeFilter.trim() || sortKey !== "id";

  const clearFilters = () => {
    setSearch("");
    setGroupFilter("");
    setTypeFilter("");
    setSortKey("id");
    setPage(1);
    updateUrl({ q: "", group: "", type: "", sort: "id", page: 1 });
  };

  return (
    <div className="space-y-4">
      <div className="ls-card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, id, or icon key..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border-2 border-[var(--border)] bg-[#0b1120] pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary/50"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="group-filter" className="text-[10px] font-bold uppercase text-muted-foreground">
              Group
            </label>
            <select
              id="group-filter"
              value={groupFilter}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              <option value="">All groups</option>
              <option value="none">Ungrouped</option>
              {itemGroups.map((g) => (
                <option key={g} value={String(g)}>
                  Group {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="type-filter" className="text-[10px] font-bold uppercase text-muted-foreground">
              Type code
            </label>
            <Input
              id="type-filter"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 3000019"
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="border-2 border-[var(--border)] bg-[#0b1120] text-sm placeholder:text-muted-foreground focus-visible:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-sort" className="text-[10px] font-bold uppercase text-muted-foreground">
              Sort
            </label>
            <select
              id="item-sort"
              value={sortKey}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="shrink-0 gap-1 sm:mb-0"
            >
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-bold text-foreground">
          {paginatedItems.length.toLocaleString("en-US")}
        </span>{" "}
        of{" "}
        <span className="font-bold text-foreground">
          {sortedItems.length.toLocaleString("en-US")}
        </span>{" "}
        items
        {hasFilters && " (filtered)"}
      </p>

      {sortedItems.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No items match your filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedItems.map((item) => (
              <ItemCard key={item.id} item={item} server={server} />
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-bold text-foreground">{page}</span> of{" "}
              <span className="font-bold text-foreground">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1 || totalPages === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || totalPages === 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
