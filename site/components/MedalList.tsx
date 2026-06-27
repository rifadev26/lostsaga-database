"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronLeft, ChevronRight, Award } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";
import type { Medal } from "@/lib/medals";

const PAGE_SIZE = 48;

function MedalCard({ medal }: { medal: Medal }) {
  return (
    <Link href={`/medals/${medal.id}`} className="group block cursor-pointer">
      <div className="ls-card flex items-center gap-3 p-3 h-full">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-[#0b1120]">
          {medal.icon ? (
            <ItemIcon icon={medal.icon} maxSize={48} />
          ) : (
            <Award className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary"
            title={medal.name}
          >
            {medal.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            #{medal.id}
            {medal.iconKey && (
              <span className="ml-2 font-mono text-[10px]">
                {medal.iconKey}
              </span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded bg-[#0e1626] px-1.5 py-0.5 font-mono text-muted-foreground">
              Type {medal.itemType}
            </span>
            {medal.limitLevel !== undefined && medal.limitLevel > 0 && (
              <span className="rounded bg-[#0e1626] px-1.5 py-0.5 text-muted-foreground">
                Lv. {medal.limitLevel}
              </span>
            )}
            {medal.subMedalType !== undefined && (
              <span className="rounded bg-[#0e1626] px-1.5 py-0.5 text-muted-foreground">
                Sub {medal.subMedalType}
              </span>
            )}
            {medal.sellPeso > 0 && (
              <span className="rounded bg-[#0e1626] px-1.5 py-0.5 text-muted-foreground">
                {medal.sellPeso.toLocaleString("en-US")} peso
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

interface MedalListProps {
  medals: Medal[];
  medalSubTypes: number[];
}

export function MedalList({ medals, medalSubTypes }: MedalListProps) {
  const [search, setSearch] = useState("");
  const [subTypeFilter, setSubTypeFilter] = useState<string>("");
  const [hasManualFilter, setHasManualFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const hasFilters =
    search.trim() || subTypeFilter || hasManualFilter;

  const clearFilters = () => {
    setSearch("");
    setSubTypeFilter("");
    setHasManualFilter("");
    setPage(1);
  };

  const filteredMedals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return medals.filter((medal) => {
      if (subTypeFilter !== "") {
        if (medal.subMedalType !== Number(subTypeFilter)) return false;
      }

      if (hasManualFilter === "yes" && !medal.manual) return false;
      if (hasManualFilter === "no" && medal.manual) return false;

      if (!query) return true;
      const idMatch = String(medal.id).includes(query);
      const nameMatch = medal.name.toLowerCase().includes(query);
      const iconMatch = medal.iconKey?.toLowerCase().includes(query) ?? false;
      const manualMatch = medal.manual.toLowerCase().includes(query);
      return idMatch || nameMatch || iconMatch || manualMatch;
    });
  }, [medals, search, subTypeFilter, hasManualFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredMedals.length / PAGE_SIZE)),
    [filteredMedals.length],
  );

  const paginatedMedals = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMedals.slice(start, start + PAGE_SIZE);
  }, [filteredMedals, page]);

  return (
    <div className="space-y-4">
      <div className="ls-card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, id, icon key, or manual..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border-2 border-[var(--border)] bg-[#0b1120] pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary/50"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-3">
          {medalSubTypes.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="medal-subtype-filter"
                className="text-[10px] font-bold uppercase text-muted-foreground"
              >
                Sub Type
              </label>
              <select
                id="medal-subtype-filter"
                value={subTypeFilter}
                onChange={(e) => {
                  setSubTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
              >
                <option value="">All sub types</option>
                {medalSubTypes.map((t) => (
                  <option key={t} value={String(t)}>
                    Sub {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="medal-manual-filter"
              className="text-[10px] font-bold uppercase text-muted-foreground"
            >
              Manual
            </label>
            <select
              id="medal-manual-filter"
              value={hasManualFilter}
              onChange={(e) => {
                setHasManualFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              <option value="">All</option>
              <option value="yes">Has manual</option>
              <option value="no">No manual</option>
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
          {paginatedMedals.length.toLocaleString("en-US")}
        </span>{" "}
        of{" "}
        <span className="font-bold text-foreground">
          {filteredMedals.length.toLocaleString("en-US")}
        </span>{" "}
        medals
        {hasFilters && " (filtered)"}
      </p>

      {filteredMedals.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No medals match your filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedMedals.map((medal) => (
              <MedalCard key={medal.id} medal={medal} />
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || totalPages === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
