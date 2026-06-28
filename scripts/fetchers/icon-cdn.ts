import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { runWithConcurrency } from "../lib/queue";
import { exists, readJson, writeJson } from "../lib/utils";

const DATA_DIR = path.resolve("data");
const UI_IMAGESET_JSON = path.join(DATA_DIR, "ui-imageset.json");
const UI_IMAGE_DIR = path.join(DATA_DIR, "images", "ui");
const ICON_OUTPUT_DIR = path.join(DATA_DIR, "images", "icon");
const ICON_CDN_JSON = path.join(DATA_DIR, "icon-cdn.json");
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/rifadev26/lostsaga-database@main/data/images/icon";

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

function encodeIconKey(key: string): string {
  return encodeURIComponent(key);
}

function isValidFileName(value: string): boolean {
  if (!value || value === "." || value === "..") return false;
  if (/[<>:"/\\|?*]/.test(value)) return false;
  return true;
}

async function processImageset(
  set: UIImageset,
): Promise<{ generated: number; skipped: number; failed: string[] }> {
  const pngPath = path.join(UI_IMAGE_DIR, set.pngFile);
  const result = { generated: 0, skipped: 0, failed: [] as string[] };

  if (!(await exists(pngPath))) {
    console.warn(`  Sheet not found: ${set.pngFile}`);
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

    const outPath = path.join(ICON_OUTPUT_DIR, `${key}.png`);
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
      console.warn(`  Failed ${key}: ${message}`);
      result.failed.push(key);
    }
  });

  return result;
}

export async function buildIconCdn(): Promise<void> {
  await fsp.mkdir(ICON_OUTPUT_DIR, { recursive: true });

  const imagesets = await readJson<UIImageset[]>(UI_IMAGESET_JSON);
  const cdnEntries: IconCdnEntry[] = [];
  const allFailed: string[] = [];
  let totalGenerated = 0;
  let totalSkipped = 0;

  console.log(`Processing ${imagesets.length} imagesets...`);

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
        iconPngUrl: `${CDN_BASE}/${encodeIconKey(key)}.png`,
        x: img.x,
        y: img.y,
        width: img.width,
        height: img.height,
      });
    }

    const { generated, skipped, failed } = await processImageset(set);
    totalGenerated += generated;
    totalSkipped += skipped;
    allFailed.push(...failed);

    if ((i + 1) % 50 === 0 || i + 1 === imagesets.length) {
      console.log(
        `  ${i + 1}/${imagesets.length}: ${set.name} -> generated ${generated}, skipped ${skipped}, failed ${failed.length}`,
      );
    }
  }

  await writeJson(ICON_CDN_JSON, cdnEntries);
  console.log(`Wrote ${cdnEntries.length} entries to ${ICON_CDN_JSON}`);

  if (allFailed.length > 0) {
    await writeJson(
      path.join(DATA_DIR, "failed-icon-cdn.json"),
      allFailed,
    );
    console.warn(`${allFailed.length} icons failed to generate`);
  }

  console.log(
    `Done. Generated ${totalGenerated.toLocaleString("en-US")} new individual PNGs, skipped ${totalSkipped.toLocaleString("en-US")} existing/empty, total entries ${cdnEntries.length.toLocaleString("en-US")}.`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildIconCdn().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
