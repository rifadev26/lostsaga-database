import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getServerConfigDir, getServerDataDir } from "../config";
import { readPlainIni, parseIniSections, normalizeNumber } from "../lib/ini-loader";
import { runWithConcurrency } from "../lib/queue";
import { exists, readJson, writeJson } from "../lib/utils";
import type { Gear, GearIcon, GearSkill, Hero } from "./heroes";

const ICON_CDN_JSON = "icon-cdn.json";
const MERCENARY_JSON = "mercenary.json";
const GEARS_JSON = "gears.json";
const CONCURRENCY = 10;

interface CdnIcon {
  id: number;
  imageset: string;
  name: string;
  iconFile: string;
  iconPngUrl: string;
  width: number;
  height: number;
}

function buildCdnIconMap(icons: CdnIcon[]): Record<string, CdnIcon> {
  const map: Record<string, CdnIcon> = {};
  for (const icon of icons) {
    map[`${icon.imageset}#${icon.name}`] = icon;
  }
  return map;
}

function parseItemNumber(sectionName: string): number | null {
  const match = /^item(\d+)$/i.exec(sectionName);
  return match ? Number(match[1]) : null;
}

function extractStats(fields: Record<string, string>): Record<string, number> {
  const stats: Record<string, number> = {};
  const statKeys = [
    "armor_class",
    "speed_class",
    "priority_defense",
    "priority_dash",
    "priority_jump",
    "priority_getup",
    "priority_wounded",
    "priority_delay",
    "priority_run",
    "priority_attack",
    "priority_extend_attack",
  ];

  for (const key of statKeys) {
    const raw = fields[key];
    if (!raw) continue;
    const cleaned = raw.replace(/f$/i, "").trim();
    const num = parseFloat(cleaned);
    if (!Number.isNaN(num)) {
      stats[key] = num;
    }
  }

  return stats;
}

