import { GearList } from "@/components/GearList";
import { Breadcrumb } from "@/components/Breadcrumb";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";
import { loadGearRarities, loadGears, loadGearTypes } from "@/lib/server/gears";
import { Swords } from "lucide-react";

export const metadata = {
  title: "Gears — Lost Saga Database",
  description:
    "Browse every weapon, armor, helmet, and cloak in Lost Saga.",
};

export default async function GearsPage({
  params,
  searchParams,
}: {
  params: Promise<{ server: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { server: rawServer } = await params;
  const server = resolveServerParam(rawServer);
  const query = await searchParams;
  const gears = await loadGears(server);
  const gearTypes = await loadGearTypes(server);
  const gearRarities = await loadGearRarities(server);

  return (
    <>
      <Breadcrumb items={serverBreadcrumb(server, [{ label: "Gears" }])} />

      <div className="ls-section-header mb-4">
        <Swords className="h-5 w-5" />
        <span>Gear Database</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          {gears.length.toLocaleString("en-US")}
        </span>
      </div>

      <GearList
        gears={gears}
        gearTypes={gearTypes}
        gearRarities={gearRarities}
        server={server}
        q={typeof query.q === "string" ? query.q : ""}
        type={typeof query.type === "string" ? query.type : ""}
        rarity={typeof query.rarity === "string" ? query.rarity : ""}
        extra={typeof query.extra === "string" ? query.extra : ""}
        sort={typeof query.sort === "string" ? query.sort : "id"}
        page={typeof query.page === "string" ? Number(query.page) : 1}
      />
    </>
  );
}
