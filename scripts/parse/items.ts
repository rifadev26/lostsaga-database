import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getServerConfigDir, getServerDataDir } from "../config";
import { readPlainIni, normalizeNumber } from "../lib/ini-loader";
import { readJson, writeJson } from "../lib/utils";

const ITEM_INI_NAME = "sp2_etcitem_info.ini";
const ICON_CDN_JSON = "icon-cdn.json";

async function readServerItemIni(configDir: string): Promise<string> {
  const plainPath = path.join(configDir, ITEM_INI_NAME);
  return readPlainIni(plainPath);
}

export interface RawItemSection {
  section: string;
  fields: Record<string, string>;
  iconKeys: string[];
}

export interface ItemIcon {
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

export interface EtcItem {
  id: number;
  section: string;
  name: string;
  shopName: string;
  type: number;
  group?: number;
  canSell: boolean;
  sellPeso: number;
  buyPeso?: number;
  cash?: number;
  active: boolean;
  value?: number;
  inventoryManual: number;
  inventorySubManual: number;
  decorationMaxCheck?: boolean;
  limitClassNum?: number;
  limitActiveFilter?: boolean;
  maxSoldier?: number;
  iconKey?: string;
  icon: ItemIcon | null;
}

function findIconKeys(value: string): string[] {
  const matches = value.match(/[A-Za-z_][\w]*#[\w]+/g);
  return matches ? Array.from(new Set(matches)) : [];
}

function parseRawItemSections(text: string): RawItemSection[] {
  const sections: RawItemSection[] = [];
  let current: RawItemSection | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const commentIdx = line.indexOf(";");
    const cleaned =
      commentIdx >= 0 ? line.slice(0, commentIdx).trim() : line;
    if (!cleaned) continue;

    if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
      current = {
        section: cleaned.slice(1, -1),
        fields: {},
        iconKeys: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) continue;

    const eq = cleaned.indexOf("=");
    if (eq === -1) continue;

    const key = cleaned.slice(0, eq).trim();
    const value = cleaned.slice(eq + 1).trim();
    current.fields[key] = value;

    const iconKeys = findIconKeys(value);
    if (iconKeys.length > 0) {
      current.iconKeys.push(...iconKeys);
    }
  }

  return sections;
}

function parseItemId(section: string): number | null {
  const match = /^etcitem(\d+)$/i.exec(section);
  return match ? Number(match[1]) : null;
}

function transformToEtcItems(
  sections: RawItemSection[],
  icons: Record<string, CdnIcon>,
): EtcItem[] {
  const mapped = sections
    .map((section): EtcItem | null => {
      const id = parseItemId(section.section);
      if (id === null) return null;

      const f = section.fields;
      const iconKey = f.icon_name;
      const cdnIcon = iconKey ? icons[iconKey] ?? null : null;
      const icon: ItemIcon | null = cdnIcon
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

      return {
        id,
        section: section.section,
        name: f.name ?? "",
        shopName: f.shop_name1 || f.name || "",
        type: normalizeNumber(f.type) ?? 0,
        group: normalizeNumber(f.group),
        canSell: f.can_sell === "1",
        sellPeso: normalizeNumber(f.sell_peso) ?? 0,
        buyPeso: normalizeNumber(f.peso1),
        cash: normalizeNumber(f.cash1),
        active: f.active1 === "1",
        value: normalizeNumber(f.value1),
        inventoryManual: normalizeNumber(f.inventory_manual) ?? 0,
        inventorySubManual: normalizeNumber(f.inventory_sub_manual) ?? 0,
        decorationMaxCheck:
          f.decoration_max_check === "1" ? true : undefined,
        limitClassNum: normalizeNumber(f.limit_class_num),
        limitActiveFilter:
          f.limit_active_filter === "1" ? true : undefined,
        maxSoldier: normalizeNumber(f.max_soldier),
        iconKey,
        icon,
      };
    })
    .filter((item): item is EtcItem => item !== null);

  // Some server configs contain duplicate [etcitemN] sections. IDs must be
  // unique, so keep the last occurrence (last-wins override) and warn.
  const seen = new Map<number, EtcItem>();
  const duplicates = new Set<number>();
  for (const item of mapped) {
    if (seen.has(item.id)) {
      duplicates.add(item.id);
    }
    seen.set(item.id, item);
  }

  if (duplicates.size > 0) {
    const ids = Array.from(duplicates).sort((a, b) => a - b).join(", ");
    console.warn(`[items] Duplicate etcitem sections found for ids: ${ids}. Keeping last occurrence.`);
  }

  return Array.from(seen.values());
}

export async function parseItems(alias: string): Promise<void> {
  const configDir = getServerConfigDir(alias);
  const dataDir = getServerDataDir(alias);

  await fsp.mkdir(dataDir, { recursive: true });

  console.log(`[${alias}] Reading ${ITEM_INI_NAME}`);
  const text = await readServerItemIni(configDir);

  const sections = parseRawItemSections(text);
  const rawPath = path.join(dataDir, "etc-items-raw.json");
  await writeJson(rawPath, sections);
  console.log(`[${alias}] Wrote ${sections.length} raw sections to ${rawPath}`);

  const iconCdnPath = path.join(dataDir, ICON_CDN_JSON);
  console.log(`[${alias}] Resolving item icons from ${iconCdnPath}`);
  const icons = buildCdnIconMap(await readJson<CdnIcon[]>(iconCdnPath));

  const items = transformToEtcItems(sections, icons);
  const itemsPath = path.join(dataDir, "etc-items.json");
  await writeJson(itemsPath, items);
  console.log(`[${alias}] Wrote ${items.length} typed items to ${itemsPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const alias = process.argv[2];
  if (!alias) {
    console.error("Usage: tsx scripts/parse/items.ts <server-alias>");
    process.exit(1);
  }
  parseItems(alias).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
