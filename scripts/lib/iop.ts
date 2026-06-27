import { inflateRaw } from "node:zlib";
import { promisify } from "node:util";
import { IOP_PASSWORDS, IOP_DATA_KEY } from "../config";

const inflateRawAsync = promisify(inflateRaw);

const SIG_LOCAL = Buffer.from("PK\x03\x04");
const SIG_CENTRAL = Buffer.from("PK\x01\x02");
const SIG_EOCD = Buffer.from("PK\x05\x06");
const SIG_DATA_DESCRIPTOR = Buffer.from("PK\x07\x08");

class ZipCrypto {
  private key0: bigint;
  private key1: bigint;
  private key2: bigint;
  private readonly crctable: Uint32Array;

  constructor(private readonly password: Buffer) {
    this.key0 = 0x12345678n;
    this.key1 = 0x23456789n;
    this.key2 = 0x34567890n;
    this.crctable = ZipCrypto.buildCrcTable();
    for (const b of password) {
      this.updateKeys(BigInt(b));
    }
  }

  private static buildCrcTable(): Uint32Array {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let crc = i;
      for (let j = 0; j < 8; j++) {
        crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
      }
      table[i] = crc >>> 0;
    }
    return table;
  }

  private updateKeys(c: bigint): void {
    this.key0 = ((this.key0 >> 8n) ^ BigInt(this.crctable[Number((this.key0 ^ c) & 0xffn)])) & 0xffffffffn;
    this.key1 = (this.key1 + (this.key0 & 0xffn)) & 0xffffffffn;
    this.key1 = (this.key1 * 134775813n + 1n) & 0xffffffffn;
    const k1High = this.key1 >> 24n;
    this.key2 = ((this.key2 >> 8n) ^ BigInt(this.crctable[Number((this.key2 ^ k1High) & 0xffn)])) & 0xffffffffn;
  }

  decrypt(data: Buffer): Buffer {
    const result = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
      const k = Number(this.key2 | 2n);
      const val = Number(((BigInt(k) * BigInt(k ^ 1)) >> 8n) & 0xffn);
      const c = data[i] ^ val;
      this.updateKeys(BigInt(c));
      result[i] = c;
    }
    return result;
  }
}

export interface IopEntry {
  filename: string;
  data: Buffer;
  isDirectory: boolean;
  passwordType: number;
  comment: string;
}

export interface ExtractOptions {
  // Reserved for future region support.
  password?: "kr" | "id" | "us" | "tw" | "sg" | "jp" | "th" | "cn" | "latin" | "eu";
}

function applySecondaryXor(data: Buffer): Buffer {
  const len = data.length;
  const result = Buffer.alloc(len);
  for (let i = 0; i < len; i++) {
    let b = data[i];
    b ^= IOP_DATA_KEY[i % IOP_DATA_KEY.length];
    b ^= IOP_DATA_KEY[(len - i) % IOP_DATA_KEY.length];
    result[i] = b;
  }
  return result;
}

