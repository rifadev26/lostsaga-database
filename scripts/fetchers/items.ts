import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { extractIop } from "../lib/iop";
import {
  CACHE_DIR,
  IOP_CACHE_DIR,
  downloadAndExtractManifest,
  readCachedOrDownload,
} from "../lib/patch-manifest";
import { readJson, writeJson } from "../lib/utils";

const ITEM_INI_IOP = "config/sp2_etcitem_info.ini.iop";
const ITEM_INI_NAME = "sp2_etcitem_info.ini";
const ICON_CDN_JSON = path.join("data", "icon-cdn.json");

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

function decodeKorean(buf: Buffer): string {
  try {
    return new TextDecoder("cp949").decode(buf);
  } catch {
    return new TextDecoder("euc-kr").decode(buf);
  }
}

function findIconKeys(value: string): string[] {
  const matches = value.match(/[A-Za-z_][\w]*#[\w]+/g);
  return matches ? Array.from(new Set(matches)) : [];
}

export function parseIniSections(text: string): RawItemSection[] {
  const sections: RawItemSection[] = [];
  let current: RawItemSection | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // Strip inline comments. If a value legitimately contains ';' this will
    // over-strip it, but for a raw dump that is acceptable.
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
  return sections
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

      const normalizeNumber = (value: string | undefined): number | undefined => {
        if (value === undefined || value === "") return undefined;
        const num = Number(value);
        return Number.isNaN(num) ? undefined : num;
      };

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
}

export async function fetchItems(): Promise<void> {
  await fsp.mkdir(CACHE_DIR, { recursive: true });
  await fsp.mkdir(IOP_CACHE_DIR, { recursive: true });

  console.log("Loading patch manifest...");
  const manifest = await downloadAndExtractManifest();
  console.log(`Manifest contains ${manifest.size} entries`);

  console.log(`Downloading ${ITEM_INI_IOP}`);
  const iopBuffer = await readCachedOrDownload(ITEM_INI_IOP);
  const entries = await extractIop(iopBuffer);

  const entry = entries.find((e) =>
    e.filename.toLowerCase().includes(ITEM_INI_NAME.toLowerCase()),
  );
  if (!entry) {
    throw new Error(`${ITEM_INI_NAME} not found inside .iop archive`);
  }

  const text = decodeKorean(entry.data);
  await fsp.writeFile(path.join(CACHE_DIR, ITEM_INI_NAME), text);
  console.log(`Cached raw INI to data/.cache/${ITEM_INI_NAME}`);

  const sections = parseIniSections(text);
  await writeJson(path.join("data", "etc-items-raw.json"), sections);
  console.log(
    `Wrote ${sections.length} raw sections to data/etc-items-raw.json`,
  );

  console.log("Resolving item icons from icon-cdn.json...");
  const icons = buildCdnIconMap(await readJson<CdnIcon[]>(ICON_CDN_JSON));
  const items = transformToEtcItems(sections, icons);
  await writeJson(path.join("data", "etc-items.json"), items);
  console.log(`Wrote ${items.length} typed items to data/etc-items.json`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchItems().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
