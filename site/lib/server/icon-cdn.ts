import { readFile } from "node:fs/promises";
import path from "node:path";

import { buildIconMap, type IconCdnEntry, type IconCdnMap } from "@/lib/ui-icons";

export async function loadIconCdn(): Promise<IconCdnMap> {
  const filePath = path.join(process.cwd(), "..", "data", "icon-cdn.json");
  const raw = await readFile(filePath, "utf8");
  const entries = JSON.parse(raw) as IconCdnEntry[];

  if (!Array.isArray(entries)) {
    throw new Error(
      `Expected icon-cdn.json to be an array, received ${entries === null ? "null" : typeof entries}`,
    );
  }

  return buildIconMap(entries);
}
