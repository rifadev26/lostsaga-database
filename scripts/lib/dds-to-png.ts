import fsp from "node:fs/promises";
import { deflateSync } from "node:zlib";

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

let crcTable: Uint32Array | undefined;
function crc32(buf: Buffer, table: Uint32Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeChunk(type: string, data: Buffer, table: Uint32Array): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data]), table), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

export function writePngRgba(width: number, height: number, rgba: Buffer): Buffer {
  const table = crcTable ?? (crcTable = makeCrcTable());
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowSize = width * 4;
  const filtered = Buffer.allocUnsafe((rowSize + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowSize + 1);
    filtered[rowStart] = 0; // filter type: none
    rgba.copy(filtered, rowStart + 1, y * rowSize, (y + 1) * rowSize);
  }

  const idat = deflateSync(filtered, { level: 9 });

  return Buffer.concat([
    signature,
    writeChunk("IHDR", ihdr, table),
    writeChunk("IDAT", idat, table),
    writeChunk("IEND", Buffer.alloc(0), table),
  ]);
}

function extractChannel(pixel: number, mask: number): number {
  if (mask === 0) return 0;
  let value = (pixel & mask) >>> 0;
  // shift right to normalize to LSB
  let shift = 0;
  let m = mask >>> 0;
  while ((m & 1) === 0 && shift < 32) {
    m >>>= 1;
    shift++;
  }
  value >>>= shift;
  // normalize to 8 bits
  const bits = Math.min(32, popcount(mask >>> shift));
  if (bits === 8) return value & 0xff;
  if (bits === 0) return 0;
  // scale up to 8 bits
  return Math.round((value / ((1 << bits) - 1)) * 255) & 0xff;
}

function popcount(n: number): number {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>>= 1;
  }
  return c;
}

export async function convertUncompressedDdsToPng(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const buf = await fsp.readFile(inputPath);
  if (buf.length < 128) {
    throw new Error("DDS file too small");
  }
  if (buf.readUInt32LE(0) !== 0x20534444) {
    throw new Error("Invalid DDS magic");
  }

  const height = buf.readUInt32LE(12);
  const width = buf.readUInt32LE(16);
  const pfOffset = 76;
  const pfFlags = buf.readUInt32LE(pfOffset + 4);
  const fourCC = buf.readUInt32LE(pfOffset + 8);
  const rgbBitCount = buf.readUInt32LE(pfOffset + 12);
  const rMask = buf.readUInt32LE(pfOffset + 16);
  const gMask = buf.readUInt32LE(pfOffset + 20);
  const bMask = buf.readUInt32LE(pfOffset + 24);
  const aMask = buf.readUInt32LE(pfOffset + 28);
  const dataOffset = 4 + buf.readUInt32LE(4); // 4 + dwSize

  const DDPF_FOURCC = 0x4;
  const DDPF_RGB = 0x40;
  const DDPF_ALPHAPIXELS = 0x1;

  if (fourCC !== 0 && (pfFlags & DDPF_FOURCC) !== 0) {
    throw new Error("DDS is compressed; use a compressed converter");
  }

  if (rgbBitCount !== 32 && rgbBitCount !== 24) {
    throw new Error(`Unsupported uncompressed bit count: ${rgbBitCount}`);
  }

  const hasAlpha = (pfFlags & DDPF_ALPHAPIXELS) !== 0 && aMask !== 0;
  const pixelBytes = rgbBitCount / 8;
  const expectedTopSize = width * height * pixelBytes;
  const data = buf.subarray(dataOffset, dataOffset + expectedTopSize);
  if (data.length < expectedTopSize) {
    throw new Error("DDS data truncated");
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    let pixel: number;
    if (pixelBytes === 4) {
      pixel = data.readUInt32LE(i * 4);
    } else {
      pixel = data.readUIntLE(i * 3, 3);
    }
    rgba[i * 4 + 0] = extractChannel(pixel, rMask);
    rgba[i * 4 + 1] = extractChannel(pixel, gMask);
    rgba[i * 4 + 2] = extractChannel(pixel, bMask);
    rgba[i * 4 + 3] = hasAlpha ? extractChannel(pixel, aMask) : 255;
  }

  const png = writePngRgba(width, height, rgba);
  await fsp.writeFile(outputPath, png);
}

export async function fileIsEmpty(filePath: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(filePath);
    return stat.size === 0;
  } catch {
    return false;
  }
}
