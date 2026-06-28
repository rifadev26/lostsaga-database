import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { extractIop, applySecondaryXor } from "../lib/iop";
import {
  CACHE_DIR,
  IOP_CACHE_DIR,
  readCachedOrDownload,
} from "../lib/patch-manifest";
import { readJson, writeJson } from "../lib/utils";
import type { Hero } from "../lib/types";

export interface GearIcon {
  id: number;
  imageset: string;
  name: string;
  pngUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CdnIcon {
  id: number;
  imageset: string;
  name: string;
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

export interface GearSkill {
  name: string;
  icon?: string;
  emoticon?: string;
  extra?: string | null;
  desc?: string;
  desc_name?: string;
  desc_kr?: string;
  [key: string]: unknown;
}

export interface Gear {
  id: number;
  heroCode: string;
  heroName: string;
  itemNumber: number;
  code: number;
  name: string;
  nameKr?: string;
  itemType: string;
  subType: string;
  rarity?: string;
  iconKey?: string;
  icon: GearIcon | null;
  skill?: GearSkill;
  isExtra: boolean;
  stats: Record<string, number>;
  rawFields: Record<string, string>;
}

interface IniSection {
  name: string;
  fields: Record<string, string>;
}

const HERO_LOCAL_PATH = path.join("data", "hero-local.json");
const ICON_CDN_PATH = path.join("data", "icon-cdn.json");

function decodeKorean(buf: Buffer): string {
  try {
    return new TextDecoder("cp949").decode(buf);
  } catch {
    return new TextDecoder("euc-kr").decode(buf);
  }
}

function parseIniSections(text: string): IniSection[] {
  const sections: IniSection[] = [];
  let current: IniSection | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) continue;

    if (line.startsWith("[") && line.endsWith("]")) {
      current = { name: line.slice(1, -1), fields: {} };
      sections.push(current);
      continue;
    }

    if (!current) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    current.fields[key] = value;
  }

  return sections;
}

function normalizeNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
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

async function fetchHeroGearFile(
  heroCode: string,
  type: "item" | "extraitem",
): Promise<IniSection[] | null> {
  const remotePath = `config/mercenary/${heroCode}/${heroCode}_${type}.ini.iop`;
  try {
    const buf = await readCachedOrDownload(remotePath);
    const entries = await extractIop(buf);
    const entry = entries.find((e) =>
      e.filename.toLowerCase().includes(`${heroCode}_${type}.ini`),
    );
    if (!entry) return null;

    const decrypted = applySecondaryXor(entry.data);
    const text = decodeKorean(decrypted);

    await fsp.writeFile(
      path.join(CACHE_DIR, `${heroCode}_${type}.ini`),
      text,
    );

    return parseIniSections(text);
  } catch (err) {
    console.warn(`Skipping ${remotePath}: ${(err as Error).message}`);
    return null;
  }
}

export async function fetchGears(): Promise<void> {
  await fsp.mkdir(IOP_CACHE_DIR, { recursive: true });

  const heroes = await readJson<Hero[]>(HERO_LOCAL_PATH);
  const uiIcons = buildCdnIconMap(await readJson<CdnIcon[]>(ICON_CDN_PATH));

  const heroByCode = new Map<string, Hero>(heroes.map((h) => [h.code, h]));
  const gears: Gear[] = [];

  for (const hero of heroes) {
    const [itemSections, extraSections] = await Promise.all([
      fetchHeroGearFile(hero.code, "item"),
      fetchHeroGearFile(hero.code, "extraitem"),
    ]);

    if (itemSections) {
      for (const section of itemSections) {
        const itemNumber = parseItemNumber(section.name);
        if (itemNumber === null) continue;

        const f = section.fields;
        const code = normalizeNumber(f.code) ?? itemNumber;

        // Match against hero-local gear order (item1 = gears[0], etc.).
        const heroGear = hero.gears[itemNumber - 1];
        const id = heroGear ? heroGear.id : Number(`${hero.code}${String(itemNumber).padStart(2, "0")}`);

        const iconKey = f.item_large_icon0 || heroGear?.icon;
        const cdnIcon = iconKey ? uiIcons[iconKey] ?? null : null;
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

        const stats = extractStats(f);

        gears.push({
          id,
          heroCode: hero.code,
          heroName: hero.name,
          itemNumber,
          code,
          name: heroGear?.name || f.name || "",
          nameKr: f.name || heroGear?.name_kr,
          itemType: f.item_type || "",
          subType: f.sub_type || "",
          rarity: heroGear?.rarity,
          iconKey,
          icon,
          skill: heroGear?.skill as GearSkill | undefined,
          isExtra: false,
          stats,
          rawFields: f,
        });
      }
    }

    if (extraSections) {
      for (const section of extraSections) {
        const itemNumber = parseItemNumber(section.name);
        if (itemNumber === null) continue;

        const f = section.fields;
        const code = normalizeNumber(f.code) ?? Number(`${hero.code}${String(itemNumber).padStart(2, "0")}`);

        const iconKey = f.item_large_icon0;
        const cdnIcon = iconKey ? uiIcons[iconKey] ?? null : null;
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

        gears.push({
          id: code,
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
          isExtra: true,
          stats: extractStats(f),
          rawFields: f,
        });
      }
    }
  }

  await writeJson(path.join("data", "gears.json"), gears);
  console.log(`Wrote ${gears.length} gears to data/gears.json`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchGears().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
