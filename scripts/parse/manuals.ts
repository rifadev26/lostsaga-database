import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getServerConfigDir, getServerDataDir } from "../config";
import { readPlainIni } from "../lib/ini-loader";
import { writeJson } from "../lib/utils";

const MANUAL_INI_NAME = "sp2_etc_manual.ini";

async function readServerManualIni(configDir: string): Promise<string> {
  const plainPath = path.join(configDir, MANUAL_INI_NAME);
  return readPlainIni(plainPath);
}

export interface ManualSegment {
  lineNo: number;
  segmentNo: number;
  text: string;
}

export interface ManualEntry {
  id: number;
  text: string;
  rawSegments: ManualSegment[];
}

function parseManualSections(text: string): Record<number, ManualEntry> {
  const manuals: Record<number, ManualEntry> = {};
  let currentId: number | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) continue;

    const sectionMatch = /^\[Manual(\d+)\]$/i.exec(line);
    if (sectionMatch) {
      currentId = Number(sectionMatch[1]);
      if (!manuals[currentId]) {
        manuals[currentId] = { id: currentId, text: "", rawSegments: [] };
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
    manuals[currentId].rawSegments.push({ lineNo, segmentNo, text: value });
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

export async function parseManuals(alias: string): Promise<void> {
  const configDir = getServerConfigDir(alias);
  const dataDir = getServerDataDir(alias);

  await fsp.mkdir(dataDir, { recursive: true });

  console.log(`[${alias}] Reading ${MANUAL_INI_NAME}`);
  const text = await readServerManualIni(configDir);

  const manuals = parseManualSections(text);
  const outPath = path.join(dataDir, "etc-manuals.json");
  await writeJson(outPath, manuals);
  console.log(
    `[${alias}] Wrote ${Object.keys(manuals).length} manuals to ${outPath}`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const alias = process.argv[2];
  if (!alias) {
    console.error("Usage: tsx scripts/parse/manuals.ts <server-alias>");
    process.exit(1);
  }
  parseManuals(alias).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
