import fs from "fs";
import path from "path";
import type { Medal } from "@/lib/medals";

const dataPath = path.join(process.cwd(), "..", "data", "medals.json");
const raw = fs.readFileSync(dataPath, "utf8");
export const medals: Medal[] = JSON.parse(raw);

export const medalById = new Map<number, Medal>(
  medals.map((medal) => [medal.id, medal]),
);

export const medalSubTypes = Array.from(
  new Set(
    medals
      .map((m) => m.subMedalType)
      .filter((t): t is number => t !== undefined),
  ),
).sort((a, b) => a - b);

export const medalLimitLevels = Array.from(
  new Set(
    medals
      .map((m) => m.limitLevel)
      .filter((l): l is number => l !== undefined),
  ),
).sort((a, b) => a - b);
