import { getServerAlias, SERVERLIST } from "@/lib/servers";
import type { BreadcrumbItem } from "@/components/Breadcrumb";

export function serverBreadcrumb(
  alias: string,
  items: BreadcrumbItem[],
): BreadcrumbItem[] {
  const canonical = getServerAlias(alias) ?? alias;
  const server = SERVERLIST.find((s) => s.alias === canonical);

  return [
    { label: server?.name ?? canonical, href: `/${canonical}` },
    ...items,
  ];
}
