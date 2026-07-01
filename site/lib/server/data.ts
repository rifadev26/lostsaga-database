import { readFile } from "node:fs/promises";
import type { Hero } from "@/lib/data";
import { getServerDataPath } from "./path";

async function readHeroes(alias: string): Promise<Hero[]> {
  const raw = await readFile(getServerDataPath(alias, "mercenary.json"), "utf8");
  return JSON.parse(raw) as Hero[];
}

export async function loadHeroes(alias: string): Promise<Hero[]> {
  return readHeroes(alias);
}

export async function loadHeroByCode(alias: string): Promise<Map<string, Hero>> {
  const heroes = await readHeroes(alias);
  return new Map(heroes.map((h) => [h.code, h]));
}

export async function loadHeroTypes(alias: string): Promise<string[]> {
  const heroes = await readHeroes(alias);
  return Array.from(new Set(heroes.map((h) => h.type))).sort();
}

export async function loadHeroRarities(alias: string): Promise<string[]> {
  const heroes = await readHeroes(alias);
  return Array.from(new Set(heroes.map((h) => h.rarity))).sort();
}
