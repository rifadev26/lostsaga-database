import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  getServerConfigDir,
  getServerDataDir,
  getServerImageUrl,
  getServerPublicImageDir,
} from "../config";
import { readPlainIni, normalizeNumber } from "../lib/ini-loader";
import { exists, readJson, writeJson } from "../lib/utils";

const HERO_INI_NAME = "sp2_setitem_info.ini";
const ICON_CDN_JSON = "icon-cdn.json";
const MERCENARY_JSON = "mercenary.json";

/**
 * Gear shape used inside the Hero output.
 *
 * Mirrors `site/lib/gears.ts` so the per-server JSON stays compatible with the
 * consuming site without creating a cross-package import at parse time.
 */
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

/**
 * Site-compatible Hero shape.
 *
 * Mirrors `site/lib/server/data.ts` (and the extended Gear shape from
 * `site/lib/gears.ts`).
 */
export interface Hero {
  name: string;
  code: string;
  summary: string;
  type: string;
  rarity: string;
  default_ani: string;
  icon_m: string;
  icon_f: string;
  pic_m: string;
  pic_f: string;
  artwork1: string;
  artwork2: string;
  gears: Gear[];
}

interface CdnIcon {
  id: number;
  imageset: string;
  name: string;
  iconFile: string;
  iconPngUrl: string;
  width: number;
  height: number;
}

async function readHeroIni(configDir: string): Promise<string> {
  const plainPath = path.join(configDir, HERO_INI_NAME);
  return readPlainIni(plainPath);
}

function parseSectionIndex(sectionName: string): number | null {
  const match = /^set_item(\d+)$/i.exec(sectionName);
  return match ? Number(match[1]) : null;
}

/**
 * Build the soldier selection icon key used by the client.
 *
 * Client source (ioMyInfo.cpp):
 *   male:   SoldierIconPack%.3d#%.3d
 *   female: SoldierIconPack%.3d#%.3df
 *   pack = ((iClassType - 1) / MAX_ICON) + 1, MAX_ICON = 18
 */
function getSoldierIconKey(
  classType: number,
  sex: "m" | "f",
): string {
  const MAX_ICON = 18;
  const pack = Math.floor((classType - 1) / MAX_ICON) + 1;
  const packStr = String(pack).padStart(3, "0");
  const classStr = String(classType).padStart(3, "0");
  return sex === "m"
    ? `SoldierIconPack${packStr}#${classStr}`
    : `SoldierIconPack${packStr}#${classStr}f`;
}

function attackTypeName(raw: string | undefined): string {
  const map: Record<string, string> = {
    "1": "Melee",
    "2": "Range",
    "3": "Magic",
    "4": "Special",
    "5": "Hybrid",
  };
  return raw ? map[raw.trim()] ?? raw.trim() : "Unknown";
}

function rarityFromFields(fields: Record<string, string>): string {
  const subIcon = fields.sub_icon;
  if (subIcon) {
    if (subIcon.includes("unique")) return "unique";
    if (subIcon.includes("rare")) return "rare";
    if (subIcon.includes("contest")) return "contest";
  }
  if (fields.limit_date) return "limited";
  switch (fields.package_type) {
    case "1":
      return "rare";
    case "2":
      return "unique";
    default:
      return "common";
  }
}

function buildCdnIconMap(
  icons: CdnIcon[],
): Record<string, CdnIcon> {
  const map: Record<string, CdnIcon> = {};
  for (const icon of icons) {
    map[`${icon.imageset}#${icon.name}`] = icon;
  }
  return map;
}

async function copyHeroIcon(
  alias: string,
  heroCode: string,
  iconKey: string,
  icons: Record<string, CdnIcon>,
  targetName: "icon_m.png" | "icon_f.png",
): Promise<string | null> {
  const entry = icons[iconKey];
  if (!entry) return null;

  const sourcePath = path.join(
    getServerPublicImageDir(alias),
    "icon",
    entry.iconFile,
  );
  if (!(await exists(sourcePath))) return null;

  const heroImageDir = path.join(
    getServerPublicImageDir(alias),
    "heroes",
    heroCode,
  );
  await fsp.mkdir(heroImageDir, { recursive: true });

  const outPath = path.join(heroImageDir, targetName);
  await fsp.copyFile(sourcePath, outPath);

  return getServerImageUrl(alias, "heroes", heroCode, targetName);
}

