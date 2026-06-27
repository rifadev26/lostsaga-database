import { GearList } from "@/components/GearList";
import { Breadcrumb } from "@/components/Breadcrumb";
import { gears, gearTypes, gearRarities } from "@/lib/server/gears";
import { Swords } from "lucide-react";

export const metadata = {
  title: "Gears — Lost Saga Database",
  description:
    "Browse every weapon, armor, helmet, and cloak in Lost Saga.",
};

export default function GearsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Gears" }]} />

      <div className="ls-section-header mb-4">
        <Swords className="h-5 w-5" />
        <span>Gear Database</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          {gears.length.toLocaleString("en-US")}
        </span>
      </div>

      <GearList gears={gears} gearTypes={gearTypes} gearRarities={gearRarities} />
    </>
  );
}
