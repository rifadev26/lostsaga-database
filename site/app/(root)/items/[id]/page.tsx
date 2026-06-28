import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb } from "@/components/Breadcrumb";
import { etcItems, itemById, manualById } from "@/lib/server/items";
import { ItemIcon } from "@/components/ItemIcon";
import { Package, Info, BookOpen } from "lucide-react";

interface ItemPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return etcItems.slice(0, 200).map((item) => ({ id: String(item.id) }));
}

export async function generateMetadata({ params }: ItemPageProps) {
  const { id } = await params;
  const item = itemById.get(Number(id));
  if (!item) return { title: "Item Not Found" };

  const name = item.name || item.shopName;
  const image = item.icon?.pngUrl;

  return {
    title: name,
    openGraph: {
      title: name,
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
    <div className="grid grid-cols-[120px_1fr] items-start gap-2 border-b border-[var(--border)] py-2 last:border-b-0">
      <span className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${
        value
          ? "bg-[#22c55e]/10 text-[#22c55e]"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { id } = await params;
  const item = itemById.get(Number(id));
  if (!item || Number.isNaN(Number(id))) notFound();

  const manual =
    item.inventoryManual > 0 ? manualById.get(item.inventoryManual) : undefined;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Items", href: "/items" },
          { label: item.name || item.shopName },
        ]}
      />

      <div className="ls-section-header mb-4">
        <Package className="h-5 w-5" />
        <span className="truncate">{item.name || item.shopName}</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          #{item.id}
        </span>
      </div>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="ls-card flex flex-col items-center justify-center gap-4 p-6">
          <div className="ls-image-frame h-48 w-48">
            {item.icon ? (
              <ItemIcon icon={item.icon} maxSize={160} />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
          {item.iconKey && (
            <p className="text-center font-mono text-xs text-muted-foreground">
              {item.iconKey}
            </p>
          )}
        </div>

        <div className="ls-card p-5">
          <div className="ls-section-header mb-4">
            <Info className="h-4 w-4" />
            <span>Item Details</span>
          </div>

          {item.name !== item.shopName && item.shopName && (
            <Field label="Shop Name" value={item.shopName} />
          )}

          <div className="space-y-1">
            <Field label="Type Code" value={item.type} />
            <Field
              label="Group"
              value={
                item.group !== undefined ? (
                  <span className="rounded bg-[#0e1626] px-2 py-0.5 text-xs font-bold text-foreground">
                    Group {item.group}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )
              }
            />
            <Field label="Section" value={item.section} />
            {item.value !== undefined && (
              <Field label="Value" value={item.value.toLocaleString("en-US")} />
            )}
          </div>

          <Separator className="my-4 bg-[var(--border)]" />

          <div className="space-y-1">
            <Field label="Active" value={<BooleanBadge value={item.active} />} />
            <Field
              label="Sellable"
              value={<BooleanBadge value={item.canSell} />}
            />
            <Field
              label="Sell Peso"
              value={item.sellPeso.toLocaleString("en-US")}
            />
            {item.buyPeso !== undefined && (
              <Field
                label="Buy Peso"
                value={item.buyPeso.toLocaleString("en-US")}
              />
            )}
            {item.cash !== undefined && item.cash > 0 && (
              <Field
                label="Cash"
                value={
                  <span className="text-[#f59e0b]">
                    {item.cash.toLocaleString("en-US")}
                  </span>
                }
              />
            )}
          </div>

          <Separator className="my-4 bg-[var(--border)]" />

          <div className="space-y-1">
            <Field
              label="Inventory Sub Manual"
              value={item.inventorySubManual}
            />
            {item.decorationMaxCheck !== undefined && (
              <Field
                label="Decoration Max"
                value={<BooleanBadge value={item.decorationMaxCheck} />}
              />
            )}
            {item.limitClassNum !== undefined && (
              <Field label="Limit Class" value={item.limitClassNum} />
            )}
            {item.limitActiveFilter !== undefined && (
              <Field
                label="Limit Active"
                value={<BooleanBadge value={item.limitActiveFilter} />}
              />
            )}
            {item.maxSoldier !== undefined && (
              <Field label="Max Soldier" value={item.maxSoldier} />
            )}
          </div>

          {manual && (
            <>
              <Separator className="my-4 bg-[var(--border)]" />

              <div className="ls-section-header mb-4">
                <BookOpen className="h-4 w-4" />
                <span>Inventory Manual</span>
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">
                  #{item.inventoryManual}
                </span>
              </div>
              <div className="max-h-[60vh] overflow-auto rounded-lg border-2 border-[var(--border)] bg-[#0b1120] p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {manual.text}
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
