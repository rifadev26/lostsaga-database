import fsp from "node:fs/promises";
import path from "node:path";
import { extractIop, applySecondaryXor } from "./iop";

export interface ReadIniOptions {
  /** Apply secondary XOR after extracting (required for many config INIs). */
  applySecondaryXor?: boolean;
  /** Decode using cp949 first, then euc-kr fallback. Defaults to true. */
  decodeKorean?: boolean;
}

function decodeKorean(buf: Buffer): string {
  try {
    return new TextDecoder("cp949").decode(buf);
  } catch {
    return new TextDecoder("euc-kr").decode(buf);
  }
}

/**
 * Read an INI file that is wrapped in a Lost Saga .iop archive.
 *
 * The local unpacked tree stores files like:
 *   config/sp2_etcitem_info.ini.iop
 *   config/mercenary/001/001_item.ini.iop
 *
 * This helper reads the .iop, finds the inner INI, optionally decrypts it,
 * and returns the decoded text.
 *
 * Kept for future use; current parsers read plain .ini files directly.
 */
export async function readIopIni(
  iopPath: string,
  iniName: string,
  options: ReadIniOptions = {},
): Promise<string> {
  const { applySecondaryXor: xor = false, decodeKorean: decode = true } =
    options;

  const buf = await fsp.readFile(iopPath);
  const entries = await extractIop(buf);

  const entry = entries.find((e) =>
    e.filename.toLowerCase().includes(iniName.toLowerCase()),
  );
  if (!entry) {
    throw new Error(`${iniName} not found inside ${iopPath}`);
  }

  const data = xor ? applySecondaryXor(entry.data) : entry.data;
  return decode ? decodeKorean(data) : data.toString("utf-8");
}

/**
 * Read a plain INI file from the local unpacked client tree.
 *
 * Lost Saga INIs are encoded in Korean code pages; this helper decodes with
 * cp949 first and falls back to euc-kr.
 */
export async function readPlainIni(iniPath: string): Promise<string> {
  const buf = await fsp.readFile(iniPath);
  return decodeKorean(buf);
}

export interface IniSection {
  name: string;
  fields: Record<string, string>;
}

/**
 * Parse a simple INI text into sections. Strips blank lines and ';' comments.
 */
export function parseIniSections(text: string): IniSection[] {
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

export function normalizeNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

export function normalizeFloat(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const cleaned = value.replace(/f$/i, "");
  const num = Number(cleaned);
  return Number.isNaN(num) ? undefined : num;
}
