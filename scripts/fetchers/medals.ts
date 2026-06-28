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

const MEDAL_INFO_IOP = "config/sp2_medalitem_info.ini.iop";
const MEDAL_INFO_NAME = "sp2_medalitem_info.ini";

const MEDAL_MANUAL_IOP = "config/sp2_medal_inven_manual.ini.iop";
const MEDAL_MANUAL_NAME = "sp2_medal_inven_manual.ini";

const ICON_CDN_JSON = path.join("data", "icon-cdn.json");

export interface MedalIcon {
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

export interface MedalManualSegment {
  lineNo: number;
  segmentNo: number;
  text: string;
}

export interface MedalManualEntry {
  id: number;
  text: string;
  rawSegments: MedalManualSegment[];
}

export interface Medal {
  id: number;
  section: string;
  itemType: number;
  name: string;
  limitLevel?: number;
  maxClass?: number;
  useClasses: number[];
  charGrowth: number[];
  itemGrowth: number[];
  iconKey?: string;
  subIconKey?: string;
  icon: MedalIcon | null;
  subIcon: MedalIcon | null;
  manualId: number;
  manual: string;
  sellPeso: number;
  enableSelectStat?: boolean;
  subMedalType?: number;
  totalPoint?: number;
  rawFields: Record<string, string>;
}

function decodeKorean(buf: Buffer): string {
  try {
    return new TextDecoder("cp949").decode(buf);
  } catch {
    return new TextDecoder("euc-kr").decode(buf);
  }
}

function parseIniSections(
  text: string,
): Array<{ name: string; fields: Record<string, string> }> {
  const sections: Array<{ name: string; fields: Record<string, string> }> = [];
  let current: { name: string; fields: Record<string, string> } | null = null;

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

function parseManualSections(
  text: string,
): Record<number, MedalManualEntry> {
  const manuals: Record<number, MedalManualEntry> = {};
  let currentId: number | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) continue;

    const sectionMatch = /^\[Manual(\d+)\]$/i.exec(line);
    if (sectionMatch) {
      currentId = Number(sectionMatch[1]);
      if (!manuals[currentId]) {
        manuals[currentId] = {
          id: currentId,
          text: "",
          rawSegments: [],
        };
      }
      continue;
    }

    if (currentId === null) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!value) continue;

    const textMatch = /^(\d+)Text(\d+)$/i.exec(key);
    if (!textMatch) continue;

    const lineNo = Number(textMatch[1]);
    const segmentNo = Number(textMatch[2]);
    manuals[currentId].rawSegments.push({
      lineNo,
      segmentNo,
      text: value,
    });
  }

  for (const manual of Object.values(manuals)) {
    manual.rawSegments.sort(
      (a, b) => a.lineNo - b.lineNo || a.segmentNo - b.segmentNo,
    );

    const lineGroups = new Map<number, string[]>();
    for (const seg of manual.rawSegments) {
      if (!lineGroups.has(seg.lineNo)) lineGroups.set(seg.lineNo, []);
      lineGroups.get(seg.lineNo)!.push(seg.text);
    }

    const lineNos = Array.from(lineGroups.keys()).sort((a, b) => a - b);
    manual.text = lineNos
      .map((lineNo) => lineGroups.get(lineNo)!.join(" "))
      .join("\n");
  }

  return manuals;
}

async function fetchAndDecode(
  remotePath: string,
  iniName: string,
): Promise<string> {
  console.log(`Downloading ${remotePath}`);
  const iopBuffer = await readCachedOrDownload(remotePath);
  const entries = await extractIop(iopBuffer);

  const entry = entries.find((e) =>
    e.filename.toLowerCase().includes(iniName.toLowerCase()),
  );
  if (!entry) {
    throw new Error(`${iniName} not found inside .iop archive`);
  }

  // These medal configs are XORed even though the archive comment does not
  // mark them as encrypted data (passwordType 0). Always apply the secondary
  // XOR transform, matching sp2_etc_manual.ini behavior.
  const data = applySecondaryXor(entry.data);
  const text = decodeKorean(data);

  await fsp.writeFile(path.join(CACHE_DIR, iniName), text);
  console.log(`Cached raw INI to data/.cache/${iniName}`);
  return text;
}

