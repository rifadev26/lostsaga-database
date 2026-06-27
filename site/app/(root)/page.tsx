import Link from "next/link";
import { HeroCard } from "@/components/HeroCard";
import { PreviewCard } from "@/components/PreviewCard";
import { ImageFallback } from "@/components/ImageFallback";
import {
  getAssetUrl,
  getHeroArtworkCandidates,
  isRegularHero,
} from "@/lib/data";
import { heroes } from "@/lib/server/data";
import { etcItems } from "@/lib/server/items";
import { gears } from "@/lib/server/gears";
import { medals } from "@/lib/server/medals";
import {
  ArrowRight,
  GitFork,
  Users,
  Package,
  Backpack,
  Shield,
  Wrench,
} from "lucide-react";

export const metadata = {
  title: "Lost Saga Database — Heroes, Gears, Items & Medals",
};

export default function HomePage() {
  const sortedHeroes = [...heroes].sort(
    (a, b) => parseInt(a.code, 10) - parseInt(b.code, 10),
  );
  const regularHeroes = sortedHeroes.filter(isRegularHero);

  const latest =
    regularHeroes[regularHeroes.length - 1] ??
    sortedHeroes[sortedHeroes.length - 1];
  const latestHeroes = regularHeroes.slice(-8).reverse();

  return (
    <>
      {/* Hero intro */}
      <section className="mb-10">
        <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
              Lost Saga
              <span className="block text-[#3b82f6]">Database</span>
            </h1>

            <p className="mt-3 text-lg font-semibold italic text-[#22c55e]">
              Every hero. Every gear. Every item. Every medal.
            </p>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              An open-source community project dedicated to collecting every
              hero, gear, item, medal, and command from Lost Saga. Built for
              players, by players.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/heroes" className="ls-btn-blue h-11 gap-2 text-sm">
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

          <div className="flex justify-center lg:col-span-4 lg:col-start-9">
            <div className="ls-card w-full max-w-sm overflow-hidden">
              <div className="p-4">
                <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">
                  Latest Hero
                </p>
                <div className="ls-image-frame relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-lg">
                  <ImageFallback
                    srcs={getHeroArtworkCandidates(latest).map(getAssetUrl)}
                    alt={latest.name}
                    fill
                    className="object-contain p-3"
                    priority
                    sizes="(max-width: 1024px) 80vw, 320px"
                  />
                </div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="truncate text-base font-black text-foreground">
                    {latest.name}
                  </h2>
                  <span className="rounded border border-[var(--border)] bg-[#0e1626] px-2 py-0.5 text-[10px] font-bold capitalize text-muted-foreground">
                    {latest.rarity}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {latest.summary}
                </p>
                <Link
                  href={`/heroes/${latest.code}`}
                  className="ls-btn-blue mt-3 h-9 w-full text-[11px]"
                >
                  Open Latest Hero <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Heroes preview */}
      <section className="mb-10">
        <div className="ls-section-header mb-4">
          <Users className="h-5 w-5" />
          <span>Heroes</span>
          <Link
            href="/heroes"
            className="ml-auto text-xs font-bold text-white/80 hover:text-white hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {latestHeroes.map((hero) => (
            <HeroCard key={hero.code} hero={hero} />
          ))}
        </div>
      </section>

      {/* Items preview */}
      <section className="mb-10">
        <div className="ls-section-header mb-4">
          <Package className="h-5 w-5" />
          <span>Items</span>
          <Link
            href="/items"
            className="ml-auto text-xs font-bold text-white/80 hover:text-white hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {etcItems.slice(0, 8).map((item) => (
            <PreviewCard
              key={item.id}
              href={`/items/${item.id}`}
              name={item.name || item.shopName}
              icon={item.icon}
              label="View Item"
            />
          ))}
        </div>
      </section>

      {/* Gears preview */}
      <section className="mb-10">
        <div className="ls-section-header mb-4">
          <Backpack className="h-5 w-5" />
          <span>Gears</span>
          <Link
            href="/gears"
            className="ml-auto text-xs font-bold text-white/80 hover:text-white hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {gears.slice(0, 8).map((gear) => (
            <PreviewCard
              key={gear.id}
              href={`/gears/${gear.id}`}
              name={gear.name}
              icon={gear.icon}
              label="View Gear"
            />
          ))}
        </div>
      </section>

      {/* Medals preview */}
      <section className="mb-10">
        <div className="ls-section-header mb-4">
          <Shield className="h-5 w-5" />
          <span>Medals</span>
          <Link
            href="/medals"
            className="ml-auto text-xs font-bold text-white/80 hover:text-white hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {medals.slice(0, 8).map((medal) => (
            <PreviewCard
              key={medal.id}
              href={`/medals/${medal.id}`}
              name={medal.name}
              icon={medal.icon}
              label="View Medal"
            />
          ))}
        </div>
      </section>

      {/* Tools promo */}
      <section className="mb-10">
        <div className="ls-section-header mb-4">
          <Wrench className="h-5 w-5" />
          <span>Tools</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/tools/icon-browser"
            className="group ls-card flex flex-col items-center gap-2 p-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0e1626] text-primary transition-colors group-hover:bg-primary/10">
              <Wrench className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-foreground">Icon Browser</p>
            <p className="text-[10px] uppercase text-muted-foreground">
              Inspect UI sprites
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
