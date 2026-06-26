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

export const ASSET_BASE =
  "https://cdn.jsdelivr.net/gh/rifadev26/lostsaga-database@main/";

export function getAssetUrl(assetPath: string): string {
  return `${ASSET_BASE}${assetPath}`;
}

function uniqueTruthy<T>(arr: T[]): T[] {
  return arr.filter((v, i, a) => Boolean(v) && a.indexOf(v) === i) as T[];
}

export function getHeroIconCandidates(hero: Hero): string[] {
  return uniqueTruthy([hero.icon_m, hero.icon_f, hero.pic_m, hero.pic_f]);
}

export function getHeroArtworkCandidates(hero: Hero): string[] {
  return uniqueTruthy([hero.artwork1, hero.artwork2, hero.pic_m, hero.pic_f]);
}

export const SPECIAL_RARITIES = ["idol", "reform"];

export function isRegularHero(hero: Hero): boolean {
  return !SPECIAL_RARITIES.includes(hero.rarity);
}
