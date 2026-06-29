import { readFile } from "node:fs/promises";
import path from "node:path";

import type { UIImageset } from "@/lib/ui-icons";

export async function loadUIImagesets(): Promise<UIImageset[]> {
  const filePath = path.join(process.cwd(), "..", "data", "ui-imageset.json");
  const raw = await readFile(filePath, "utf8");
  const imagesets = JSON.parse(raw) as UIImageset[];

  if (!Array.isArray(imagesets)) {
    throw new Error(
      `Expected ui-imageset.json to be an array, received ${imagesets === null ? "null" : typeof imagesets}`,
    );
  }

  return imagesets;
}
