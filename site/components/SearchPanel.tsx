"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PreviewCard } from "@/components/PreviewCard";
import { ImageFallback } from "@/components/ImageFallback";
import {
  Search,
  X,
  Users,
  Package,
  Backpack,
  Shield,
  Bone,
} from "lucide-react";
import type { Hero } from "@/lib/data";
import { getAssetUrl, getHeroCardImageCandidates } from "@/lib/data";
import type { EtcItem } from "@/lib/items";
import type { Gear } from "@/lib/gears";
import type { Medal } from "@/lib/medals";
import type { Pet } from "@/lib/pets";

const PREVIEW_LIMIT = 8;
const SELECTED_LIMIT = 48;

type Category = "all" | "heroes" | "items" | "gears" | "medals" | "pets";

interface CategoryConfig {
  key: Category;
  label: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const categories: CategoryConfig[] = [
  { key: "all", label: "All", icon: Search, href: "/search", color: "#3b82f6" },
  { key: "heroes", label: "Heroes", icon: Users, href: "/heroes", color: "#22c55e" },
  { key: "items", label: "Items", icon: Package, href: "/items", color: "#a855f7" },
  { key: "gears", label: "Gears", icon: Backpack, href: "/gears", color: "#f59e0b" },
  { key: "medals", label: "Medals", icon: Shield, href: "/medals", color: "#ef4444" },
  { key: "pets", label: "Pets", icon: Bone, href: "/pets", color: "#f97316" },
];

interface SearchPanelProps {
  heroes: Hero[];
  items: EtcItem[];
  gears: Gear[];
  medals: Medal[];
  pets: Pet[];
  initialQuery: string;
  initialCategory: Category;
}

function heroMatches(hero: Hero, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    hero.name.toLowerCase().includes(q) ||
    hero.code.includes(q) ||
    hero.type.toLowerCase().includes(q) ||
    hero.rarity.toLowerCase().includes(q) ||
    hero.summary.toLowerCase().includes(q)
  );
}

function itemMatches(item: EtcItem, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(q) ||
    item.shopName.toLowerCase().includes(q) ||
    String(item.id).includes(q) ||
    (item.iconKey?.toLowerCase().includes(q) ?? false)
  );
}

function gearMatches(gear: Gear, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    gear.name.toLowerCase().includes(q) ||
    (gear.nameKr?.toLowerCase().includes(q) ?? false) ||
    gear.heroName.toLowerCase().includes(q) ||
    (gear.skill?.name.toLowerCase().includes(q) ?? false) ||
    String(gear.id).includes(q) ||
    String(gear.code).includes(q)
  );
}

function medalMatches(medal: Medal, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    medal.name.toLowerCase().includes(q) ||
    String(medal.id).includes(q) ||
    (medal.iconKey?.toLowerCase().includes(q) ?? false) ||
    medal.manual.toLowerCase().includes(q)
  );
}

function petMatches(pet: Pet, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    pet.views.some((v) => v.name.toLowerCase().includes(q)) ||
    String(pet.id).includes(q) ||
    pet.manual.toLowerCase().includes(q)
  );
}

