import Link from "next/link";
import { Swords, Crosshair, Sparkles, Star, Info } from "lucide-react";
import { ImageFallback } from "./ImageFallback";
import { Hero, getAssetUrl, getHeroCardImageCandidates } from "@/lib/data";

interface HeroCardProps {
  hero: Hero;
}

const typeIcons: Record<string, React.ElementType> = {
  melee: Swords,
  range: Crosshair,
  magic: Sparkles,
  special: Star,
};

export function HeroCard({ hero }: HeroCardProps) {
  const cardSrcs = getHeroCardImageCandidates(hero).map(getAssetUrl);
  const TypeIcon = typeIcons[hero.type] ?? Star;

  return (
    <Link href={`/heroes/${hero.code}`} prefetch={false} className="group block">
      <div className="ls-card flex h-full flex-col overflow-hidden">
        <div className="ls-image-frame relative aspect-[3/4] w-full shrink-0 !rounded-none !bg-transparent">
          <ImageFallback
            srcs={cardSrcs}
            alt={hero.name}
            fill
            objectFit="cover"
            className="rounded-none transition-opacity duration-200 group-hover:opacity-85"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />

          <span className="absolute left-2 top-2 rounded bg-[#1f2937]/80 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white backdrop-blur-sm">
            {hero.rarity}
          </span>

          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-sm">
            <Info className="h-3.5 w-3.5" />
          </span>

          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur-sm">
            <TypeIcon className="h-3 w-3" />
            {hero.type}
          </span>
        </div>

        <div className="flex flex-1 flex-col border-t-2 border-black/5 bg-[#0e1626] px-3 py-2">
          <p
            className="truncate text-sm font-black text-foreground"
            title={hero.name}
          >
            {hero.name}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {hero.summary}
          </p>
        </div>

        <div className="flex items-center justify-center border-t-2 border-black/5 bg-[#0c1322] px-3 py-2">
          <span className="ls-btn-green h-8 w-full text-xs">View Detail</span>
        </div>
      </div>
    </Link>
  );
}