async function readHeroGearIni(
  alias: string,
  configDir: string,
  code: string,
  type: "item" | "extraitem",
): Promise<ReturnType<typeof parseIniSections> | null> {
  const baseName = `${code}_${type}.ini`;
  const plainPath = path.join(configDir, "mercenary", code, baseName);

  if (!(await exists(plainPath))) {
    return null;
  }

  try {
    const text = await readPlainIni(plainPath);
    return parseIniSections(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[${alias}] Failed to read ${plainPath}: ${message}`);
    return null;
  }
}

function buildGearSkill(fields: Record<string, string>): GearSkill | undefined {
  const skillName = fields.skill0?.trim();
  if (!skillName) return undefined;

  return {
    name: skillName,
    desc_name: skillName,
    desc_kr: skillName,
  };
}

export async function parseGears(alias: string): Promise<void> {
  const configDir = getServerConfigDir(alias);
  const dataDir = getServerDataDir(alias);
  await fsp.mkdir(dataDir, { recursive: true });

  const heroesPath = path.join(dataDir, MERCENARY_JSON);
  if (!(await exists(heroesPath))) {
    throw new Error(`[${alias}] ${heroesPath} not found. Run parseHeroes first.`);
  }
  const heroes = await readJson<Hero[]>(heroesPath);

  let cdnIcons: Record<string, CdnIcon> = {};
  const iconCdnPath = path.join(dataDir, ICON_CDN_JSON);
  if (await exists(iconCdnPath)) {
    cdnIcons = buildCdnIconMap(await readJson<CdnIcon[]>(iconCdnPath));
  } else {
    console.warn(`[${alias}] ${ICON_CDN_JSON} not found; gear icons will be empty`);
  }

  const allGears: Gear[] = [];

  let heroesWithBase = 0;
  let heroesWithExtra = 0;

  console.log(`[${alias}] Parsing gears for ${heroes.length} heroes...`);

  await runWithConcurrency(heroes, CONCURRENCY, async (hero) => {
    let baseSections: ReturnType<typeof parseIniSections> | null = null;
    let extraSections: ReturnType<typeof parseIniSections> | null = null;

    try {
      [baseSections, extraSections] = await Promise.all([
        readHeroGearIni(alias, configDir, hero.code, "item"),
        readHeroGearIni(alias, configDir, hero.code, "extraitem"),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[${alias}] Error reading gear files for ${hero.code}: ${message}`);
      return;
    }

    if (baseSections && baseSections.length > 0) heroesWithBase++;
    if (extraSections && extraSections.length > 0) heroesWithExtra++;

    const heroGears: Gear[] = [];

    function pushGear(
      sections: ReturnType<typeof parseIniSections> | null,
      isExtra: boolean,
    ) {
      if (!sections) return;

      let sectionSeq = 0;
      for (const section of sections) {
        const itemNumber = parseItemNumber(section.name);
        if (itemNumber === null) continue;

        const f = section.fields;
        const generatedCode = Number(
          `${hero.code}${String(itemNumber).padStart(2, "0")}`,
        );
        const code = normalizeNumber(f.code) ?? generatedCode;
        // Build a deterministic, globally unique ID from the hero code, item
        // slot, a base/extra flag, and the section sequence. The INI `code`
        // field is deliberately *not* used as the ID because some files
        // contain multiple sections with the same item number or reuse codes.
        const id = Number(
          `${hero.code}${String(itemNumber).padStart(2, "0")}${isExtra ? "9" : "0"}${String(sectionSeq++).padStart(2, "0")}`,
        );

        const iconKey = f.item_large_icon0;
        const cdnIcon = iconKey ? cdnIcons[iconKey] ?? null : null;
        const icon: GearIcon | null = cdnIcon
          ? {
              id: cdnIcon.id,
              imageset: cdnIcon.imageset,
              name: cdnIcon.name,
              pngUrl: cdnIcon.iconPngUrl,
              x: 0,
              y: 0,
              width: cdnIcon.width,
              height: cdnIcon.height,
            }
          : null;

        heroGears.push({
          id,
          heroCode: hero.code,
          heroName: hero.name,
          itemNumber,
          code,
          name: f.name || "",
          nameKr: f.name,
          itemType: f.item_type || "",
          subType: f.sub_type || "",
          iconKey,
          icon,
          skill: buildGearSkill(f),
          isExtra,
          stats: extractStats(f),
          rawFields: f,
        });
      }
    }

    pushGear(baseSections, false);
    pushGear(extraSections, true);

    heroGears.sort((a, b) => a.itemNumber - b.itemNumber);
    allGears.push(...heroGears);
  });

  allGears.sort((a, b) => {
    if (a.heroCode !== b.heroCode) return a.heroCode.localeCompare(b.heroCode);
    return a.itemNumber - b.itemNumber;
  });

  const gearsPath = path.join(dataDir, GEARS_JSON);
  await writeJson(gearsPath, allGears);
  console.log(
    `[${alias}] Wrote ${allGears.length} gears to ${gearsPath} (base=${heroesWithBase}, extra=${heroesWithExtra})`,
  );

  // Attach the parsed gears to each hero and rewrite the mercenary file so
  // that the consuming site gets a fully populated Hero shape.
  const gearsByHero = new Map<string, Gear[]>();
  for (const gear of allGears) {
    const list = gearsByHero.get(gear.heroCode) ?? [];
    list.push(gear);
    gearsByHero.set(gear.heroCode, list);
  }

  for (const hero of heroes) {
    hero.gears = gearsByHero.get(hero.code) ?? [];
  }

  await writeJson(heroesPath, heroes);
  console.log(`[${alias}] Updated ${heroesPath} with gear lists`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const alias = process.argv[2];
  if (!alias) {
    console.error("Usage: tsx scripts/parse/gears.ts <server-alias>");
    process.exit(1);
  }
  parseGears(alias).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
