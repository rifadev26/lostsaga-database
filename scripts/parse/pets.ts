import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getServerConfigDir, getServerDataDir } from "../config";
import {
  readPlainIni,
  parseIniSections,
  normalizeNumber,
  normalizeFloat,
} from "../lib/ini-loader";
import { readJson, writeJson } from "../lib/utils";

const PET_INFO_NAME = "sp2_pet_info.ini";
const PET_EAT_NAME = "sp2_pet_eat_info.ini";
const PET_MANUAL_NAME = "sp2_pet_inven_manual.ini";

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

function buildCdnIconMap(entries: IconCdnEntry[]): Record<string, IconCdnEntry> {
  const map: Record<string, IconCdnEntry> = {};
  for (const entry of entries) {
    map[`${entry.imageset}#${entry.name}`] = entry;
  }
  return map;
}

export interface PetIcon {
  id: number;
  imageset: string;
  name: string;
  pngUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PetManualSegment {
  lineNo: number;
  segmentNo: number;
  text: string;
}

export interface PetManual {
  id: number;
  text: string;
  rawSegments: PetManualSegment[];
}

export interface PetFeedRank {
  rank: number;
  maxLevel: number;
  materials: number[];
}

export interface PetView {
  rank: number;
  name: string;
  iconKey: string;
  icon: PetIcon | null;
  model: string;
  scale: { x: number; y: number; z: number };
  ani: string;
}

export interface Pet {
  id: number;
  section: string;
  baseRank: number;
  maxRank: number;
  manualId: number;
  manual: string;
  needMaterial?: number;
  views: PetView[];
  baseStatGrowth: number[];
  addStatTypes: number[];
  rawFields: Record<string, string>;
}

async function readServerPetIni(
  configDir: string,
  iniName: string,
): Promise<string> {
  const plainPath = path.join(configDir, iniName);
  return readPlainIni(plainPath);
}

function parsePetId(sectionName: string): number | null {
  const match = /^pet_base_info(\d+)$/i.exec(sectionName);
  return match ? Number(match[1]) : null;
}

function parseNumberArray(
  f: Record<string, string>,
  prefix: string,
  count: number,
): number[] {
  const out: number[] = [];
  for (let i = 1; i <= count; i++) {
    out.push(normalizeNumber(f[`${prefix}${i}`]) ?? 0);
  }
  return out;
}

function toPetIcon(entry: IconCdnEntry | null): PetIcon | null {
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

function parsePetViews(
  f: Record<string, string>,
  icons: Record<string, IconCdnEntry>,
): PetView[] {
  const count = normalizeNumber(f.icon_cnt) ?? 0;
  const views: PetView[] = [];

  for (let i = 1; i <= count; i++) {
    const prefix = `pet_view${i}`;
    const rank = normalizeNumber(f[`${prefix}_rank`]) ?? i;
    const name = f[`${prefix}_name`] ?? "";
    const iconKey = f[`${prefix}_icon`] ?? "";
    const model = f[`${prefix}_model`] ?? "";
    const ani = f[`${prefix}_ani`] ?? "";
    const scale = {
      x: normalizeFloat(f[`${prefix}_model_scale_x`]) ?? 1,
      y: normalizeFloat(f[`${prefix}_model_scale_y`]) ?? 1,
      z: normalizeFloat(f[`${prefix}_model_scale_z`]) ?? 1,
    };

    const cdnIcon = iconKey ? icons[iconKey] ?? null : null;
    views.push({
      rank,
      name,
      iconKey,
      icon: toPetIcon(cdnIcon),
      model,
      scale,
      ani,
    });
  }

  return views;
}

function parseFeedRanks(
  sections: Array<{ name: string; fields: Record<string, string> }>,
): PetFeedRank[] {
  const section = sections.find((s) => s.name.toLowerCase() === "pet_eat_info");
  if (!section) return [];

  const count = normalizeNumber(section.fields.max_rank_info_cnt) ?? 0;
  const ranks: PetFeedRank[] = [];

  for (let i = 1; i <= count; i++) {
    const prefix = `eat_info${i}`;
    const rank = normalizeNumber(section.fields[`${prefix}_rank`]) ?? i;
    const maxLevel = normalizeNumber(section.fields[`${prefix}_max_level`]) ?? 0;
    const materials: number[] = [];
    for (let level = 1; level <= maxLevel; level++) {
      materials.push(
        normalizeNumber(section.fields[`${prefix}_material${level}`]) ?? 0,
      );
    }
    ranks.push({ rank, maxLevel, materials });
  }

  return ranks;
}

function parseManualSections(text: string): Record<number, PetManual> {
  const manuals: Record<number, PetManual> = {};
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

function transformToPets(
  sections: Array<{ name: string; fields: Record<string, string> }>,
  manuals: Record<number, PetManual>,
  icons: Record<string, IconCdnEntry>,
): Pet[] {
  return sections
    .map((section): Pet | null => {
      const id = parsePetId(section.name);
      if (id === null) return null;

      const f = section.fields;
      const petCode = normalizeNumber(f.pet_code);
      if (petCode === undefined) return null;

      const manualId = normalizeNumber(f.pet_manual) ?? 0;
      const needMaterial = normalizeNumber(f.pet_need_material);
      const baseStatCount = normalizeNumber(f.max_base_growth_stat_info) ?? 0;
      const addStatCount = normalizeNumber(f.max_add_stat_info) ?? 0;

      return {
        id: petCode,
        section: section.name,
        baseRank: normalizeNumber(f.pet_base_rank) ?? 1,
        maxRank: normalizeNumber(f.pet_max_rank) ?? 1,
        manualId,
        manual: manuals[manualId]?.text ?? "",
        needMaterial,
        views: parsePetViews(f, icons),
        baseStatGrowth: parseNumberArray(f, "base_stat_info", baseStatCount),
        addStatTypes: parseNumberArray(f, "add_stat_info", addStatCount),
        rawFields: f,
      };
    })
    .filter((p): p is Pet => p !== null);
}

export async function parsePets(alias: string): Promise<void> {
  const configDir = getServerConfigDir(alias);
  const dataDir = getServerDataDir(alias);
  await fsp.mkdir(dataDir, { recursive: true });

  console.log(`[${alias}] Reading pet info...`);
  const infoText = await readServerPetIni(configDir, PET_INFO_NAME);
  const infoSections = parseIniSections(infoText);
  await writeJson(path.join(dataDir, "pets-raw.json"), infoSections);
  console.log(`[${alias}] Wrote ${infoSections.length} raw sections to pets-raw.json`);

  console.log(`[${alias}] Reading pet eat info...`);
  const eatText = await readServerPetIni(configDir, PET_EAT_NAME);
  const eatSections = parseIniSections(eatText);
  const feedRanks = parseFeedRanks(eatSections);
  await writeJson(path.join(dataDir, "pet-feed-info.json"), feedRanks);
  console.log(
    `[${alias}] Wrote ${feedRanks.length} feed ranks to pet-feed-info.json`,
  );

  console.log(`[${alias}] Reading pet manual...`);
  const manualText = await readServerPetIni(configDir, PET_MANUAL_NAME);
  const manuals = parseManualSections(manualText);
  await writeJson(path.join(dataDir, "pet-manuals.json"), manuals);
  console.log(
    `[${alias}] Wrote ${Object.keys(manuals).length} manuals to pet-manuals.json`,
  );

  const icons = buildCdnIconMap(
    await readJson<IconCdnEntry[]>(path.join(dataDir, "icon-cdn.json")),
  );

  const pets = transformToPets(infoSections, manuals, icons);
  await writeJson(path.join(dataDir, "pets.json"), pets);
  console.log(`[${alias}] Wrote ${pets.length} pets to pets.json`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const alias = process.argv[2];
  if (!alias) {
    console.error("Usage: tsx scripts/parse/pets.ts <server-alias>");
    process.exit(1);
  }
  parsePets(alias).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
