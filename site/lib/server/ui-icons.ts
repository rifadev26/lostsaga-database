import { readFile } from "node:fs/promises";
import path from "node:path";

import { buildIconMap, type UIIcon, type UIIconsMap } from "@/lib/ui-icons";

export async function loadUIIcons(): Promise<UIIconsMap> {
  const filePath = path.join(process.cwd(), "..", "data", "ui-icons.json");
  const raw = await readFile(filePath, "utf8");
  const icons = JSON.parse(raw) as UIIcon[];

  if (!Array.isArray(icons)) {
    throw new Error(
      `Expected ui-icons.json to be an array, received ${icons === null ? "null" : typeof icons}`,
    );
  }

  return buildIconMap(icons);
}
