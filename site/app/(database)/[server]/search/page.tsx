import { Breadcrumb } from "@/components/Breadcrumb";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { SearchPanel } from "@/components/SearchPanel";
import { loadHeroes } from "@/lib/server/data";
import { loadItems } from "@/lib/server/items";
import { loadGears } from "@/lib/server/gears";
import { loadMedals } from "@/lib/server/medals";
import { loadPets } from "@/lib/server/pets";
import { resolveServerParam } from "@/lib/server/params";
import { Search } from "lucide-react";

export const metadata = {
  title: "Search — Lost Saga Database",
  description:
    "Search across heroes, items, gears, medals, and pets in Lost Saga.",
};

const validCategories = [
  "all",
  "heroes",
  "items",
  "gears",
  "medals",
  "pets",
] as const;
type Category = (typeof validCategories)[number];

function parseCategory(value: unknown): Category {
  const str = typeof value === "string" ? value : "all";
  return validCategories.includes(str as Category) ? (str as Category) : "all";
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ server: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { server: rawServer } = await params;
  const server = resolveServerParam(rawServer);
  const query = await searchParams;
  const [heroes, items, gears, medals, pets] = await Promise.all([
    loadHeroes(server),
    loadItems(server),
    loadGears(server),
    loadMedals(server),
    loadPets(server),
  ]);

  const queryParam = typeof query.q === "string" ? query.q : "";
  const category = parseCategory(query.category);

  return (
    <>
      <Breadcrumb items={serverBreadcrumb(server, [{ label: "Search" }])} />

      <div className="ls-section-header mb-4">
        <Search className="h-5 w-5" />
        <span>Global Search</span>
      </div>

      <SearchPanel
        heroes={heroes}
        items={items}
        gears={gears}
        medals={medals}
        pets={pets}
        server={server}
        initialQuery={queryParam}
        initialCategory={category}
      />
    </>
  );
}
