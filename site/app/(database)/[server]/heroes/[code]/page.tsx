import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getHeroArtworkCandidates } from "@/lib/data";
import type { Gear } from "@/lib/gears";
import { loadHeroByCode } from "@/lib/server/data";
import { ImageFallback } from "@/components/ImageFallback";
import { ItemIcon } from "@/components/ItemIcon";
import { HeroImageGallery } from "@/components/HeroImageGallery";
import { Swords, Shield } from "lucide-react";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";

interface HeroPageProps {
  params: Promise<{ server: string; code: string }>;
}

export const revalidate = 3600;

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

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-2 border-b border-[var(--border)] py-2 last:border-b-0">
      <span className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function GearCard({ gear }: { gear: Gear }) {
  const skillSrcs = [gear.skill?.icon, gear.skill?.emoticon].filter(
    (s): s is string => Boolean(s),
  );

  const statEntries = Object.entries(gear.stats).filter(
    ([key]) =>
      key === "armor_class" ||
      key === "speed_class" ||
      key.startsWith("priority_"),
  );

  return (
    <div className="ls-card flex flex-col gap-3 overflow-hidden p-4">
      <div className="flex items-start gap-3">
        <div className="ls-image-frame flex h-16 w-16 shrink-0 items-center justify-center">
          {gear.icon ? (
            <ItemIcon icon={gear.icon} maxSize={56} />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">
            {gear.name}
          </p>
          {gear.nameKr && gear.nameKr !== gear.name && (
            <p className="truncate text-xs text-muted-foreground">
              {gear.nameKr}
            </p>
          )}
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            Code {gear.code} · Item {gear.itemNumber}
          </p>
          {gear.iconKey && (
            <p className="font-mono text-[10px] text-muted-foreground">
              {gear.iconKey}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="inline-flex items-center rounded border border-[var(--border)] bg-[#0e1626] px-1.5 py-0.5 text-[10px] font-bold capitalize text-foreground">
              {gear.itemType}
            </span>
            {gear.subType && gear.subType !== "DEFAULT" && (
              <span className="inline-flex items-center rounded border border-[var(--border)] bg-[#0e1626] px-1.5 py-0.5 text-[10px] font-bold capitalize text-foreground">
                {gear.subType}
              </span>
            )}
            {gear.rarity && (
              <span className="inline-flex items-center rounded bg-[#0e1626] px-1.5 py-0.5 text-[10px] font-bold capitalize text-foreground">
                {gear.rarity}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                gear.isExtra
                  ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                  : "bg-[#22c55e]/10 text-[#22c55e]"
              }`}
            >
              {gear.isExtra ? "Extra" : "Default"}
            </span>
          </div>
        </div>
      </div>

      {statEntries.length > 0 && (
        <>
          <Separator className="bg-[var(--border)]" />
          <div className="space-y-1">
            {statEntries.map(([key, value]) => (
              <Field
                key={key}
                label={key.replace(/_/g, " ")}
                value={Number.isInteger(value) ? value : value.toFixed(1)}
              />
            ))}
          </div>
        </>
      )}

      {gear.skill && (
        <>
          <Separator className="bg-[var(--border)]" />
          <div>
            <div className="ls-section-header mb-2">
              <Swords className="h-4 w-4" />
              <span>Skill</span>
              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">
                {gear.skill.name}
              </span>
            </div>

            <div className="flex items-start gap-3">
              {skillSrcs.length > 0 && (
                <div className="flex shrink-0 gap-2">
                  {skillSrcs.map((src, i) => (
                    <div
                      key={`${src}-${i}`}
                      className="relative h-10 w-10 overflow-hidden rounded-lg border"
                    >
                      <ImageFallback
                        srcs={[src]}
                        alt={gear.skill?.name || gear.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-1">
                {gear.skill.desc_name && (
                  <p className="text-sm font-bold text-foreground">
                    {gear.skill.desc_name}
                  </p>
                )}
                {gear.skill.desc && (
                  <p className="text-sm text-muted-foreground">
                    {gear.skill.desc}
                  </p>
                )}
                {gear.skill.desc_kr && (
                  <p className="text-sm text-muted-foreground">
                    {gear.skill.desc_kr}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
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

          {hero.summary && (
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              {hero.summary}
            </p>
          )}

          {hero.default_ani && (
            <div className="mt-2">
              <Field label="Default Animation" value={hero.default_ani} />
            </div>
          )}

          <Separator className="my-6 bg-[var(--border)]" />

          <div className="ls-section-header mb-4">
            <Shield className="h-5 w-5" />
            <span>Gear</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {hero.gears.map((gear, i) => (
              <GearCard key={`${gear.id}-${i}`} gear={gear} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
