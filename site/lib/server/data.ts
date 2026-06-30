import { readFile } from "node:fs/promises";
import { getServerDataPath } from "./path";

export interface Skill {
  name: string;
  icon?: string;
  emoticon?: string;
  extra?: string | null;
  desc?: string;
  desc_name?: string;
  desc_kr?: string;
  [key: string]: unknown;
}

export interface Gear {
  id: number;
  slug: string;
  name: string;
  name_kr?: string;
  rarity: string;
  code: string;
  item_type: string;
  sub_type: string;
  icon: string;
  skill: Skill;
  [key: string]: unknown;
}

export interface Hero {
  name: string;
  code: string;
  summary: string;
  type: string;
  rarity: string;
  default_ani: string;
  icon_m: string;
  icon_f: string;
  pic_m: string;
  pic_f: string;
  artwork1: string;
  artwork2: string;
  gears: Gear[];
  [key: string]: unknown;
}

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
