import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  loadPetById,
  loadPetFeedRanks,
  loadPets,
  petStatLabels,
} from "@/lib/server/pets";
import { ItemIcon } from "@/components/ItemIcon";
import { Bone, Info, BookOpen, Utensils } from "lucide-react";
import { SERVERLIST } from "@/lib/servers";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";

interface PetPageProps {
  params: Promise<{ server: string; id: string }>;
}

export async function generateStaticParams() {
  const params: Array<{ server: string; id: string }> = [];

  for (const server of SERVERLIST) {
    try {
      const pets = await loadPets(server.alias);
      params.push(
        ...pets.map((pet) => ({
          server: server.alias,
          id: String(pet.id),
        })),
      );
    } catch {
      // Skip alias with no data yet.
    }
  }

  return params;
}

function truncateDescription(text: string, max = 155): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max).trimEnd() + "…";
}

export async function generateMetadata({ params }: PetPageProps) {
  const { server, id } = await params;
  const petById = await loadPetById(server);
  const pet = petById.get(Number(id));
  if (!pet) return { title: "Pet Not Found" };

  const name = pet.views[0]?.name || `Pet #${pet.id}`;
  const image = pet.views[0]?.icon?.pngUrl;
  const description = pet.manual
    ? truncateDescription(pet.manual)
    : `${name} — Lost Saga pet.`;

  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      images: image ? [{ url: image, alt: name }] : [],
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
    <div className="grid grid-cols-[140px_1fr] items-start gap-2 border-b border-[var(--border)] py-2 last:border-b-0">
      <span className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function StatRow({ values, labels }: { values: number[]; labels: string[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {values.map((v, i) => (
        <div
          key={i}
          className="rounded bg-[#0e1626] px-2 py-1 text-center text-xs"
        >
          <span className="block text-[10px] uppercase text-muted-foreground">
            {labels[i] ?? `+${i + 1}`}
          </span>
          <span className="font-mono font-bold text-foreground">
            {v > 0 ? `+${v}` : v}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function PetPage({ params }: PetPageProps) {
  const { server: rawServer, id } = await params;
  const server = resolveServerParam(rawServer);
  const petById = await loadPetById(server);
  const pet = petById.get(Number(id));
  if (!pet || Number.isNaN(Number(id))) notFound();

  const displayName = pet.views[0]?.name || `Pet #${pet.id}`;
  const petFeedRanks = await loadPetFeedRanks(server);

  return (
    <>
      <Breadcrumb
        items={serverBreadcrumb(server, [
          { label: "Pets", href: `/${server}/pets` },
          { label: displayName },
        ])}
      />

      <div className="ls-section-header mb-4">
        <Bone className="h-5 w-5" />
        <span className="truncate">{displayName}</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          #{pet.id}
        </span>
      </div>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          {pet.views.map((view, idx) => (
            <div
              key={`${view.rank}-${idx}`}
              className="ls-card flex items-center gap-4 p-4"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-[#0b1120]">
                {view.icon ? (
                  <ItemIcon icon={view.icon} maxSize={64} />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {view.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rank {view.rank}
                </p>
                {view.iconKey && (
                  <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                    {view.iconKey}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="ls-card p-5">
          <div className="ls-section-header mb-4">
            <Info className="h-4 w-4" />
            <span>Pet Details</span>
          </div>

          <div className="space-y-1">
            <Field label="Base Rank" value={pet.baseRank} />
            <Field label="Max Rank" value={pet.maxRank} />
            {pet.needMaterial !== undefined && (
              <Field label="Need Material" value={pet.needMaterial} />
            )}
            {pet.manualId > 0 && (
              <Field label="Manual ID" value={`#${pet.manualId}`} />
            )}
          </div>

          <Separator className="my-4 bg-[var(--border)]" />

          <div className="space-y-3">
            <Field
              label="Base Growth"
              value={
                <StatRow
                  values={pet.baseStatGrowth}
                  labels={petStatLabels}
                />
              }
            />
            <Field
              label="Add Stat Types"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {pet.addStatTypes.length > 0 ? (
                    pet.addStatTypes.map((type, i) => (
                      <span
                        key={i}
                        className="rounded bg-[#0e1626] px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        Slot {i + 1}: {type > 0 ? `Type ${type}` : "—"}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              }
            />
          </div>

          {petFeedRanks.length > 0 && (
            <>
              <Separator className="my-4 bg-[var(--border)]" />

              <div className="ls-section-header mb-4">
                <Utensils className="h-4 w-4" />
                <span>Feed Info</span>
              </div>
              <div className="space-y-3">
                {petFeedRanks.map((rank) => (
                  <div key={rank.rank} className="ls-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold">
                        Rank {rank.rank}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Max level {rank.maxLevel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {rank.materials.map((amount, i) => (
                        <span
                          key={i}
                          className="rounded bg-[#0e1626] px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          Lv.{i + 1}: {amount.toLocaleString("en-US")}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {pet.manual && (
            <>
              <Separator className="my-4 bg-[var(--border)]" />

              <div className="ls-section-header mb-4">
                <BookOpen className="h-4 w-4" />
                <span>Manual</span>
              </div>
              <div className="max-h-[60vh] overflow-auto rounded-lg border-2 border-[var(--border)] bg-[#0b1120] p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {pet.manual}
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
