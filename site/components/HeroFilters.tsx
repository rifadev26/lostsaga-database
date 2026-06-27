"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export interface SortOption {
  value: string;
  label: string;
}

interface HeroFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  availableTypes: string[];
  rarityFilter: string;
  onRarityChange: (value: string) => void;
  availableRarities: string[];
  sort: string;
  sortOptions: SortOption[];
  onSortChange: (value: string) => void;
  onClear: () => void;
}

export function HeroFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  availableTypes,
  rarityFilter,
  onRarityChange,
  availableRarities,
  sort,
  sortOptions,
  onSortChange,
  onClear,
}: HeroFiltersProps) {
  const hasFilters = search || typeFilter || rarityFilter;

  return (
    <div className="ls-card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search hero or code..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-2 border-[var(--border)] bg-[#0b1120] pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary/50"
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="hero-type-filter"
            className="text-[10px] font-bold uppercase text-muted-foreground"
          >
            Type
          </label>
          <select
            id="hero-type-filter"
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground capitalize focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
          >
            <option value="">All types</option>
            {availableTypes.map((type) => (
              <option key={type} value={type} className="capitalize">
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="hero-rarity-filter"
            className="text-[10px] font-bold uppercase text-muted-foreground"
          >
            Rarity
          </label>
          <select
            id="hero-rarity-filter"
            value={rarityFilter}
            onChange={(e) => onRarityChange(e.target.value)}
            className="h-9 rounded-md border-2 border-[var(--border)] bg-[#0b1120] px-3 text-sm text-foreground capitalize focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none"
          >
            <option value="">All rarities</option>
            {availableRarities.map((rarity) => (
              <option key={rarity} value={rarity} className="capitalize">
                {rarity}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="hero-sort"
            className="text-[10px] font-bold uppercase text-muted-foreground"
          >
            Sort
          </label>
          <select
            id="hero-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
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
            onClick={onClear}
            className="shrink-0 gap-1"
          >
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
