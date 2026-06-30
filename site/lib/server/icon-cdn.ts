import { readFile } from "node:fs/promises";
import { buildIconMap, type IconCdnEntry, type IconCdnMap } from "@/lib/ui-icons";
import { getServerDataPath } from "./path";

export async function loadIconCdn(alias: string): Promise<IconCdnMap> {
  const raw = await readFile(getServerDataPath(alias, "icon-cdn.json"), "utf8");
  const entries = JSON.parse(raw) as IconCdnEntry[];

  if (!Array.isArray(entries)) {
    throw new Error(
      `Expected icon-cdn.json to be an array, received ${entries === null ? "null" : typeof entries}`,
    );
  }

  return buildIconMap(entries);
}
