"use client";

import { HeroCard } from "./HeroCard";
import { Hero } from "@/lib/data";
import { Frown } from "lucide-react";

interface HeroGridProps {
  heroes: Hero[];
  server: string;
}

export function HeroGrid({ heroes, server }: HeroGridProps) {
  if (heroes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-muted-foreground">
        <Frown className="mb-3 h-10 w-10" />
        <p className="text-lg font-medium">No heroes found</p>
        <p className="text-sm">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {heroes.map((hero) => (
        <HeroCard key={hero.code} hero={hero} server={server} />
      ))}
    </div>
  );
}
