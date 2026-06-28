import fsp from "fs/promises";
import path from "path";

export interface IconWithKey {
  imageset: string;
  name: string;
  [key: string]: unknown;
}

export function buildIconMap<T extends IconWithKey>(
  icons: T[],
): Record<string, T> {
  const map: Record<string, T> = {};
  for (const icon of icons) {
    map[`${icon.imageset}#${icon.name}`] = icon;
  }
  return map;
}

export function isValidUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("http");
}

export function extFromUrl(url: string): string {
  try {
    const ext = path.extname(new URL(url).pathname);
    return ext || ".png";
  } catch {
    return ".png";
  }
}

export function fixImageUrl(url: string | undefined, key: string): string | null {
  if (typeof url !== "string") return null;

  // The API sometimes returns placeholder URLs for empty gear slots.
  if (url.includes("ItemIconPack000-empty")) return null;

  // Some skill icon/emoticon URLs incorrectly use "-n" instead of "-s".
  if (key === "skill_icon" || key === "skill_emoticon") {
    return url.replace(/\/SkillIconPack\d+-n\d+_[^/]+$/, (match) =>
      match.replace("-n", "-s"),
    );
  }

  return url;
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fsp.readFile(filePath, "utf8")) as T;
}

export async function writeJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2));
}
