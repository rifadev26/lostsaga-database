import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { XMLParser } from "fast-xml-parser";
import { convertDdsToPng } from "@marcuth/dds-to-png";
import {
  getServerXmlDir,
  getServerMapDir,
  getServerDataDir,
  getServerPublicImageDir,
  getServerImageUrl,
} from "../config";
import { convertUncompressedDdsToPng } from "../lib/dds-to-png";
import { convertBmpToPng } from "../lib/bmp-to-png";
import { exists, writeJson } from "../lib/utils";
import { runWithConcurrency } from "../lib/queue";

export interface UiImage {
  id: number;
  imageset: string;
  name: string;
  ddsFile: string;
  pngFile: string;
  pngUrl: string;
  iconFile: string;
  iconPngUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface UiImageset {
  name: string;
  ddsFile: string;
  pngFile: string;
  pngUrl: string;
  images: Omit<UiImage, "imageset">[];
}

interface RawImage {
  Name: string;
  X: string;
  Y: string;
  Width: string;
  Height: string;
  OffsetX?: string;
  OffsetY?: string;
}

interface RawImageset {
  Name: string;
  File: string;
  Image: RawImage | RawImage[];
}

function decodeXml(buf: Buffer): string {
  try {
    return new TextDecoder("cp949").decode(buf);
  } catch {
    return new TextDecoder("euc-kr").decode(buf);
  }
}

async function resolveTextureFile(
  alias: string,
  fileName: string,
): Promise<string | null> {
  const candidates = [
    path.join(getServerMapDir(alias), "resource", "texture", fileName),
    path.join(getServerMapDir(alias), fileName),
    path.join(getServerXmlDir(alias), "..", "resource", "texture", fileName),
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function convertToPng(
  sourcePath: string,
  destPath: string,
): Promise<boolean> {
  const ext = path.extname(sourcePath).toLowerCase();
  if (ext === ".png") {
    await fsp.copyFile(sourcePath, destPath);
    return true;
  }

  if (ext === ".bmp") {
    try {
      await convertBmpToPng(sourcePath, destPath);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Failed to convert ${sourcePath} to PNG: ${message}`);
      return false;
    }
  }

  if (ext === ".dds") {
    try {
      await convertDdsToPng(sourcePath, destPath);
      return true;
    } catch (marcuthErr) {
      try {
        await convertUncompressedDdsToPng(sourcePath, destPath);
        return true;
      } catch (fallbackErr) {
        const primary =
          marcuthErr instanceof Error ? marcuthErr.message : String(marcuthErr);
        const fallback =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : String(fallbackErr);
        console.error(
          `Failed to convert ${sourcePath} to PNG: ${primary}; fallback: ${fallback}`,
        );
        return false;
      }
    }
  }

  console.error(`Unsupported texture format: ${sourcePath}`);
  return false;
}

async function parseUiImagesetXml(alias: string): Promise<{
  imagesets: UiImageset[];
  icons: UiImage[];
  uniqueFiles: string[];
}> {
  const xmlPath = path.join(getServerXmlDir(alias), "uiimageset.xml");
  const xmlBuf = await fsp.readFile(xmlPath);
  const xmlText = decodeXml(xmlBuf);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true,
  });
  const parsed = parser.parse(xmlText) as {
    ImagesetLayout?: { Imageset?: RawImageset | RawImageset[] };
  };

  const rawSets = parsed.ImagesetLayout?.Imageset;
  const imagesets: UiImageset[] = [];
  const icons: UiImage[] = [];
  const uniqueFiles = new Set<string>();

  const list = Array.isArray(rawSets) ? rawSets : rawSets ? [rawSets] : [];
  for (const raw of list) {
    const imagesetName = String(raw.Name);
    const ddsFile = String(raw.File);
    const pngFile = `${path.basename(ddsFile, path.extname(ddsFile))}.png`;
    const pngUrl = getServerImageUrl(alias, "ui", pngFile);
    uniqueFiles.add(ddsFile);

    const rawImages = Array.isArray(raw.Image)
      ? raw.Image
      : raw.Image
        ? [raw.Image]
        : [];
    const images = rawImages.map((img) => {
      const iconFile = `${imagesetName}#${String(img.Name)}.png`;
      const icon: UiImage = {
        id: icons.length + 1,
        imageset: imagesetName,
        name: String(img.Name),
        ddsFile,
        pngFile,
        pngUrl,
        iconFile,
        iconPngUrl: getServerImageUrl(alias, "icon", iconFile),
        x: Number(img.X) || 0,
        y: Number(img.Y) || 0,
        width: Number(img.Width) || 0,
        height: Number(img.Height) || 0,
        offsetX: Number(img.OffsetX) || 0,
        offsetY: Number(img.OffsetY) || 0,
      };
      icons.push(icon);
      return icon;
    });

    imagesets.push({
      name: imagesetName,
      ddsFile,
      pngFile,
      pngUrl,
      images: images.map(({ imageset: _, ...rest }) => rest),
    });
  }

  return { imagesets, icons, uniqueFiles: Array.from(uniqueFiles) };
}

export async function parseTextures(alias: string): Promise<void> {
  const dataDir = getServerDataDir(alias);
  const imageDir = path.join(getServerPublicImageDir(alias), "ui");

  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.mkdir(imageDir, { recursive: true });

  console.log(`[${alias}] Parsing uiimageset.xml...`);
  const { imagesets, icons, uniqueFiles } = await parseUiImagesetXml(alias);
  console.log(
    `[${alias}] Parsed ${imagesets.length} imagesets, ${icons.length} icons, ${uniqueFiles.length} texture files`,
  );

  await writeJson(path.join(dataDir, "ui-imageset.json"), imagesets);
  await writeJson(path.join(dataDir, "ui-icons.json"), icons);
  console.log(`[${alias}] Wrote ui-imageset.json and ui-icons.json`);

  const failed: { file: string; error?: string }[] = [];
  const conversionFailed: string[] = [];

  console.log(`[${alias}] Resolving ${uniqueFiles.length} texture files...`);
  const resolvedFiles: { sourcePath: string; pngFile: string }[] = [];

  for (const file of uniqueFiles) {
    const sourcePath = await resolveTextureFile(alias, file);
    if (!sourcePath) {
      console.error(`[${alias}]   ${file}: not found`);
      failed.push({ file, error: "Not found in server tree" });
      continue;
    }

    const pngFile = `${path.basename(file, path.extname(file))}.png`;
    resolvedFiles.push({ sourcePath, pngFile });
    console.log(`[${alias}]   ${file} -> ${pngFile}`);
  }

  console.log(`[${alias}] Converting texture files to PNG...`);
  await runWithConcurrency(resolvedFiles, 3, async ({ sourcePath, pngFile }) => {
    const destPath = path.join(imageDir, pngFile);
    if (await exists(destPath)) {
      return;
    }
    const ok = await convertToPng(sourcePath, destPath);
    if (!ok) {
      conversionFailed.push(pngFile);
    }
  });

  if (failed.length > 0) {
    await writeJson(path.join(dataDir, "failed-ui-images.json"), failed);
    console.warn(`[${alias}] ${failed.length} texture files failed to resolve`);
  }
  if (conversionFailed.length > 0) {
    await writeJson(
      path.join(dataDir, "failed-ui-conversions.json"),
      conversionFailed,
    );
    console.warn(
      `[${alias}] ${conversionFailed.length} files failed to convert to PNG`,
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const alias = process.argv[2];
  if (!alias) {
    console.error("Usage: tsx scripts/parse/textures.ts <server-alias>");
    process.exit(1);
  }
  parseTextures(alias).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