function HeroResultCard({ hero }: { hero: Hero }) {
  return (
    <Link href={`/heroes/${hero.code}`} prefetch={false} className="group block">
      <div className="ls-card flex h-full flex-col overflow-hidden">
        <div className="ls-image-frame relative aspect-square w-full shrink-0">
          <ImageFallback
            srcs={getHeroCardImageCandidates(hero).map(getAssetUrl)}
            alt={hero.name}
            fill
            objectFit="cover"
            className="transition-opacity duration-200 group-hover:opacity-85"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        </div>
        <div className="border-t-2 border-black/5 bg-[#0e1626] px-3 py-2 text-center">
          <p
            className="truncate text-xs font-medium text-foreground"
            title={hero.name}
          >
            {hero.name}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-center border-t-2 border-black/5 bg-[#0c1322] px-3 py-2">
          <span className="ls-btn-green h-7 w-full text-xs">View Hero</span>
        </div>
      </div>
    </Link>
  );
}

export function SearchPanel({
  heroes,
  items,
  gears,
  medals,
  pets,
  initialQuery,
  initialCategory,
}: SearchPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<Category>(initialCategory);

  const updateUrl = (nextQuery: string, nextCategory: Category) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    if (nextCategory && nextCategory !== "all") {
      params.set("category", nextCategory);
    } else {
      params.delete("category");
    }

    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`,
    );
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    updateUrl(value, category);
  };

  const handleCategoryChange = (next: Category) => {
    setCategory(next);
    updateUrl(query, next);
  };

  const results = useMemo(() => {
    const q = query.trim();
    return {
      heroes: q ? heroes.filter((h) => heroMatches(h, q)) : [],
      items: q ? items.filter((i) => itemMatches(i, q)) : [],
      gears: q ? gears.filter((g) => gearMatches(g, q)) : [],
      medals: q ? medals.filter((m) => medalMatches(m, q)) : [],
      pets: q ? pets.filter((p) => petMatches(p, q)) : [],
    };
  }, [heroes, items, gears, medals, pets, query]);

  const totalCount =
    results.heroes.length +
    results.items.length +
    results.gears.length +
    results.medals.length +
    results.pets.length;

  const activeCategories =
    category === "all"
      ? categories.slice(1)
      : categories.slice(1).filter((c) => c.key === category);

  return (
    <div className="space-y-6">
      <div className="ls-card p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search heroes, items, gears, medals, and pets..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="h-12 border-2 border-[var(--border)] bg-[#0b1120] pl-11 text-base placeholder:text-muted-foreground focus-visible:ring-primary/50"
          />
          {query && (
            <button
              onClick={() => handleQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = category === cat.key;
            const Icon = cat.icon;
            const count =
              cat.key === "all"
                ? totalCount
                : results[cat.key as Exclude<Category, "all">].length;

            return (
              <Button
                key={cat.key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(cat.key)}
                className="gap-1.5"
              >
                <Icon className="h-4 w-4" />
                {cat.label}
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-white/20" : "bg-white/10"
                  }`}
                >
                  {count.toLocaleString("en-US")}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {!query.trim() && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Enter a search term to find heroes, items, gears, medals, and pets.
        </div>
      )}

      {query.trim() && totalCount === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No results found for &quot;<span className="text-foreground">{query}</span>&quot;.
        </div>
      )}

      {query.trim() &&
        activeCategories.map((cat) => {
          const list = results[cat.key as Exclude<Category, "all">];
          if (list.length === 0) return null;

          const isSelected = category === cat.key;
          const limit = isSelected ? SELECTED_LIMIT : PREVIEW_LIMIT;
          const preview = list.slice(0, limit);
          const hasMore = list.length > limit;

          return (
            <section key={cat.key} className="space-y-3">
              <div className="ls-section-header">
                <cat.icon className="h-5 w-5" style={{ color: cat.color }} />
                <span>{cat.label}</span>
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
                  {list.length.toLocaleString("en-US")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {cat.key === "heroes" ? (
                  (preview as Hero[]).map((hero) => (
                    <HeroResultCard key={hero.code} hero={hero} />
                  ))
                ) : cat.key === "items" ? (
                  (preview as EtcItem[]).map((item) => (
                    <PreviewCard
                      key={item.id}
                      href={`/items/${item.id}`}
                      name={item.name || item.shopName}
                      icon={item.icon}
                      label="View Item"
                    />
                  ))
                ) : cat.key === "gears" ? (
                  (preview as Gear[]).map((gear) => (
                    <PreviewCard
                      key={gear.id}
                      href={`/gears/${gear.id}`}
                      name={gear.name}
                      icon={gear.icon}
                      label="View Gear"
                    />
                  ))
                ) : cat.key === "medals" ? (
                  (preview as Medal[]).map((medal) => (
                    <PreviewCard
                      key={medal.id}
                      href={`/medals/${medal.id}`}
                      name={medal.name}
                      icon={medal.icon}
                      label="View Medal"
                    />
                  ))
                ) : (
                  (preview as Pet[]).map((pet) => (
                    <PreviewCard
                      key={pet.id}
                      href={`/pets/${pet.id}`}
                      name={pet.views[0]?.name || `Pet #${pet.id}`}
                      icon={pet.views[0]?.icon ?? null}
                      label="View Pet"
                    />
                  ))
                )}
              </div>

              {hasMore && (
                <div className="flex justify-end">
                  <Link
                    href={`${cat.href}?q=${encodeURIComponent(query.trim())}`}
                    prefetch={false}
                    className="text-xs font-bold text-white/80 hover:text-white hover:underline"
                  >
                    View all {list.length.toLocaleString("en-US")} matching{" "}
                    {cat.label.toLowerCase()}
                  </Link>
                </div>
              )}
            </section>
          );
        })}
    </div>
  );
}
