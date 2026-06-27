import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { XMLParser } from "fast-xml-parser";
import { convertDdsToPng } from "@marcuth/dds-to-png";
import { extractIop } from "../lib/iop";
import { convertUncompressedDdsToPng } from "../lib/dds-to-png";
import { runWithConcurrency } from "../lib/queue";
import { exists, writeJson } from "../lib/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

const PATCH_BASE = "https://lostsagakr-cdn.valofe.com/lostsaga_service/client";
const SERVER_PATCH_CFG_IOP = `${PATCH_BASE}/server_patch.cfg.iop`;
const XML_IMAGESET_IOP = `${PATCH_BASE}/xml/uiimageset.xml.iop`;

const CACHE_DIR = path.join(ROOT_DIR, "data", ".cache");
const IOP_CACHE_DIR = path.join(CACHE_DIR, "iop");
const DATA_DIR = path.join(ROOT_DIR, "data");
const IMAGE_OUTPUT_DIR = path.join(DATA_DIR, "images", "ui");
const IMAGE_OUTPUT_DIR_REL = "data/images/ui";
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/rifadev26/lostsaga-database@main/data/images/ui";

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

export interface UiImage {
  imageset: string;
  name: string;
  ddsFile: string;
  pngFile: string;
  pngUrl: string;
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

interface PatchEntry {
  remotePath: string;
  crc: string;
  compressedSize?: number;
  uncompressedSize?: number;
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function readCachedOrDownload(
  remotePath: string,
): Promise<Buffer> {
  const cachePath = path.join(IOP_CACHE_DIR, ...remotePath.split("/"));
  if (await exists(cachePath)) {
    return fsp.readFile(cachePath);
  }

  const url = `${PATCH_BASE}/${remotePath}`;
  const buf = await fetchBuffer(url);
  await fsp.mkdir(path.dirname(cachePath), { recursive: true });
  await fsp.writeFile(cachePath, buf);
  return buf;
}

async function downloadAndExtractManifest(): Promise<Map<string, PatchEntry>> {
  const cachePath = path.join(CACHE_DIR, "server_patch.cfg");
  let text: string;

  if (await exists(cachePath)) {
    text = await fsp.readFile(cachePath, "utf-8");
  } else {
    console.log("Downloading server_patch.cfg.iop");
    const buf = await fetchBuffer(SERVER_PATCH_CFG_IOP);
    await fsp.mkdir(CACHE_DIR, { recursive: true });
    await fsp.writeFile(path.join(CACHE_DIR, "server_patch.cfg.iop"), buf);
    const entries = await extractIop(buf);
    const cfgEntry = entries.find((e) => e.filename.includes("server_patch.cfg"));
    if (!cfgEntry) {
      throw new Error("server_patch.cfg not found inside .iop archive");
    }
    text = new TextDecoder("euc-kr").decode(cfgEntry.data);
    await fsp.writeFile(cachePath, text);
  }

  const map = new Map<string, PatchEntry>();
  for (const line of text.split(/\r?\n/)) {
    const match = /^\[(.+?):([0-9a-fA-F]+):(\d+):(\d+)\]$/.exec(line.trim());
    if (!match) continue;
    const [, remotePath, crc, compressedSize, uncompressedSize] = match;
    map.set(path.basename(remotePath), {
      remotePath,
      crc,
      compressedSize: Number(compressedSize),
      uncompressedSize: Number(uncompressedSize),
    });
  }

  return map;
}

async function extractFileFromIop(
  iopBuffer: Buffer,
  expectedName: string,
): Promise<Buffer> {
  const entries = await extractIop(iopBuffer);
  const entry = entries.find((e) => e.filename.includes(expectedName));
  if (!entry) {
    throw new Error(`${expectedName} not found inside .iop archive`);
  }
  return entry.data;
}

function findTextureIopPath(
  fileName: string,
  manifest: Map<string, PatchEntry>,
): string | undefined {
  // DDS files may also be .bmp etc. The manifest stores the .iop wrapping the exact file.
  const direct = `${fileName}.iop`;
  if (manifest.has(direct)) {
    return manifest.get(direct)!.remotePath;
  }

  const underMap = `_map/resource/texture/${fileName}.iop`;
  if (manifest.has(path.basename(underMap))) {
    return manifest.get(path.basename(underMap))!.remotePath;
  }

  const underRoot = `resource/texture/${fileName}.iop`;
  if (manifest.has(path.basename(underRoot))) {
    return manifest.get(path.basename(underRoot))!.remotePath;
  }

  return undefined;
}

async function extractDdsOrAsset(
  fileName: string,
  manifest: Map<string, PatchEntry>,
): Promise<{ ok: boolean; error?: string }> {
  const remotePath = findTextureIopPath(fileName, manifest);
  if (!remotePath) {
    return { ok: false, error: "Not found in manifest" };
  }

  const destPath = path.join(IMAGE_OUTPUT_DIR, fileName);
  if (await exists(destPath)) {
    return { ok: true };
  }

  try {
    const iopBuffer = await readCachedOrDownload(remotePath);
    const data = await extractFileFromIop(iopBuffer, fileName);
    if (data.length === 0) {
      return { ok: false, error: "Extracted file is empty" };
    }
    await fsp.writeFile(destPath, data);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

async function convertToPngIfNeeded(fileName: string): Promise<boolean> {
  const ext = path.extname(fileName).toLowerCase();
  if (ext !== ".dds") return true;

  const ddsPath = path.join(IMAGE_OUTPUT_DIR, fileName);
  const pngFile = `${path.basename(fileName, ext)}.png`;
  const pngPath = path.join(IMAGE_OUTPUT_DIR, pngFile);

  if (await exists(pngPath)) return true;

  try {
    const stat = await fsp.stat(ddsPath);
    if (stat.size === 0) {
      console.error(`Skipping empty DDS file: ${fileName}`);
      return false;
    }
  } catch {
    return false;
  }

  try {
    await convertDdsToPng(ddsPath, pngPath);
    return true;
  } catch (marcuthErr) {
    // @marcuth/dds-to-png only supports DXT/ATI2. Fall back to a manual
    // encoder for uncompressed BGRA/RGBA DDS files used by many UI sheets.
    try {
      await convertUncompressedDdsToPng(ddsPath, pngPath);
      return true;
    } catch (fallbackErr) {
      const primary =
        marcuthErr instanceof Error ? marcuthErr.message : String(marcuthErr);
      const fallback =
        fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.error(
        `Failed to convert ${fileName} to PNG: ${primary}; fallback: ${fallback}`,
      );
      return false;
    }
  }
}

async function fetchAndParseUiImageset(): Promise<{
  imagesets: UiImageset[];
  icons: Record<string, UiImage>;
  uniqueFiles: string[];
}> {
  console.log("Downloading uiimageset.xml.iop");
  const iopBuffer = await readCachedOrDownload("xml/uiimageset.xml.iop");
  const entries = await extractIop(iopBuffer);
  const xmlEntry = entries.find((e) => e.filename.endsWith("uiimageset.xml"));
  if (!xmlEntry) {
    throw new Error("uiimageset.xml not found inside .iop archive");
  }

  const xmlText = new TextDecoder("euc-kr").decode(xmlEntry.data);
  await fsp.writeFile(path.join(CACHE_DIR, "uiimageset.xml"), xmlText);

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
  const icons: Record<string, UiImage> = {};
  const uniqueFiles = new Set<string>();

  const list = Array.isArray(rawSets) ? rawSets : rawSets ? [rawSets] : [];
  for (const raw of list) {
    const imagesetName = String(raw.Name);
    const ddsFile = String(raw.File);
    const pngFile = `${path.basename(ddsFile, path.extname(ddsFile))}.png`;
    const pngUrl = `${CDN_BASE}/${pngFile}`;
    uniqueFiles.add(ddsFile);

    const rawImages = Array.isArray(raw.Image) ? raw.Image : raw.Image ? [raw.Image] : [];
    const images = rawImages.map((img) => {
      const icon: UiImage = {
        imageset: imagesetName,
        name: String(img.Name),
        ddsFile,
        pngFile,
        pngUrl,
        x: Number(img.X) || 0,
        y: Number(img.Y) || 0,
        width: Number(img.Width) || 0,
        height: Number(img.Height) || 0,
        offsetX: Number(img.OffsetX) || 0,
        offsetY: Number(img.OffsetY) || 0,
      };
      icons[`${imagesetName}#${icon.name}`] = icon;
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

export async function fetchTextures(): Promise<void> {
  await fsp.mkdir(CACHE_DIR, { recursive: true });
  await fsp.mkdir(IOP_CACHE_DIR, { recursive: true });
  await fsp.mkdir(IMAGE_OUTPUT_DIR, { recursive: true });

  console.log("Loading patch manifest...");
  const manifest = await downloadAndExtractManifest();
  console.log(`Manifest contains ${manifest.size} entries`);

  console.log("Fetching and parsing uiimageset.xml...");
  const { imagesets, icons, uniqueFiles } = await fetchAndParseUiImageset();
  console.log(
    `Parsed ${imagesets.length} imagesets, ${Object.keys(icons).length} icons, ${uniqueFiles.length} texture files`,
  );

  await writeJson(path.join(DATA_DIR, "ui-imageset.json"), imagesets);
  await writeJson(path.join(DATA_DIR, "ui-icons.json"), icons);
  console.log("Wrote data/ui-imageset.json and data/ui-icons.json");

  const failed: { file: string; error?: string }[] = [];

  console.log(`Downloading/extracting ${uniqueFiles.length} texture files...`);
  await runWithConcurrency(uniqueFiles, 5, async (file) => {
    const result = await extractDdsOrAsset(file, manifest);
    if (result.ok) {
      console.log(`  ${file}`);
    } else {
      console.error(`  ${file}: ${result.error}`);
      failed.push({ file, error: result.error });
    }
  });

  console.log("Converting DDS sheets to PNG...");
  const conversionFailed: string[] = [];
  await runWithConcurrency(uniqueFiles, 3, async (file) => {
    const ok = await convertToPngIfNeeded(file);
    if (!ok) conversionFailed.push(file);
  });

  if (failed.length > 0) {
    await writeJson(path.join(DATA_DIR, "failed-ui-images.json"), failed);
    console.warn(`${failed.length} texture files failed to download/extract`);
  }
  if (conversionFailed.length > 0) {
    await writeJson(path.join(DATA_DIR, "failed-ui-conversions.json"), conversionFailed);
    console.warn(`${conversionFailed.length} DDS files failed to convert`);
  }

  console.log(
    `Done. ${uniqueFiles.length - failed.length}/${uniqueFiles.length} textures extracted, ${uniqueFiles.length - conversionFailed.length} PNGs generated.`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchTextures().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