async function tryDecompress(
  data: Buffer,
  method: number,
  expectedUncompressedSize?: number,
): Promise<Buffer | null> {
  if (method === 0) return data;
  if (method !== 8) return null;
  try {
    const result = await inflateRawAsync(data);
    if (
      expectedUncompressedSize !== undefined &&
      expectedUncompressedSize > 0 &&
      result.length !== expectedUncompressedSize
    ) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

function trimNulls(buf: Buffer): string {
  const idx = buf.indexOf(0);
  const slice = idx === -1 ? buf : buf.subarray(0, idx);
  return slice.toString("utf-8");
}

function splitBySignature(buf: Buffer, sig: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  let idx = buf.indexOf(sig);
  while (idx !== -1) {
    if (idx > start) {
      parts.push(buf.subarray(start, idx));
    }
    start = idx;
    idx = buf.indexOf(sig, start + sig.length);
  }
  if (start < buf.length) {
    parts.push(buf.subarray(start));
  }
  return parts.filter((b) => b.length >= 4);
}

/**
 * Extract all files from a Lost Saga `.iop` archive buffer.
 *
 * The format is a tweaked ZIP produced by the ZipArchive/Artpol library:
 * - The local header `version` field stores the real filename length.
 * - For encrypted entries, `flags` and `extra_len` are swapped and the
 *   standard sizes in the local header are zeroed out; the real values live
 *   in the central directory or data descriptor.
 * - Encryption is PKWARE ZipCrypto with one of two Korean passwords.
 * - Some entries are also XORed after inflation; this is indicated by a
 *   central-directory comment of "1".
 */
export async function extractIop(
  archive: Buffer,
  _options: ExtractOptions = {},
): Promise<IopEntry[]> {
  if (archive.length < 4 || archive.readUInt32LE(0) !== 0x04034b50) {
    throw new Error("Not an .iop archive (missing local file header signature)");
  }

  // Locate EOCD and split the archive into file entries and central directory.
  const eocdPos = archive.lastIndexOf(SIG_EOCD);
  if (eocdPos === -1) {
    throw new Error("Missing end-of-central-directory signature");
  }

  const preEocd = archive.subarray(0, eocdPos);
  const firstCdPos = preEocd.indexOf(SIG_CENTRAL);
  if (firstCdPos === -1) {
    throw new Error("Missing central directory signature");
  }

  const fileEntriesRaw = preEocd.subarray(0, firstCdPos);
  const centralEntriesRaw = preEocd.subarray(firstCdPos);

  const rawLocalEntries = splitBySignature(fileEntriesRaw, SIG_LOCAL);
  const rawCentralEntries = splitBySignature(centralEntriesRaw, SIG_CENTRAL);

  if (rawLocalEntries.length !== rawCentralEntries.length) {
    throw new Error(
      `Local/central entry count mismatch: ${rawLocalEntries.length} vs ${rawCentralEntries.length}`,
    );
  }

  const entries: IopEntry[] = [];

  for (let i = 0; i < rawLocalEntries.length; i++) {
    const local = rawLocalEntries[i];
    const central = rawCentralEntries[i];

    if (local.readUInt32LE(0) !== 0x04034b50) continue;

    // Local header layout:
    // sig(4) version(2) flags(2) method(2) modTime(2) modDate(2) crc(4) compSize(4) uncompSize(4) filenameLen(2) extraLen(2)
    let version = local.readUInt16LE(4);
    let flags = local.readUInt16LE(6);
    const method = local.readUInt16LE(8);
    const modTime = local.readUInt16LE(10);
    const modDate = local.readUInt16LE(12);
    let crc = local.readUInt32LE(14);
    let compSize = local.readUInt32LE(18);
    let uncompSize = local.readUInt32LE(22);
    const filenameLen = local.readUInt16LE(26);
    let extraLen = local.readUInt16LE(28);

    // .iop quirk: for encrypted entries, flags and extra_len are swapped.
    let encrypted = false;
    if (extraLen !== 0 && flags === 0) {
      encrypted = true;
      const realFlags = extraLen;
      extraLen = flags;
      flags = realFlags;
    }

    // .iop quirk: version stores the real filename length.
    const realFilenameLen = version;
    const filename = local.subarray(30, 30 + realFilenameLen).toString("utf-8");
    const isDirectory = filename.endsWith("/");

    // Parse the central directory entry.
    let comment = "";
    let passwordType = 0;
    if (central.readUInt32LE(0) === 0x02014b50) {
      // central: sig(4) versionMadeBy(2) versionNeeded(2) flags(2) method(2) modTime(2) modDate(2)
      //          crc(4) compSize(4) uncompSize(4) filenameLen(2) extraLen(2) commentLen(2)
      //          diskStart(2) intAttr(2) extAttr(4) relOffset(4)
      const cdFilenameLen = central.readUInt16LE(28);
      const cdCommentLen = central.readUInt16LE(32);
      comment = trimNulls(central.subarray(46 + cdFilenameLen, 46 + cdFilenameLen + cdCommentLen));
      passwordType = comment === "1" ? 1 : 0;

      // The real sizes live in the central directory when the local header
      // has them zeroed out (typical for encrypted .iop files).
      if (compSize === 0 && uncompSize === 0) {
        crc = central.readUInt32LE(16);
        compSize = central.readUInt32LE(20);
        uncompSize = central.readUInt32LE(24);
      }
    }

    // If the central directory did not provide sizes, read the data descriptor.
    if (encrypted && (compSize === 0 || uncompSize === 0) && local.length >= 16) {
      const ddPos = local.length - 16;
      if (local.compare(SIG_DATA_DESCRIPTOR, ddPos, ddPos + 4) === 0) {
        crc = local.readUInt32LE(ddPos + 4);
        compSize = local.readUInt32LE(ddPos + 8);
        uncompSize = local.readUInt32LE(ddPos + 12);
      }
    }

    const dataStart = 30 + realFilenameLen;
    const dataEnd = encrypted && compSize > 0
      ? dataStart + compSize
      : Math.max(dataStart, local.length - (encrypted ? 16 : 0));

    const fileData = local.subarray(dataStart, dataEnd);
    let decompressed: Buffer | null = null;

    if (isDirectory) {
      decompressed = Buffer.alloc(0);
    } else if (!encrypted) {
      decompressed = await tryDecompress(fileData, method, uncompSize);
    } else {
      // Try the passwords; the header checksum used by standard ZipCrypto is
      // unreliable for these .iop files, so we verify by attempting inflation.
      // Use the central directory's uncompressed size to reject false positives
      // where a wrong password happens to inflate to an empty buffer.
      const candidates = passwordType === 1
        ? [IOP_PASSWORDS.secondary, IOP_PASSWORDS.primary]
        : [IOP_PASSWORDS.primary, IOP_PASSWORDS.secondary];

      for (let p = 0; p < candidates.length; p++) {
        const decryptor = new ZipCrypto(candidates[p]);
        const decrypted = decryptor.decrypt(fileData);
        const payload = decrypted.subarray(12); // skip the 12-byte encryption header
        decompressed = await tryDecompress(payload, method, uncompSize);
        if (decompressed !== null) {
          break;
        }
      }
    }

    if (decompressed === null) {
      throw new Error(`Failed to decrypt/decompress ${filename}`);
    }

    // The secondary XOR is applied after extraction only to .ini files whose
    // archive comment is "1". This matches the client/patcher behavior (see
    // HTTPManager.cpp: DecryptFile is called for *.ini when comment == 1).
    if (passwordType === 1 && filename.toLowerCase().endsWith(".ini")) {
      decompressed = applySecondaryXor(decompressed);
    }

    entries.push({
      filename,
      data: decompressed,
      isDirectory,
      passwordType,
      comment,
    });
  }

  return entries;
}
