import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SERVERLIST } from "@/lib/servers";
import { serverBreadcrumb } from "@/lib/breadcrumb";
import { resolveServerParam } from "@/lib/server/params";
import { loadHeroes } from "@/lib/server/data";
import { loadItems } from "@/lib/server/items";
import { loadGears } from "@/lib/server/gears";
import { loadMedals } from "@/lib/server/medals";
import { loadPets } from "@/lib/server/pets";
import {
  ArrowRight,
  Backpack,
  Bone,
  Cloud,
  Database,
  Image,
  Package,
  Search,
  Server,
  Shield,
  Users,
} from "lucide-react";

interface ServerHomePageProps {
  params: Promise<{ server: string }>;
}

export async function generateMetadata({ params }: ServerHomePageProps) {
  const { server: rawServer } = await params;
  const serverInfo = SERVERLIST.find(
    (s) => s.alias.toLowerCase() === rawServer.toLowerCase(),
  );

  return {
    title: serverInfo ? serverInfo.name : rawServer,
  };
}

export default async function ServerHomePage({ params }: ServerHomePageProps) {
  const { server: rawServer } = await params;
  const server = resolveServerParam(rawServer);
  const serverInfo = SERVERLIST.find((s) => s.alias === server);

  if (!serverInfo) {
    notFound();
  }

  const [heroes, items, gears, medals, pets] = await Promise.all([
    loadHeroes(server).catch(() => [] as Awaited<ReturnType<typeof loadHeroes>>),
    loadItems(server).catch(() => [] as Awaited<ReturnType<typeof loadItems>>),
    loadGears(server).catch(() => [] as Awaited<ReturnType<typeof loadGears>>),
    loadMedals(server).catch(() => [] as Awaited<ReturnType<typeof loadMedals>>),
    loadPets(server).catch(() => [] as Awaited<ReturnType<typeof loadPets>>),
  ]);

  const categories = [
    {
      href: `/${server}/heroes`,
      label: "Heroes",
      sub: "Database",
      icon: Users,
      count: heroes.length,
    },
    {
      href: `/${server}/items`,
      label: "Items",
      sub: "Compendium",
      icon: Package,
      count: items.length,
    },
    {
      href: `/${server}/gears`,
      label: "Gears",
      sub: "Equipment",
      icon: Backpack,
      count: gears.length,
    },
    {
      href: `/${server}/medals`,
      label: "Medals",
      sub: "Collection",
      icon: Shield,
      count: medals.length,
    },
    {
      href: `/${server}/pets`,
      label: "Pets",
      sub: "Companions",
      icon: Bone,
      count: pets.length,
    },
  ];

  const utilities = [
    {
      href: `/${server}/search`,
      label: "Global Search",
      sub: "Search everything",
      icon: Search,
    },
    {
      href: `/${server}/icon-browser`,
      label: "Icon Browser",
      sub: "Browse UI icons",
      icon: Image,
    },
    {
      href: `/${server}/icon-cdn`,
      label: "Icon CDN",
      sub: "Browse CDN icons",
      icon: Cloud,
    },
  ];

  return (
    <>
      <Breadcrumb items={serverBreadcrumb(server, [])} />

      <section className="mb-8">
        <div className="ls-section-header mb-4">
          <Server className="h-5 w-5" />
          <span>{serverInfo.name}</span>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
            {serverInfo.alias}
          </span>
        </div>

        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Welcome to the {serverInfo.name} database. Explore heroes, gears,
          items, medals, pets, and other assets below.
        </p>
      </section>

      <section className="mb-8">
        <div className="ls-section-header mb-4">
          <Database className="h-5 w-5" />
          <span>Database</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group ls-card flex flex-col items-start gap-2 p-5 transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <category.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-black text-foreground">
                    {category.label}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>

              <div className="flex w-full items-center justify-between">
                <span className="text-[10px] uppercase text-muted-foreground">
                  {category.sub}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-foreground">
                  {category.count.toLocaleString("en-US")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="ls-section-header mb-4">
          <Search className="h-5 w-5" />
          <span>Utilities</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {utilities.map((utility) => (
            <Link
              key={utility.href}
              href={utility.href}
              className="group ls-card flex flex-col items-start gap-2 p-5 transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <utility.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-black text-foreground">
                    {utility.label}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>

              <span className="text-[10px] uppercase text-muted-foreground">
                {utility.sub}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
