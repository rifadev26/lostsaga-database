import Link from "next/link";
import { HeroCard } from "@/components/HeroCard";
import { ImageFallback } from "@/components/ImageFallback";
import {
  getAssetUrl,
  getHeroArtworkCandidates,
  isRegularHero,
} from "@/lib/data";
import { heroes } from "@/lib/server/data";
import { Flame, ArrowRight, Sparkles } from "lucide-react";

export const metadata = {
  title: "Lost Saga Database — Heroes, Gears & More",
};

export default function HomePage() {
  const sortedHeroes = [...heroes].sort(
    (a, b) => parseInt(a.code, 10) - parseInt(b.code, 10)
  );
  const regularHeroes = sortedHeroes.filter(isRegularHero);

  const latest = regularHeroes[regularHeroes.length - 1] ?? sortedHeroes[sortedHeroes.length - 1];
  const featured =
    regularHeroes[Math.floor(Math.random() * regularHeroes.length)] ?? latest;
  const latestHeroes = regularHeroes.slice(-8).reverse();

  return (
    <div className="mx-auto max-w-[1370px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero intro */}
      <section className="mb-10">
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="ls-card flex flex-col p-5 lg:col-span-8">
            <div className="ls-section-header mb-4">
              <Flame className="h-5 w-5" />
              <span>Lost Saga Database</span>
            </div>

            <div className="ls-image-frame relative min-h-[300px] w-full overflow-hidden rounded-xl">
              <ImageFallback
                srcs={getHeroArtworkCandidates(featured).map(getAssetUrl)}
                alt={featured.name}
                fill
                className="object-contain p-4"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/heroes"
                className="ls-btn-blue h-11 w-full gap-2 text-sm sm:w-auto"
              >
                Start Browsing <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-muted-foreground sm:ml-auto">
                {heroes.length} heroes available
              </p>
            </div>
          </div>

          <div className="ls-card overflow-hidden lg:col-span-4">
            <div className="p-5">
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                Latest Hero
              </p>
              <div className="ls-image-frame relative mb-3 aspect-square w-full">
                <ImageFallback
                  srcs={getHeroArtworkCandidates(latest).map(getAssetUrl)}
                  alt={latest.name}
                  fill
                  className="object-contain p-6"
                  priority
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="truncate text-lg font-black text-foreground">
                  {latest.name}
                </h2>
                <span className="rounded border border-[var(--border)] bg-[#0e1626] px-2 py-0.5 text-[10px] font-bold capitalize text-muted-foreground">
                  {latest.rarity}
                </span>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {latest.summary}
              </p>
              <Link
                href={`/heroes/${latest.code}`}
                className="ls-btn-green mt-4 w-full text-xs"
              >
                Open Latest Hero <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Heroes */}
      <section className="mb-10">
        <div className="ls-section-header mb-4">
          <Sparkles className="h-5 w-5" />
          <span>Latest Heroes</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {latestHeroes.map((hero) => (
            <HeroCard key={hero.code} hero={hero} />
          ))}
        </div>
      </section>

      {/* All Heroes quick grid */}
      <section>
        <div className="ls-section-header mb-4">
          <Flame className="h-5 w-5" />
          <span>Popular Heroes</span>
          <Link
            href="/heroes"
            className="ml-auto text-xs font-bold text-white/80 hover:text-white hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {heroes.slice(0, 8).map((hero) => (
            <HeroCard key={hero.code} hero={hero} />
          ))}
        </div>
      </section>
    </div>
  );
}
