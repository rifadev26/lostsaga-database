import { readFile } from "node:fs/promises";
import { buildIconMap, type UIIcon, type UIIconsMap } from "@/lib/ui-icons";
import { getServerDataPath } from "./path";

export async function loadUIIcons(alias: string): Promise<UIIconsMap> {
  const raw = await readFile(getServerDataPath(alias, "ui-icons.json"), "utf8");
  const icons = JSON.parse(raw) as UIIcon[];

  if (!Array.isArray(icons)) {
    throw new Error(
      `Expected ui-icons.json to be an array, received ${icons === null ? "null" : typeof icons}`,
    );
  }

  return buildIconMap(icons);
}
