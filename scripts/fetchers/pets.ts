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

const PET_INFO_IOP = "config/sp2_pet_info.ini.iop";
const PET_INFO_NAME = "sp2_pet_info.ini";

const PET_EAT_IOP = "config/sp2_pet_eat_info.ini.iop";
const PET_EAT_NAME = "sp2_pet_eat_info.ini";

const PET_MANUAL_IOP = "config/sp2_pet_inven_manual.ini.iop";
const PET_MANUAL_NAME = "sp2_pet_inven_manual.ini";

const ICON_CDN_JSON = path.join("data", "icon-cdn.json");

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

function normalizeNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

function normalizeFloat(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const cleaned = value.replace(/f$/i, "");
  const num = Number(cleaned);
  return Number.isNaN(num) ? undefined : num;
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

function parseManualSections(
  text: string,
): Record<number, PetManual> {
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

function parsePetId(sectionName: string): number | null {
  const match = /^pet_base_info(\d+)$/i.exec(sectionName);
  return match ? Number(match[1]) : null;
}

function parsePetViews(
  f: Record<string, string>,
  icons: Record<string, CdnIcon>,
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
      model,
      scale,
      ani,
    });
  }

  return views;
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

function transformToPets(
  sections: Array<{ name: string; fields: Record<string, string> }>,
  manuals: Record<number, PetManual>,
  icons: Record<string, CdnIcon>,
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

  // Pet .ini files other than sp2_pet_eat_info.ini need the secondary XOR
  // applied even when the archive comment does not flag them as encrypted.
  const data =
    entry.passwordType === 1 ? entry.data : applySecondaryXor(entry.data);
  const text = decodeKorean(data);

  await fsp.writeFile(path.join(CACHE_DIR, iniName), text);
  console.log(`Cached raw INI to data/.cache/${iniName}`);
  return text;
}

export async function fetchPets(): Promise<void> {
  await fsp.mkdir(CACHE_DIR, { recursive: true });
  await fsp.mkdir(IOP_CACHE_DIR, { recursive: true });

  const infoText = await fetchAndDecode(PET_INFO_IOP, PET_INFO_NAME);
  const infoSections = parseIniSections(infoText);
  await writeJson(path.join("data", "pets-raw.json"), infoSections);
  console.log(`Wrote ${infoSections.length} raw sections to data/pets-raw.json`);

  const eatText = await fetchAndDecode(PET_EAT_IOP, PET_EAT_NAME);
  const eatSections = parseIniSections(eatText);
  const feedRanks = parseFeedRanks(eatSections);
  await writeJson(path.join("data", "pet-feed-info.json"), feedRanks);
  console.log(
    `Wrote ${feedRanks.length} feed ranks to data/pet-feed-info.json`,
  );

  const manualText = await fetchAndDecode(PET_MANUAL_IOP, PET_MANUAL_NAME);
  const manuals = parseManualSections(manualText);
  await writeJson(path.join("data", "pet-manuals.json"), manuals);
  console.log(
    `Wrote ${Object.keys(manuals).length} manuals to data/pet-manuals.json`,
  );

  const icons = buildCdnIconMap(await readJson<CdnIcon[]>(ICON_CDN_JSON));

  const pets = transformToPets(infoSections, manuals, icons);
  await writeJson(path.join("data", "pets.json"), pets);
  console.log(`Wrote ${pets.length} pets to data/pets.json`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchPets().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