function parseItemInfoId(sectionName: string): number | null {
  const match = /^item_info_(\d+)$/i.exec(sectionName);
  return match ? Number(match[1]) : null;
}

function normalizeNumber(
  value: string | undefined,
): number | undefined {
  if (value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

function parseGrowth(values: Record<string, string>, prefix: string): number[] {
  const out: number[] = [];
  for (let i = 1; i <= 4; i++) {
    const raw = values[`${prefix}_${i}`];
    out.push(normalizeNumber(raw) ?? 0);
  }
  return out;
}

function parseUseClasses(values: Record<string, string>): number[] {
  const out: number[] = [];
  for (let i = 1; i <= 6; i++) {
    const raw = values[`use_class_${i}`];
    const num = normalizeNumber(raw);
    if (num !== undefined) out.push(num);
  }
  return out;
}

export async function fetchMedals(): Promise<void> {
  await fsp.mkdir(CACHE_DIR, { recursive: true });
  await fsp.mkdir(IOP_CACHE_DIR, { recursive: true });

  const infoText = await fetchAndDecode(MEDAL_INFO_IOP, MEDAL_INFO_NAME);
  const infoSections = parseIniSections(infoText);
  await writeJson(path.join("data", "medals-raw.json"), infoSections);
  console.log(
    `Wrote ${infoSections.length} raw sections to data/medals-raw.json`,
  );

  const manualText = await fetchAndDecode(
    MEDAL_MANUAL_IOP,
    MEDAL_MANUAL_NAME,
  );
  const manuals = parseManualSections(manualText);
  console.log(
    `Parsed ${Object.keys(manuals).length} medal manual entries`,
  );

  const icons = buildCdnIconMap(await readJson<CdnIcon[]>(ICON_CDN_JSON));

  const medals: Medal[] = infoSections
    .map((section): Medal | null => {
      const id = parseItemInfoId(section.name);
      if (id === null) return null;

      const f = section.fields;
      const itemType = normalizeNumber(f.item_type) ?? id;
      const manualId = normalizeNumber(f.manual) ?? 0;
      const manual = manuals[manualId]?.text ?? "";

      const iconKey = f.icon;
      const subIconKey = f.subicon;
      const cdnIcon = iconKey ? icons[iconKey] ?? null : null;
      const cdnSubIcon = subIconKey ? icons[subIconKey] ?? null : null;

      return {
        id,
        section: section.name,
        itemType,
        name: f.name ?? "",
        limitLevel: normalizeNumber(f.limit_level),
        maxClass: normalizeNumber(f.max_class),
        useClasses: parseUseClasses(f),
        charGrowth: parseGrowth(f, "char_growth"),
        itemGrowth: parseGrowth(f, "item_growth"),
        iconKey,
        subIconKey,
        icon: cdnIcon
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
          : null,
        subIcon: cdnSubIcon
          ? {
              id: cdnSubIcon.id,
              imageset: cdnSubIcon.imageset,
              name: cdnSubIcon.name,
              pngUrl: cdnSubIcon.iconPngUrl,
              x: 0,
              y: 0,
              width: cdnSubIcon.width,
              height: cdnSubIcon.height,
            }
          : null,
        manualId,
        manual,
        sellPeso: normalizeNumber(f.sell_peso) ?? 0,
        enableSelectStat:
          f.enable_select_stat === "1" ? true : undefined,
        subMedalType: normalizeNumber(f.sub_medal_type),
        totalPoint: normalizeNumber(f.total_point),
        rawFields: f,
      };
    })
    .filter((m): m is Medal => m !== null);

  await writeJson(path.join("data", "medals.json"), medals);
  console.log(`Wrote ${medals.length} medals to data/medals.json`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchMedals().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
