"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";
import type { Gear } from "@/lib/gears";

const PAGE_SIZE = 48;

const sortOptions = [
  { value: "id", label: "Default (ID)" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
  { value: "rarity", label: "Rarity" },
  { value: "source", label: "Source" },
];

function GearCard({ gear, server }: { gear: Gear; server: string }) {
  return (
    <Link href={`/${server}/gears/${gear.id}`} prefetch={false} className="group block cursor-pointer">
      <div className="ls-card flex items-center gap-3 p-3 h-full">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-[#0b1120]">
          {gear.icon ? (
            <ItemIcon icon={gear.icon} maxSize={48} />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary"
            title={gear.name}
          >
            {gear.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded bg-[#0e1626] px-1.5 py-0.5 font-mono text-muted-foreground">
              Code {gear.code}
            </span>
            <span className="rounded bg-[#0e1626] px-1.5 py-0.5 font-mono uppercase text-muted-foreground">
              {gear.itemType}
            </span>
            {gear.subType && gear.subType !== "DEFAULT" && (
              <span className="rounded bg-[#0e1626] px-1.5 py-0.5 text-muted-foreground">
                {gear.subType}
              </span>
            )}
            {gear.rarity && (
              <span className="rounded bg-[#0e1626] px-1.5 py-0.5 capitalize text-foreground">
                {gear.rarity}
              </span>
            )}
            {gear.isExtra && (
              <span className="rounded bg-[#0e1626] px-1.5 py-0.5 text-[#f59e0b]">
                Extra
              </span>
            )}
          </div>
          {gear.skill?.name && (
            <p className="mt-1 truncate text-xs font-medium text-primary">
              {gear.skill.name}
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

interface GearListProps {
  gears: Gear[];
  gearTypes: string[];
  gearRarities: string[];
  server: string;
  q?: string;
  type?: string;
  rarity?: string;
  extra?: string;
  sort?: string;
  page?: number;
}

export function GearList({
  gears,
  gearTypes,
  gearRarities,
  server,
  q = "",
  type = "",
  rarity = "",
  extra = "",
  sort = "id",
  page: initialPage = 1,
}: GearListProps) {
  const [search, setSearch] = useState(q);
  const [typeFilter, setTypeFilter] = useState(type);
  const [rarityFilter, setRarityFilter] = useState(rarity);
  const [extraFilter, setExtraFilter] = useState(extra);
  const [sortKey, setSortKey] = useState(sort);
  const [page, setPage] = useState(initialPage);

  const updateUrl = (
    patch: Partial<{
      q: string;
      type: string;
      rarity: string;
      extra: string;
      sort: string;
      page: number;
    }>,
  ) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = {
      q: search,
      type: typeFilter,
      rarity: rarityFilter,
      extra: extraFilter,
      sort: sortKey,
      page,
      ...patch,
    };

    const setOrDelete = (
      key: string,
      value: string | number,
      defaultValue: string | number,
    ) => {
      if (value === defaultValue || value === "" || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    };

    setOrDelete("q", next.q, "");
    setOrDelete("type", next.type, "");
    setOrDelete("rarity", next.rarity, "");
    setOrDelete("extra", next.extra, "");
    setOrDelete("sort", next.sort, "id");
    setOrDelete("page", next.page, 1);

    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`,
    );
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    updateUrl({ q: value, page: 1 });
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
    updateUrl({ type: value, page: 1 });
  };

  const handleRarityChange = (value: string) => {
    setRarityFilter(value);
    setPage(1);
    updateUrl({ rarity: value, page: 1 });
  };

  const handleExtraChange = (value: string) => {
    setExtraFilter(value);
    setPage(1);
    updateUrl({ extra: value, page: 1 });
  };

  const handleSortChange = (value: string) => {
    setSortKey(value);
    updateUrl({ sort: value });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
  };

  const filteredGears = useMemo(() => {
    const query = search.trim().toLowerCase();
    return gears.filter((gear) => {
      if (typeFilter && gear.itemType !== typeFilter) return false;
      if (rarityFilter && gear.rarity !== rarityFilter) return false;
      if (extraFilter === "default" && gear.isExtra) return false;
      if (extraFilter === "extra" && !gear.isExtra) return false;

      if (!query) return true;
      const idMatch = String(gear.id).includes(query);
      const nameMatch = gear.name.toLowerCase().includes(query);
      const nameKrMatch = gear.nameKr?.toLowerCase().includes(query) ?? false;
      const heroMatch = gear.heroName.toLowerCase().includes(query);
      const skillMatch =
        gear.skill?.name.toLowerCase().includes(query) ?? false;
      return idMatch || nameMatch || nameKrMatch || heroMatch || skillMatch;
    });
  }, [gears, search, typeFilter, rarityFilter, extraFilter]);

  const sortedGears = useMemo(() => {
    const list = [...filteredGears];
    switch (sortKey) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "type":
        list.sort((a, b) => a.itemType.localeCompare(b.itemType));
        break;
      case "rarity":
        list.sort((a, b) => (a.rarity || "").localeCompare(b.rarity || ""));
        break;
      case "source":
        list.sort((a, b) => Number(a.isExtra) - Number(b.isExtra));
        break;
      default:
        list.sort((a, b) => a.id - b.id);
    }
    return list;
  }, [filteredGears, sortKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedGears.length / PAGE_SIZE)),
    [sortedGears.length],
  );

  const paginatedGears = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedGears.slice(start, start + PAGE_SIZE);
  }, [sortedGears, page]);

  const hasFilters =
    search.trim() ||
    typeFilter ||
    rarityFilter ||
    extraFilter ||
    sortKey !== "id";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setRarityFilter("");
    setExtraFilter("");
    setSortKey("id");
    setPage(1);
    updateUrl({ q: "", type: "", rarity: "", extra: "", sort: "id", page: 1 });
  };

  return (
    <div className="space-y-4">
      <div className="ls-card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, hero, skill, or id..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border-2 border-[var(--border)] bg-[#0b1120] pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary/50"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="gear-type-filter"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Type
            </label>
            <select
              id="gear-type-filter"
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              <option value="">All types</option>
              {gearTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="gear-rarity-filter"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Rarity
            </label>
            <select
              id="gear-rarity-filter"
              value={rarityFilter}
              onChange={(e) => handleRarityChange(e.target.value)}
              className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              <option value="">All rarities</option>
              {gearRarities.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="gear-extra-filter"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Source
            </label>
            <select
              id="gear-extra-filter"
              value={extraFilter}
              onChange={(e) => handleExtraChange(e.target.value)}
              className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              <option value="">All</option>
              <option value="default">Default</option>
              <option value="extra">Extra</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="gear-sort"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Sort
            </label>
            <select
              id="gear-sort"
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
              className="shrink-0 gap-1"
            >
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-bold text-foreground">
          {paginatedGears.length.toLocaleString("en-US")}
        </span>{" "}
        of{" "}
        <span className="font-bold text-foreground">
          {sortedGears.length.toLocaleString("en-US")}
        </span>{" "}
        gears
        {hasFilters && " (filtered)"}
      </p>

      {sortedGears.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No gears match your filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedGears.map((gear) => (
              <GearCard key={gear.id} gear={gear} server={server} />
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
