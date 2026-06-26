import Link from "next/link";
import { HeroCard } from "@/components/HeroCard";
import { ImageFallback } from "@/components/ImageFallback";
import {
  getAssetUrl,
  getHeroArtworkCandidates,
  isRegularHero,
} from "@/lib/data";
import { heroes } from "@/lib/server/data";
import { Flame, ArrowRight, Sparkles, GitFork } from "lucide-react";

export const metadata = {
  title: "Lost Saga Database — Heroes, Gears & More",
};

export default function HomePage() {
  const sortedHeroes = [...heroes].sort(
    (a, b) => parseInt(a.code, 10) - parseInt(b.code, 10)
  );
  const regularHeroes = sortedHeroes.filter(isRegularHero);

  const latest =
    regularHeroes[regularHeroes.length - 1] ??
    sortedHeroes[sortedHeroes.length - 1];
  const latestHeroes = regularHeroes.slice(-8).reverse();

  return (
    <div className="mx-auto max-w-[1370px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero intro */}
      <section className="mb-10">
        <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
              Lost Saga
              <span className="block text-[#3b82f6]">Database</span>
            </h1>

            <p className="mt-3 text-lg font-semibold italic text-[#22c55e]">
              Every hero. Every gear. All in one place.
            </p>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              An open-source community project dedicated to collecting every
              hero, gear, item, and command from Lost Saga. Built for players,
              by players.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/heroes"
                className="ls-btn-blue h-11 gap-2 text-sm"
              >
                Browse Heroes <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/rifadev26/lostsaga-database"
                target="_blank"
                rel="noopener noreferrer"
                className="ls-btn-green h-11 gap-2 text-sm"
              >
                <GitFork className="h-4 w-4" /> Contribute
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="ls-card overflow-hidden">
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
                  className="ls-btn-blue mt-4 w-full text-xs"
                >
                  Open Latest Hero <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
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
