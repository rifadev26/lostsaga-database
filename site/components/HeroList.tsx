"use client";

import { useMemo, useState } from "react";
import { HeroFilters } from "./HeroFilters";
import { HeroGrid } from "./HeroGrid";
import { Hero } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroListProps {
  heroes: Hero[];
  heroTypes: string[];
  heroRarities: string[];
  server: string;
  q?: string;
  type?: string;
  rarity?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

const sortOptions = [
  { value: "code", label: "Default (Code)" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
  { value: "rarity", label: "Rarity" },
];

export function HeroList({
  heroes,
  heroTypes,
  heroRarities,
  server,
  q = "",
  type = "",
  rarity = "",
  sort = "code",
  page: initialPage = 1,
  pageSize = 24,
}: HeroListProps) {
  const [search, setSearch] = useState(q);
  const [typeFilter, setTypeFilter] = useState(type);
  const [rarityFilter, setRarityFilter] = useState(rarity);
  const [sortKey, setSortKey] = useState(sort);
  const [page, setPage] = useState(initialPage);

  const updateUrl = (
    patch: Partial<{ q: string; type: string; rarity: string; sort: string; page: number }>
  ) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = { q: search, type: typeFilter, rarity: rarityFilter, sort: sortKey, page, ...patch };

    const setOrDelete = (key: string, value: string | number, defaultValue: string | number) => {
      if (value === defaultValue || value === "" || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    };

    setOrDelete("q", next.q, "");
    setOrDelete("type", next.type, "");
    setOrDelete("rarity", next.rarity, "");
    setOrDelete("sort", next.sort, "code");
    setOrDelete("page", next.page, 1);

    const qs = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
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

  const handleSortChange = (value: string) => {
    setSortKey(value);
    updateUrl({ sort: value });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
  };

  const filteredHeroes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return heroes.filter((hero) => {
      const matchesSearch =
        !query ||
        hero.name.toLowerCase().includes(query) ||
        hero.code.includes(query);
      const matchesType = typeFilter === "" || hero.type === typeFilter;
      const matchesRarity = rarityFilter === "" || hero.rarity === rarityFilter;
      return matchesSearch && matchesType && matchesRarity;
    });
  }, [heroes, search, typeFilter, rarityFilter]);

  const sortedHeroes = useMemo(() => {
    const list = [...filteredHeroes];
    switch (sortKey) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "type":
        list.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case "rarity":
        list.sort((a, b) => a.rarity.localeCompare(b.rarity));
        break;
      default:
        list.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));
    }
    return list;
  }, [filteredHeroes, sortKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedHeroes.length / pageSize)),
    [sortedHeroes.length, pageSize]
  );

  const paginatedHeroes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedHeroes.slice(start, start + pageSize);
  }, [sortedHeroes, page, pageSize]);

  const hasFilters = search || typeFilter || rarityFilter;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setRarityFilter("");
    setSortKey("code");
    setPage(1);
    updateUrl({ q: "", type: "", rarity: "", sort: "code", page: 1 });
  };

  return (
    <div className="space-y-4">
      <HeroFilters
        search={search}
        onSearchChange={handleSearchChange}
        typeFilter={typeFilter}
        onTypeChange={handleTypeChange}
        availableTypes={heroTypes}
        rarityFilter={rarityFilter}
        onRarityChange={handleRarityChange}
        availableRarities={heroRarities}
        sort={sortKey}
        sortOptions={sortOptions}
        onSortChange={handleSortChange}
        onClear={clearFilters}
      />

      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-bold text-foreground">
          {paginatedHeroes.length.toLocaleString("en-US")}
        </span>{" "}
        of{" "}
        <span className="font-bold text-foreground">
          {sortedHeroes.length.toLocaleString("en-US")}
        </span>{" "}
        heroes
        {hasFilters && " (filtered)"}
      </p>

      <HeroGrid heroes={paginatedHeroes} server={server} />

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
    </div>
  );
}
