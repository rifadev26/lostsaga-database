import path from "node:path";

export function getServerDataPath(alias: string, file: string): string {
  return path.join(process.cwd(), "..", "data", alias, file);
}

export function getServerImagePath(alias: string, ...segments: string[]): string {
  return "/" + ["images", alias, ...segments].join("/");
}
