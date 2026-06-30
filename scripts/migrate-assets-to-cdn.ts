import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR, SERVERLIST, ASSETS_IMAGE_BASE_URL } from "./config";

async function walk(dir: string): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }

    if (!entry.name.endsWith(".json")) continue;

    let text = await readFile(fullPath, "utf8");
    const original = text;

    for (const server of SERVERLIST) {
      const regex = new RegExp(
        `(["'])/images/${server.alias}/`,
        "g",
      );
      text = text.replace(
        regex,
        `$1${ASSETS_IMAGE_BASE_URL}/${server.alias}/`,
      );
    }

    if (text !== original) {
      await writeFile(fullPath, text, "utf8");
      console.log(`Migrated ${fullPath}`);
    }
  }
}

walk(DATA_DIR)
  .then(() => console.log("Done"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