export async function parseHeroes(alias: string): Promise<void> {
  const configDir = getServerConfigDir(alias);
  const dataDir = getServerDataDir(alias);
  await fsp.mkdir(dataDir, { recursive: true });

  console.log(`[${alias}] Reading ${HERO_INI_NAME}`);
  const text = await readHeroIni(configDir);

  // Load icon map so we can copy soldier selection icons into the per-hero
  // image directory using the client's SoldierIconPack naming convention.
  let icons: Record<string, CdnIcon> = {};
  const iconCdnPath = path.join(dataDir, ICON_CDN_JSON);
  if (await exists(iconCdnPath)) {
    icons = buildCdnIconMap(await readJson<CdnIcon[]>(iconCdnPath));
  } else {
    console.warn(`[${alias}] ${ICON_CDN_JSON} not found; hero icons will be empty`);
  }

  const heroes: Hero[] = [];
  const pendingIcons: {
    hero: Hero;
    imgKey: string;
    targetName: "icon_m.png" | "icon_f.png";
    fieldName: "icon_m" | "icon_f";
  }[] = [];
  let currentSection: string | null = null;
  let currentFields: Record<string, string> = {};

  function flushCurrent() {
    if (!currentSection) return;
    const index = parseSectionIndex(currentSection);
    if (index === null) return;

    const name = currentFields.name?.trim();
    if (!name) return;

    const code = String(index).padStart(3, "0");

    const hero: Hero = {
      name,
      code,
      summary: "",
      type: attackTypeName(currentFields.char_attack_type),
      rarity: rarityFromFields(currentFields),
      default_ani: currentFields.default_ani?.trim() ?? "",
      icon_m: "",
      icon_f: "",
      pic_m: "",
      pic_f: "",
      artwork1: "",
      artwork2: "",
      gears: [],
    };
    heroes.push(hero);

    // Soldier selection icons follow the client's naming convention.
    // Female versions use an 'f' suffix; we attempt both and fall back
    // gracefully if an icon is missing from the CDN.
    const iconKeyM = getSoldierIconKey(index, "m");
    const iconKeyF = getSoldierIconKey(index, "f");
    if (icons[iconKeyM]) {
      pendingIcons.push({
        hero,
        imgKey: iconKeyM,
        targetName: "icon_m.png",
        fieldName: "icon_m",
      });
    }
    if (icons[iconKeyF]) {
      pendingIcons.push({
        hero,
        imgKey: iconKeyF,
        targetName: "icon_f.png",
        fieldName: "icon_f",
      });
    }
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) continue;

    if (line.startsWith("[") && line.endsWith("]")) {
      flushCurrent();
      currentSection = line.slice(1, -1);
      currentFields = {};
      continue;
    }

    if (!currentSection) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    currentFields[key] = value;
  }
  flushCurrent();

  // Best-effort copy of hero icons from the already-extracted UI icon sheets.
  // If the source PNG has not been generated yet we leave the image fields
  // empty, which the site treats as "no local asset".
  await Promise.all(
    pendingIcons.map(async ({ hero, imgKey, targetName, fieldName }) => {
      try {
        const url = await copyHeroIcon(
          alias,
          hero.code,
          imgKey,
          icons,
          targetName,
        );
        if (url) {
          hero[fieldName] = url;
          console.log(
            `[${alias}] Copied ${fieldName} for ${hero.code} (${hero.name})`,
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `[${alias}] Failed to copy ${fieldName} for ${hero.code}: ${message}`,
        );
      }
    }),
  );

  const outPath = path.join(dataDir, MERCENARY_JSON);
  await writeJson(outPath, heroes);
  console.log(`[${alias}] Wrote ${heroes.length} heroes to ${outPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const alias = process.argv[2];
  if (!alias) {
    console.error("Usage: tsx scripts/parse/heroes.ts <server-alias>");
    process.exit(1);
  }
  parseHeroes(alias).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
