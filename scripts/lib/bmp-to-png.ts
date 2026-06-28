import fsp from "node:fs/promises";
import { writePngRgba } from "./dds-to-png";

function isPow2(n: number): boolean {
  return (n & (n - 1)) === 0;
}

async function readBmp(inputPath: string): Promise<{
  width: number;
  height: number;
  rgba: Buffer;
}> {
  const buf = await fsp.readFile(inputPath);
  if (buf.length < 54 || buf.readUInt16LE(0) !== 0x4d42) {
    throw new Error("Invalid BMP magic");
  }

  const dataOffset = buf.readUInt32LE(10);
  const dibSize = buf.readUInt32LE(14);
  const width = buf.readInt32LE(18);
  const height = Math.abs(buf.readInt32LE(22));
  const bpp = buf.readUInt16LE(28);
  const compression = buf.readUInt32LE(30);

  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid BMP dimensions: ${width}x${height}`);
  }

  if (compression !== 0) {
    throw new Error(`Unsupported BMP compression: ${compression}`);
  }

  if (dibSize < 40) {
    throw new Error(`Unsupported DIB header size: ${dibSize}`);
  }

  const topDown = buf.readInt32LE(22) < 0;

  const rgba = Buffer.alloc(width * height * 4);

  if (bpp === 24) {
    const rowSize = Math.ceil((width * 3) / 4) * 4;
    for (let y = 0; y < height; y++) {
      const srcY = topDown ? y : height - 1 - y;
      const rowStart = dataOffset + srcY * rowSize;
      for (let x = 0; x < width; x++) {
        const srcIdx = rowStart + x * 3;
        const dstIdx = (y * width + x) * 4;
        rgba[dstIdx + 0] = buf[srcIdx + 2]!; // R
        rgba[dstIdx + 1] = buf[srcIdx + 1]!; // G
        rgba[dstIdx + 2] = buf[srcIdx + 0]!; // B
        rgba[dstIdx + 3] = 255; // A
      }
    }
  } else if (bpp === 32) {
    const rowSize = width * 4;
    for (let y = 0; y < height; y++) {
      const srcY = topDown ? y : height - 1 - y;
      const rowStart = dataOffset + srcY * rowSize;
      for (let x = 0; x < width; x++) {
        const srcIdx = rowStart + x * 4;
        const dstIdx = (y * width + x) * 4;
        rgba[dstIdx + 0] = buf[srcIdx + 2]!; // R
        rgba[dstIdx + 1] = buf[srcIdx + 1]!; // G
        rgba[dstIdx + 2] = buf[srcIdx + 0]!; // B
        rgba[dstIdx + 3] = buf[srcIdx + 3]!; // A
      }
    }
  } else {
    throw new Error(`Unsupported BMP bit depth: ${bpp}`);
  }

  return { width, height, rgba };
}

export async function convertBmpToPng(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const { width, height, rgba } = await readBmp(inputPath);
  const png = writePngRgba(width, height, rgba);
  await fsp.writeFile(outputPath, png);
}
