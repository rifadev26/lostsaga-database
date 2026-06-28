import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/Breadcrumb";
import { gears, gearById } from "@/lib/server/gears";
import { ItemIcon } from "@/components/ItemIcon";
import { ImageFallback } from "@/components/ImageFallback";
import { getAssetUrl } from "@/lib/data";
import { Swords, Info } from "lucide-react";

interface GearPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return gears.slice(0, 200).map((gear) => ({ id: String(gear.id) }));
}

export async function generateMetadata({ params }: GearPageProps) {
  const { id } = await params;
  const gear = gearById.get(Number(id));
  if (!gear) return { title: "Gear Not Found" };

  const image = gear.icon?.pngUrl;

  return {
    title: gear.name,
    openGraph: {
      title: gear.name,
      images: image ? [{ url: image, alt: gear.name }] : [],
    },
    twitter: {
      card: "summary",
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

export default async function GearPage({ params }: GearPageProps) {
  const { id } = await params;
  const gear = gearById.get(Number(id));
  if (!gear || Number.isNaN(Number(id))) notFound();

  const stats = Object.entries(gear.stats);
  const skillSrcs = [gear.skill?.icon, gear.skill?.emoticon]
    .filter((s): s is string => Boolean(s))
    .map((s) => getAssetUrl(s));

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Gears", href: "/gears" },
          { label: gear.name },
        ]}
      />

      <div className="ls-section-header mb-4">
        <Swords className="h-5 w-5" />
        <span className="truncate">{gear.name}</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          Code {gear.code}
        </span>
      </div>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="ls-card flex flex-col items-center justify-center gap-4 p-6">
          <div className="ls-image-frame h-48 w-48">
            {gear.icon ? (
              <ItemIcon icon={gear.icon} maxSize={160} />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
          {gear.iconKey && (
            <p className="text-center font-mono text-xs text-muted-foreground">
              {gear.iconKey}
            </p>
          )}
        </div>

        <div className="ls-card p-5">
          <div className="ls-section-header mb-4">
            <Info className="h-4 w-4" />
            <span>Gear Details</span>
          </div>

          {gear.nameKr && gear.nameKr !== gear.name && (
            <Field label="Korean Name" value={gear.nameKr} />
          )}

          <div className="space-y-1">
            <Field label="Gear Code" value={gear.code} />
            <Field label="Type" value={gear.itemType} />
            {gear.subType && gear.subType !== "DEFAULT" && (
              <Field label="Sub Type" value={gear.subType} />
            )}
            {gear.rarity && (
              <Field
                label="Rarity"
                value={
                  <span className="rounded bg-[#0e1626] px-2 py-0.5 text-xs font-bold capitalize text-foreground">
                    {gear.rarity}
                  </span>
                }
              />
            )}
            <Field
              label="Source"
              value={
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    gear.isExtra
                      ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                      : "bg-[#22c55e]/10 text-[#22c55e]"
                  }`}
                >
                  {gear.isExtra ? "Extra" : "Default"}
                </span>
              }
            />
          </div>

          {stats.length > 0 && (
            <>
              <Separator className="my-4 bg-[var(--border)]" />
              <div className="space-y-1">
                {stats.map(([key, value]) => (
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
              <Separator className="my-4 bg-[var(--border)]" />
              <div className="ls-section-header mb-4">
                <Swords className="h-4 w-4" />
                <span>Skill</span>
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">
                  {gear.skill.name}
                </span>
              </div>

              <div className="flex items-start gap-4">
                {skillSrcs.length > 0 && (
                  <div className="flex shrink-0 gap-2">
                    {skillSrcs.map((src, i) => (
                      <div
                        key={`${src}-${i}`}
                        className="relative h-12 w-12 overflow-hidden rounded-lg border"
                      >
                        <ImageFallback
                          srcs={[src]}
                          alt={gear.skill?.name || gear.name}
                          fill
                          className="object-cover"
                          sizes="48px"
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
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
