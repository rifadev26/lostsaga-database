import { HeroList } from "@/components/HeroList";
import { Breadcrumb } from "@/components/Breadcrumb";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import {
  loadHeroes,
  loadHeroRarities,
  loadHeroTypes,
} from "@/lib/server/data";
import { resolveServerParam } from "@/lib/server/params";
import { Users } from "lucide-react";

export const metadata = {
  title: "Heroes — Lost Saga Database",
};

export default async function HeroesPage({
  params,
  searchParams,
}: {
  params: Promise<{ server: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { server } = await params;
  const query = await searchParams;
  const heroes = await loadHeroes(server);
  const heroTypes = await loadHeroTypes(server);
  const heroRarities = await loadHeroRarities(server);

  return (
    <>
      <Breadcrumb items={serverBreadcrumb(server, [{ label: "Heroes" }])} />

      <div className="ls-section-header mb-4">
        <Users className="h-5 w-5" />
        <span>Hero Database</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          {heroes.length.toLocaleString("en-US")}
        </span>
      </div>

      <HeroList
        heroes={heroes}
        heroTypes={heroTypes}
        heroRarities={heroRarities}
        server={server}
        q={typeof query.q === "string" ? query.q : ""}
        type={typeof query.type === "string" ? query.type : ""}
        rarity={typeof query.rarity === "string" ? query.rarity : ""}
        sort={typeof query.sort === "string" ? query.sort : "code"}
        page={typeof query.page === "string" ? Number(query.page) : 1}
      />
    </>
  );
}
