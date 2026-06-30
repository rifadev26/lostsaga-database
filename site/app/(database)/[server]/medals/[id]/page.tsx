import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/Breadcrumb";
import { loadMedalById, loadMedals } from "@/lib/server/medals";
import { ItemIcon } from "@/components/ItemIcon";
import { Shield, Info, BookOpen, Award } from "lucide-react";
import { SERVERLIST } from "@/lib/servers";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";

interface MedalPageProps {
  params: Promise<{ server: string; id: string }>;
}

export async function generateStaticParams() {
  const params: Array<{ server: string; id: string }> = [];

  for (const server of SERVERLIST) {
    try {
      const medals = await loadMedals(server.alias);
      params.push(
        ...medals.slice(0, 200).map((medal) => ({
          server: server.alias,
          id: String(medal.id),
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

export async function generateMetadata({ params }: MedalPageProps) {
  const { server, id } = await params;
  const medalById = await loadMedalById(server);
  const medal = medalById.get(Number(id));
  if (!medal) return { title: "Medal Not Found" };

  const image = medal.icon?.pngUrl;
  const description = medal.manual
    ? truncateDescription(medal.manual)
    : `${medal.name} — Lost Saga medal.`;

  return {
    title: medal.name,
    description,
    openGraph: {
      title: medal.name,
      description,
      images: image ? [{ url: image, alt: medal.name }] : [],
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

function GrowthRow({ values, labels }: { values: number[]; labels: string[] }) {
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

export default async function MedalPage({ params }: MedalPageProps) {
  const { server: rawServer, id } = await params;
  const server = resolveServerParam(rawServer);
  const medalById = await loadMedalById(server);
  const medal = medalById.get(Number(id));
  if (!medal || Number.isNaN(Number(id))) notFound();

  const charGrowthLabels = ["Attack", "Defense", "Move Speed", "Dexterity"];
  const itemGrowthLabels = ["Weapon", "Armor", "Helmet", "Cloak"];

  return (
    <>
      <Breadcrumb
        items={serverBreadcrumb(server, [
          { label: "Medals", href: `/${server}/medals` },
          { label: medal.name },
        ])}
      />

      <div className="ls-section-header mb-4">
        <Shield className="h-5 w-5" />
        <span className="truncate">{medal.name}</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          #{medal.id}
        </span>
      </div>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="ls-card flex flex-col items-center justify-center gap-4 p-6">
          <div className="ls-image-frame h-48 w-48">
            {medal.icon ? (
              <ItemIcon icon={medal.icon} maxSize={160} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Award className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          {medal.iconKey && (
            <p className="text-center font-mono text-xs text-muted-foreground">
              {medal.iconKey}
            </p>
          )}
        </div>

        <div className="ls-card p-5">
          <div className="ls-section-header mb-4">
            <Info className="h-4 w-4" />
            <span>Medal Details</span>
          </div>

          <div className="space-y-1">
            <Field label="Item Type" value={medal.itemType} />
            <Field label="Section" value={medal.section} />
            {medal.limitLevel !== undefined && medal.limitLevel > 0 && (
              <Field label="Limit Level" value={medal.limitLevel} />
            )}
            {medal.maxClass !== undefined && medal.maxClass > 0 && (
              <Field label="Max Class" value={medal.maxClass} />
            )}
            {medal.useClasses.length > 0 && (
              <Field
                label="Use Classes"
                value={medal.useClasses.join(", ")}
              />
            )}
            {medal.subMedalType !== undefined && (
              <Field label="Sub Type" value={medal.subMedalType} />
            )}
            {medal.enableSelectStat && (
              <Field label="Selectable Stat" value="Yes" />
            )}
            {medal.totalPoint !== undefined && (
              <Field label="Total Point" value={medal.totalPoint} />
            )}
          </div>

          <Separator className="my-4 bg-[var(--border)]" />

          <div className="space-y-3">
            <Field
              label="Character Growth"
              value={
                <GrowthRow values={medal.charGrowth} labels={charGrowthLabels} />
              }
            />
            <Field
              label="Item Growth"
              value={
                <GrowthRow values={medal.itemGrowth} labels={itemGrowthLabels} />
              }
            />
          </div>

          <Separator className="my-4 bg-[var(--border)]" />

          <div className="space-y-1">
            <Field
              label="Sell Peso"
              value={medal.sellPeso.toLocaleString("en-US")}
            />
          </div>

          {medal.manual && (
            <>
              <Separator className="my-4 bg-[var(--border)]" />

              <div className="ls-section-header mb-4">
                <BookOpen className="h-4 w-4" />
                <span>Manual</span>
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">
                  #{medal.manualId}
                </span>
              </div>
              <div className="max-h-[60vh] overflow-auto rounded-lg border-2 border-[var(--border)] bg-[#0b1120] p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {medal.manual}
                </p>
              </div>
            </>
          )}

          {medal.subIconKey && (
            <>
              <Separator className="my-4 bg-[var(--border)]" />
              <Field label="Sub Icon Key" value={medal.subIconKey} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
