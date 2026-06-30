import { readFile } from "node:fs/promises";
import type { EtcItem, ManualEntry } from "@/lib/items";
import { getServerDataPath } from "./path";

async function readItems(alias: string): Promise<EtcItem[]> {
  const raw = await readFile(getServerDataPath(alias, "etc-items.json"), "utf8");
  return JSON.parse(raw) as EtcItem[];
}

async function readManualsRecord(
  alias: string,
): Promise<Record<number, ManualEntry>> {
  const raw = await readFile(
    getServerDataPath(alias, "etc-manuals.json"),
    "utf8",
  );
  return JSON.parse(raw) as Record<number, ManualEntry>;
}

export async function loadItems(alias: string): Promise<EtcItem[]> {
  return readItems(alias);
}

export async function loadItemById(
  alias: string,
): Promise<Map<number, EtcItem>> {
  const items = await readItems(alias);
  return new Map(items.map((item) => [item.id, item]));
}

export async function loadItemGroups(alias: string): Promise<number[]> {
  const items = await readItems(alias);
  return Array.from(
    new Set(items.map((item) => item.group).filter((g): g is number => g !== undefined)),
  ).sort((a, b) => a - b);
}

export async function loadItemTypes(alias: string): Promise<number[]> {
  const items = await readItems(alias);
  return Array.from(new Set(items.map((item) => item.type))).sort((a, b) => a - b);
}

export async function loadManuals(alias: string): Promise<ManualEntry[]> {
  const record = await readManualsRecord(alias);
  return Object.values(record);
}

export async function loadManualById(
  alias: string,
): Promise<Map<number, ManualEntry>> {
  const record = await readManualsRecord(alias);
  return new Map(
    Object.entries(record).map(([id, manual]) => [Number(id), manual]),
  );
}
