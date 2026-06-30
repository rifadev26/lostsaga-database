import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import {
  getServerDataDir,
  getServerPublicImageDir,
  getServerImageUrl,
} from "../config";
import { exists, readJson, writeJson } from "../lib/utils";
import { runWithConcurrency } from "../lib/queue";

interface UIIcon {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
}

interface UIImageset {
  name: string;
  ddsFile: string;
  pngFile: string;
  pngUrl: string;
  images: UIIcon[];
}

export interface IconCdnEntry {
  id: number;
  imageset: string;
  name: string;
  iconFile: string;
  iconPngUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function getIconKey(imageset: string, name: string): string {
  return `${imageset}#${name}`;
}

function isValidFileName(value: string): boolean {
  if (!value || value === "." || value === "..") return false;
  if (/[<>:"/\\|?*]/.test(value)) return false;
  return true;
}

async function processImageset(
  alias: string,
  set: UIImageset,
): Promise<{ generated: number; skipped: number; failed: string[] }> {
  const uiImageDir = path.join(getServerPublicImageDir(alias), "ui");
  const iconImageDir = path.join(getServerPublicImageDir(alias), "icon");
  const pngPath = path.join(uiImageDir, set.pngFile);
  const result = { generated: 0, skipped: 0, failed: [] as string[] };

  if (!(await exists(pngPath))) {
    console.warn(`[${alias}]   Sheet not found: ${set.pngFile}`);
    result.failed = set.images.map((img) => getIconKey(set.name, img.name));
    return result;
  }

  const metadata = await sharp(pngPath).metadata();
  const sheetWidth = metadata.width ?? 0;
  const sheetHeight = metadata.height ?? 0;

  await runWithConcurrency(set.images, 5, async (img) => {
    if (!img.width || !img.height) {
      result.skipped++;
      return;
    }

    const key = getIconKey(set.name, img.name);
    if (!isValidFileName(set.name) || !isValidFileName(img.name)) {
      result.failed.push(key);
      return;
    }

    const outPath = path.join(iconImageDir, `${key}.png`);
    if (await exists(outPath)) {
      result.skipped++;
      return;
    }

    const exceedsBounds =
      img.x < 0 ||
      img.y < 0 ||
      img.x + img.width > sheetWidth ||
      img.y + img.height > sheetHeight;
    if (exceedsBounds) {
      result.failed.push(key);
      return;
    }

    try {
      await sharp(pngPath)
        .extract({
          left: img.x,
          top: img.y,
          width: img.width,
          height: img.height,
        })
        .png({ compressionLevel: 9 })
        .toFile(outPath);
      result.generated++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[${alias}]   Failed ${key}: ${message}`);
      result.failed.push(key);
    }
  });

  return result;
}

export async function parseIconCdn(alias: string): Promise<void> {
  const dataDir = getServerDataDir(alias);
  const iconImageDir = path.join(getServerPublicImageDir(alias), "icon");

  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.mkdir(iconImageDir, { recursive: true });

  const imagesets = await readJson<UIImageset[]>(
    path.join(dataDir, "ui-imageset.json"),
  );
  const cdnEntries: IconCdnEntry[] = [];
  const allFailed: string[] = [];
  let totalGenerated = 0;
  let totalSkipped = 0;

  console.log(`[${alias}] Processing ${imagesets.length} imagesets...`);

  for (let i = 0; i < imagesets.length; i++) {
    const set = imagesets[i]!;

    for (const img of set.images) {
      if (!img.width || !img.height) continue;
      const key = getIconKey(set.name, img.name);
      const iconFile = `${key}.png`;
      cdnEntries.push({
        id: cdnEntries.length + 1,
        imageset: set.name,
        name: img.name,
        iconFile,
        iconPngUrl: getServerImageUrl(alias, "icon", iconFile),
        x: img.x,
        y: img.y,
        width: img.width,
        height: img.height,
      });
    }

    const { generated, skipped, failed } = await processImageset(alias, set);
    totalGenerated += generated;
    totalSkipped += skipped;
    allFailed.push(...failed);

    if ((i + 1) % 50 === 0 || i + 1 === imagesets.length) {
      console.log(
        `[${alias}]   ${i + 1}/${imagesets.length}: ${set.name} -> generated ${generated}, skipped ${skipped}, failed ${failed.length}`,
      );
    }
  }

  await writeJson(path.join(dataDir, "icon-cdn.json"), cdnEntries);
  console.log(`[${alias}] Wrote ${cdnEntries.length} entries to icon-cdn.json`);

  if (allFailed.length > 0) {
    await writeJson(
      path.join(dataDir, "failed-icon-cdn.json"),
      allFailed,
    );
    console.warn(`[${alias}] ${allFailed.length} icons failed to generate`);
  }

  console.log(
    `[${alias}] Done. Generated ${totalGenerated.toLocaleString("en-US")} new individual PNGs, skipped ${totalSkipped.toLocaleString("en-US")} existing/empty, total entries ${cdnEntries.length.toLocaleString("en-US")}.`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const alias = process.argv[2];
  if (!alias) {
    console.error("Usage: tsx scripts/parse/icon-cdn.ts <server-alias>");
    process.exit(1);
  }
  parseIconCdn(alias).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
