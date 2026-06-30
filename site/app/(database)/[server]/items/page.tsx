import { ItemList } from "@/components/ItemList";
import { Breadcrumb } from "@/components/Breadcrumb";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";
import { loadItemGroups, loadItems } from "@/lib/server/items";
import { Package } from "lucide-react";

export const metadata = {
  title: "Items — Lost Saga Database",
  description:
    "Browse every consumable, material, and collectible etc item in Lost Saga.",
};

export default async function ItemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ server: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { server: rawServer } = await params;
  const server = resolveServerParam(rawServer);
  const query = await searchParams;
  const etcItems = await loadItems(server);
  const itemGroups = await loadItemGroups(server);

  return (
    <>
      <Breadcrumb items={serverBreadcrumb(server, [{ label: "Items" }])} />

      <div className="ls-section-header mb-4">
        <Package className="h-5 w-5" />
        <span>Etc Item Database</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
          {etcItems.length.toLocaleString("en-US")}
        </span>
      </div>

      <ItemList
        items={etcItems}
        itemGroups={itemGroups}
        server={server}
        q={typeof query.q === "string" ? query.q : ""}
        group={typeof query.group === "string" ? query.group : ""}
        type={typeof query.type === "string" ? query.type : ""}
        sort={typeof query.sort === "string" ? query.sort : "id"}
        page={typeof query.page === "string" ? Number(query.page) : 1}
      />
    </>
  );
}
