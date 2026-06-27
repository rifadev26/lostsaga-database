import { HeroList } from "@/components/HeroList";
import { Breadcrumb } from "@/components/Breadcrumb";
import { heroes, heroRarities, heroTypes } from "@/lib/server/data";
import { Users } from "lucide-react";

export const metadata = {
  title: "Heroes — Lost Saga Database",
};

export default function HeroesPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Heroes" }]} />

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
      />
    </>
  );
}
