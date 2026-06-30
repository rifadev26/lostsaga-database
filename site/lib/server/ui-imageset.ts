import { readFile } from "node:fs/promises";
import type { UIImageset } from "@/lib/ui-icons";
import { getServerDataPath } from "./path";

export async function loadUIImagesets(alias: string): Promise<UIImageset[]> {
  const raw = await readFile(
    getServerDataPath(alias, "ui-imageset.json"),
    "utf8",
  );
  const imagesets = JSON.parse(raw) as UIImageset[];

  if (!Array.isArray(imagesets)) {
    throw new Error(
      `Expected ui-imageset.json to be an array, received ${imagesets === null ? "null" : typeof imagesets}`,
    );
  }

  return imagesets;
}
