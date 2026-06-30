import { readFile } from "node:fs/promises";
import type { Pet, PetFeedRank, PetManual } from "@/lib/pets";
import { getServerDataPath } from "./path";

async function readPets(alias: string): Promise<Pet[]> {
  const raw = await readFile(getServerDataPath(alias, "pets.json"), "utf8");
  return JSON.parse(raw) as Pet[];
}

export async function loadPets(alias: string): Promise<Pet[]> {
  return readPets(alias);
}

export async function loadPetById(alias: string): Promise<Map<number, Pet>> {
  const pets = await readPets(alias);
  return new Map(pets.map((pet) => [pet.id, pet]));
}

export async function loadPetFeedRanks(
  alias: string,
): Promise<PetFeedRank[]> {
  const raw = await readFile(
    getServerDataPath(alias, "pet-feed-info.json"),
    "utf8",
  );
  return JSON.parse(raw) as PetFeedRank[];
}

async function readPetManualsRecord(
  alias: string,
): Promise<Record<number, PetManual>> {
  const raw = await readFile(
    getServerDataPath(alias, "pet-manuals.json"),
    "utf8",
  );
  return JSON.parse(raw) as Record<number, PetManual>;
}

export async function loadPetManuals(alias: string): Promise<PetManual[]> {
  const record = await readPetManualsRecord(alias);
  return Object.values(record);
}

export async function loadPetManualById(
  alias: string,
): Promise<Map<number, PetManual>> {
  const record = await readPetManualsRecord(alias);
  return new Map(
    Object.entries(record).map(([id, manual]) => [Number(id), manual]),
  );
}

export async function loadPetRanks(alias: string): Promise<number[]> {
  const pets = await readPets(alias);
  return Array.from(
    new Set(pets.flatMap((p) => [p.baseRank, p.maxRank])),
  ).sort((a, b) => a - b);
}

export const petStatLabels = [
  "ATK",
  "DEF",
  "Move SPD",
  "Drop",
  "Weapon Skill",
  "Armor Skill",
  "Helmet Skill",
  "Cloak Skill",
];
