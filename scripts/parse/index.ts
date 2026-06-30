import { pathToFileURL } from "node:url";
import { getActiveServers } from "../config";
import { parseTextures } from "./textures";
import { parseIconCdn } from "./icon-cdn";
import { parseItems } from "./items";
import { parseManuals } from "./manuals";
import { parseHeroes } from "./heroes";
import { parseGears } from "./gears";
import { parseMedals } from "./medals";
import { parsePets } from "./pets";

export async function parseServer(alias: string): Promise<void> {
  console.log(`\n========== Parsing server: ${alias} ==========`);

  // Foundation: UI textures and individual icons (must run first).
  await parseTextures(alias);
  await parseIconCdn(alias);

  // Database INIs.
  await parseManuals(alias);
  await parseItems(alias);
  await parseHeroes(alias);
  await parseGears(alias);
  await parseMedals(alias);
  await parsePets(alias);

  console.log(`========== Done: ${alias} ==========\n`);
}

export async function parseAll(): Promise<void> {
  const servers = getActiveServers();
  if (servers.length === 0) {
    console.error("No active servers in SERVERLIST");
    process.exit(1);
  }

  for (const server of servers) {
    if (!server.active) continue;
    await parseServer(server.alias);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const alias = process.argv[2];

  const run = alias ? parseServer(alias) : parseAll();
  run.catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
