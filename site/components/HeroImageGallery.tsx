"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Hero,
  getHeroArtworkCandidates,
  getHeroIconCandidates,
} from "@/lib/data";
import { ImageFallback } from "./ImageFallback";

export function HeroImageGallery({ hero }: { hero: Hero }) {
  const allHeroSrcs = useMemo(() => {
    const paths = [
      ...getHeroArtworkCandidates(hero),
      ...getHeroIconCandidates(hero),
    ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);
    return paths;
  }, [hero]);

  const makeSrcs = (path?: string) => {
    if (!path) return allHeroSrcs;
    return [path, ...allHeroSrcs.filter((s) => s !== path)];
  };

  const slots = useMemo(
    () =>
      [
        { label: "Art 1", path: hero.artwork1 },
        { label: "Art 2", path: hero.artwork2 },
        { label: "Icon M", path: hero.icon_m },
        { label: "Icon F", path: hero.icon_f },
        { label: "Pic M", path: hero.pic_m },
        { label: "Pic F", path: hero.pic_f },
      ].filter((slot): slot is { label: string; path: string } => Boolean(slot.path)),
    [hero]
  );

  const [activeSrcs, setActiveSrcs] = useState(() => makeSrcs(hero.artwork1));

  return (
    <div className="space-y-4">
      <div className="ls-image-frame relative aspect-[3/4] w-full overflow-hidden rounded-xl border-2 border-[var(--border)]">
        <ImageFallback
          srcs={activeSrcs}
          alt={hero.name}
          fill
          className="object-contain p-2"
          sizes="(max-width: 1024px) 100vw, 320px"
          priority
        />
      </div>

      {slots.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slots.map((slot) => {
            const target = slot.path;
            const isActive = activeSrcs[0] === target;
            return (
              <button
                key={slot.label}
                type="button"
                onClick={() => setActiveSrcs(makeSrcs(slot.path))}
                className={cn(
                  "ls-image-frame relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-all",
                  isActive
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-[var(--border)] opacity-70 hover:opacity-100"
                )}
                title={slot.label}
              >
                <ImageFallback
                  srcs={makeSrcs(slot.path)}
                  alt={`${hero.name} ${slot.label}`}
                  fill
                  className="object-cover p-1"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
