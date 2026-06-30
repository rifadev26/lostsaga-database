import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Gear, getHeroArtworkCandidates } from "@/lib/data";
import { loadHeroByCode } from "@/lib/server/data";
import { ImageFallback } from "@/components/ImageFallback";
import { HeroImageGallery } from "@/components/HeroImageGallery";
import { Swords, Shield } from "lucide-react";
import { SERVERLIST } from "@/lib/servers";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";

interface HeroPageProps {
  params: Promise<{ server: string; code: string }>;
}

export async function generateStaticParams() {
  const params: Array<{ server: string; code: string }> = [];

  for (const server of SERVERLIST) {
    try {
      const heroByCode = await loadHeroByCode(server.alias);
      for (const code of heroByCode.keys()) {
        params.push({ server: server.alias, code });
      }
    } catch {
      // Server data not available yet; skip static params for this alias.
    }
  }

  return params;
}

export async function generateMetadata({ params }: HeroPageProps) {
  const { server, code } = await params;
  const heroByCode = await loadHeroByCode(server);
  const hero = heroByCode.get(code);
  if (!hero) return { title: "Hero Not Found" };

  const image = getHeroArtworkCandidates(hero).find(Boolean);

  return {
    title: hero.name,
    description: hero.summary,
    openGraph: {
      title: hero.name,
      description: hero.summary,
      images: image ? [{ url: image, alt: hero.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      images: image ? [image] : [],
    },
  };
}

function GearCard({ gear }: { gear: Gear }) {
  const skillSrcs = [gear.skill?.icon, gear.skill?.emoticon].filter(
    (s): s is string => Boolean(s),
  );

  return (
    <div className="ls-card flex items-center gap-3 overflow-hidden p-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border">
        <ImageFallback
          srcs={gear.icon ? [gear.icon] : []}
          alt={gear.name}
          fill
          className="object-cover"
          sizes="44px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">
          {gear.name}
        </p>
        <p className="text-xs capitalize text-muted-foreground">
          {gear.item_type} · {gear.rarity}
        </p>
        {gear.skill?.name && (
          <p className="truncate text-xs font-medium text-primary">
            {gear.skill.name}
          </p>
        )}
      </div>
      {skillSrcs.length > 0 && (
        <div className="flex shrink-0 gap-1.5">
          {skillSrcs.slice(0, 2).map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative h-9 w-9 overflow-hidden rounded-md border"
            >
              <ImageFallback
                srcs={[src]}
                alt={gear.skill?.name || gear.name}
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function HeroPage({ params }: HeroPageProps) {
  const { server: rawServer, code } = await params;
  const server = resolveServerParam(rawServer);
  const heroByCode = await loadHeroByCode(server);
  const hero = heroByCode.get(code);
  if (!hero) notFound();

  return (
    <>
      <Breadcrumb
        items={serverBreadcrumb(server, [
          { label: "Heroes", href: `/${server}/heroes` },
          { label: hero.name },
        ])}
      />

      <div className="ls-section-header mb-4">
        <Swords className="h-5 w-5" />
        <span className="truncate">{hero.name}</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          #{hero.code}
        </span>
      </div>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <HeroImageGallery hero={hero} />

        <div className="ls-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[#0e1626] px-2 py-1 text-xs font-bold capitalize text-foreground">
              <Swords className="h-3 w-3" /> {hero.type}
            </span>
            <span className="rounded border border-[var(--border)] bg-[#0e1626] px-2 py-1 text-xs font-bold capitalize text-foreground">
              {hero.rarity}
            </span>
          </div>

          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {hero.summary}
          </p>

          <Separator className="my-6 bg-[var(--border)]" />

          <div className="ls-section-header mb-4">
            <Shield className="h-5 w-5" />
            <span>Gear</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {hero.gears.map((gear, i) => (
              <GearCard key={`${(gear as Gear).id}-${i}`} gear={gear as Gear} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
