"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PreviewCard } from "@/components/PreviewCard";
import type { Pet } from "@/lib/pets";

const PAGE_SIZE = 48;

const sortOptions = [
  { value: "id", label: "Default (ID)" },
  { value: "name", label: "Name" },
  { value: "baseRank", label: "Base Rank" },
  { value: "maxRank", label: "Max Rank" },
];

interface PetListProps {
  pets: Pet[];
  petRanks: number[];
  server: string;
  q?: string;
  baseRank?: string;
  maxRank?: string;
  sort?: string;
  page?: number;
}

export function PetList({
  pets,
  petRanks,
  server,
  q = "",
  baseRank = "",
  maxRank = "",
  sort = "id",
  page: initialPage = 1,
}: PetListProps) {
  const [search, setSearch] = useState(q);
  const [baseRankFilter, setBaseRankFilter] = useState(baseRank);
  const [maxRankFilter, setMaxRankFilter] = useState(maxRank);
  const [sortKey, setSortKey] = useState(sort);
  const [page, setPage] = useState(initialPage);

  const updateUrl = (
    patch: Partial<{
      q: string;
      baseRank: string;
      maxRank: string;
      sort: string;
      page: number;
    }>,
  ) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = {
      q: search,
      baseRank: baseRankFilter,
      maxRank: maxRankFilter,
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
    setOrDelete("baseRank", next.baseRank, "");
    setOrDelete("maxRank", next.maxRank, "");
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

  const handleBaseRankChange = (value: string) => {
    setBaseRankFilter(value);
    setPage(1);
    updateUrl({ baseRank: value, page: 1 });
  };

  const handleMaxRankChange = (value: string) => {
    setMaxRankFilter(value);
    setPage(1);
    updateUrl({ maxRank: value, page: 1 });
  };

  const handleSortChange = (value: string) => {
    setSortKey(value);
    updateUrl({ sort: value });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
  };

  const filteredPets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pets.filter((pet) => {
      if (baseRankFilter && pet.baseRank !== Number(baseRankFilter)) {
        return false;
      }
      if (maxRankFilter && pet.maxRank !== Number(maxRankFilter)) {
        return false;
      }

      if (!query) return true;
      const idMatch = String(pet.id).includes(query);
      const nameMatch = pet.views.some((v) =>
        v.name.toLowerCase().includes(query),
      );
      const manualMatch = pet.manual.toLowerCase().includes(query);
      return idMatch || nameMatch || manualMatch;
    });
  }, [pets, search, baseRankFilter, maxRankFilter]);

  const sortedPets = useMemo(() => {
    const list = [...filteredPets];
    switch (sortKey) {
      case "name":
        list.sort((a, b) =>
          (a.views[0]?.name || a.id.toString()).localeCompare(
            b.views[0]?.name || b.id.toString(),
          ),
        );
        break;
      case "baseRank":
        list.sort((a, b) => a.baseRank - b.baseRank);
        break;
      case "maxRank":
        list.sort((a, b) => a.maxRank - b.maxRank);
        break;
      default:
        list.sort((a, b) => a.id - b.id);
    }
    return list;
  }, [filteredPets, sortKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedPets.length / PAGE_SIZE)),
    [sortedPets.length],
  );

  const paginatedPets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedPets.slice(start, start + PAGE_SIZE);
  }, [sortedPets, page]);

  const hasFilters =
    search.trim() || baseRankFilter || maxRankFilter || sortKey !== "id";

  const clearFilters = () => {
    setSearch("");
    setBaseRankFilter("");
    setMaxRankFilter("");
    setSortKey("id");
    setPage(1);
    updateUrl({ q: "", baseRank: "", maxRank: "", sort: "id", page: 1 });
  };

  const displayName = (pet: Pet) =>
    pet.views[0]?.name || `Pet #${pet.id}`;

  const displayIcon = (pet: Pet) => pet.views[0]?.icon ?? null;

  return (
    <div className="space-y-4">
      <div className="ls-card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, id, or manual..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border-2 border-[var(--border)] bg-[#0b1120] pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary/50"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pet-base-rank-filter"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Base Rank
            </label>
            <select
              id="pet-base-rank-filter"
              value={baseRankFilter}
              onChange={(e) => handleBaseRankChange(e.target.value)}
              className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              <option value="">All ranks</option>
              {petRanks.map((r) => (
                <option key={r} value={String(r)}>
                  Rank {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pet-max-rank-filter"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Max Rank
            </label>
            <select
              id="pet-max-rank-filter"
              value={maxRankFilter}
              onChange={(e) => handleMaxRankChange(e.target.value)}
              className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              <option value="">All ranks</option>
              {petRanks.map((r) => (
                <option key={r} value={String(r)}>
                  Rank {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pet-sort"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Sort
            </label>
            <select
              id="pet-sort"
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
          {paginatedPets.length.toLocaleString("en-US")}
        </span>{" "}
        of{" "}
        <span className="font-bold text-foreground">
          {sortedPets.length.toLocaleString("en-US")}
        </span>{" "}
        pets
        {hasFilters && " (filtered)"}
      </p>

      {sortedPets.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No pets match your filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {paginatedPets.map((pet) => (
              <PreviewCard
                key={pet.id}
                href={`/${server}/pets/${pet.id}`}
                name={displayName(pet)}
                icon={displayIcon(pet)}
                label="View Pet"
              />
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
