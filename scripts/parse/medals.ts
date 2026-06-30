import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getServerConfigDir, getServerDataDir } from "../config";
import { readPlainIni, parseIniSections, normalizeNumber } from "../lib/ini-loader";
import { readJson, writeJson } from "../lib/utils";

const MEDAL_INFO_NAME = "sp2_medalitem_info.ini";
const MEDAL_MANUAL_NAME = "sp2_medal_inven_manual.ini";

interface IconCdnEntry {
  id: number;
  imageset: string;
  name: string;
  iconFile: string;
  iconPngUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function buildCdnIconMap(
  entries: IconCdnEntry[],
): Record<string, IconCdnEntry> {
  const map: Record<string, IconCdnEntry> = {};
  for (const entry of entries) {
    map[`${entry.imageset}#${entry.name}`] = entry;
  }
  return map;
}

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

interface MedalManualSegment {
  lineNo: number;
  segmentNo: number;
  text: string;
}

interface MedalManualEntry {
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

async function readServerMedalIni(
  configDir: string,
  iniName: string,
): Promise<string> {
  const plainPath = path.join(configDir, iniName);
  return readPlainIni(plainPath);
}

function parseItemInfoId(sectionName: string): number | null {
  const match = /^item_info_(\d+)$/i.exec(sectionName);
  return match ? Number(match[1]) : null;
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

function parseManualSections(text: string): Record<number, MedalManualEntry> {
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

function toMedalIcon(entry: IconCdnEntry | null): MedalIcon | null {
  if (!entry) return null;
  return {
    id: entry.id,
    imageset: entry.imageset,
    name: entry.name,
    pngUrl: entry.iconPngUrl,
    x: entry.x,
    y: entry.y,
    width: entry.width,
    height: entry.height,
  };
}

export async function parseMedals(alias: string): Promise<void> {
  const configDir = getServerConfigDir(alias);
  const dataDir = getServerDataDir(alias);
  await fsp.mkdir(dataDir, { recursive: true });

  console.log(`[${alias}] Reading medal item info...`);
  const infoText = await readServerMedalIni(configDir, MEDAL_INFO_NAME);
  const infoSections = parseIniSections(infoText);
  await writeJson(path.join(dataDir, "medals-raw.json"), infoSections);
  console.log(
    `[${alias}] Wrote ${infoSections.length} raw sections to medals-raw.json`,
  );

  console.log(`[${alias}] Reading medal manual...`);
  const manualText = await readServerMedalIni(configDir, MEDAL_MANUAL_NAME);
  const manuals = parseManualSections(manualText);
  console.log(
    `[${alias}] Parsed ${Object.keys(manuals).length} medal manual entries`,
  );

  const icons = buildCdnIconMap(
    await readJson<IconCdnEntry[]>(path.join(dataDir, "icon-cdn.json")),
  );

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
      const cdnIcon = iconKey ? (icons[iconKey] ?? null) : null;
      const cdnSubIcon = subIconKey ? (icons[subIconKey] ?? null) : null;

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
        icon: toMedalIcon(cdnIcon),
        subIcon: toMedalIcon(cdnSubIcon),
        manualId,
        manual,
        sellPeso: normalizeNumber(f.sell_peso) ?? 0,
        enableSelectStat: f.enable_select_stat === "1" ? true : undefined,
        subMedalType: normalizeNumber(f.sub_medal_type),
        totalPoint: normalizeNumber(f.total_point),
        rawFields: f,
      };
    })
    .filter((m): m is Medal => m !== null);

  await writeJson(path.join(dataDir, "medals.json"), medals);
  console.log(`[${alias}] Wrote ${medals.length} medals to medals.json`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const alias = process.argv[2];
  if (!alias) {
    console.error("Usage: tsx scripts/parse/medals.ts <server-alias>");
    process.exit(1);
  }
  parseMedals(alias).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
