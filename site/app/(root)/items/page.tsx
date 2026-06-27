import { ItemList } from "@/components/ItemList";
import { Breadcrumb } from "@/components/Breadcrumb";
import { etcItems, itemGroups } from "@/lib/server/items";
import { Package } from "lucide-react";

export const metadata = {
  title: "Items — Lost Saga Database",
  description:
    "Browse every consumable, material, and collectible etc item in Lost Saga.",
};

export default function ItemsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Items" }]} />

      <div className="ls-section-header mb-4">
        <Package className="h-5 w-5" />
        <span>Etc Item Database</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          {etcItems.length.toLocaleString("en-US")}
        </span>
      </div>

      <ItemList items={etcItems} itemGroups={itemGroups} />
    </>
  );
}
