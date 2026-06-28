import fsp from "node:fs/promises";
import path from "node:path";
import { LOCAL_UNPACKED_DIR, SOURCE_MODE } from "../config";
import {
  PatchEntry,
  downloadAndExtractManifest,
  readCachedOrDownload,
} from "./patch-manifest";
import { exists } from "./utils";

/**
 * Data source abstraction for the Lost Saga client assets.
 *
 * The pipeline can run against:
 * - the remote patch server (original behavior)
 * - a local unpacked client tree
 * - a local-first fallback (try local, then server)
 */
export interface GameSource {
  readonly name: string;

  /**
   * Resolve the patch manifest. For the server this downloads server_patch.cfg.iop;
   * for a local source this may be empty or derived from a local scan.
   */
  getManifest(): Promise<Map<string, PatchEntry>>;

  /** Read an .iop archive by its logical patch path, e.g. "xml/uiimageset.xml.iop". */
  readIop(remotePath: string): Promise<Buffer>;

  /**
   * Read an already-extracted raw asset by logical patch path.
   * Returns null if the asset is not available as a plain file (e.g. on the server).
   */
  readAsset(logicalPath: string): Promise<Buffer | null>;

  /**
   * Try to find an extracted texture file (e.g. .dds) by its filename.
   * Local sources check the common texture directories; server sources return null.
   */
  resolveTextureFile(fileName: string): Promise<Buffer | null>;
}

/** Server patch source: download .iop archives from the official CDN. */
export class PatchServerSource implements GameSource {
  name = "patch-server";

  async getManifest(): Promise<Map<string, PatchEntry>> {
    return downloadAndExtractManifest();
  }

  async readIop(remotePath: string): Promise<Buffer> {
    return readCachedOrDownload(remotePath);
  }

  async readAsset(): Promise<Buffer | null> {
    return null;
  }

  async resolveTextureFile(): Promise<Buffer | null> {
    return null;
  }
}

/** Local unpacked source: read from a local client tree mirroring patch paths. */
export class LocalUnpackedSource implements GameSource {
  name = "local-unpacked";

  constructor(private readonly baseDir: string) {}

  private fullPath(logicalPath: string): string {
    return path.join(this.baseDir, ...logicalPath.split("/"));
  }

  async getManifest(): Promise<Map<string, PatchEntry>> {
    // Local unpacked trees already have the files extracted, so a manifest is not
    // required. Future enhancements could scan for .iop files and build one.
    return new Map();
  }

  async readIop(remotePath: string): Promise<Buffer> {
    return fsp.readFile(this.fullPath(remotePath));
  }

  async readAsset(logicalPath: string): Promise<Buffer | null> {
    const filePath = this.fullPath(logicalPath);
    if (await exists(filePath)) {
      return fsp.readFile(filePath);
    }
    return null;
  }

  async resolveTextureFile(fileName: string): Promise<Buffer | null> {
    const candidates = [
      `_map/resource/texture/${fileName}`,
      `resource/texture/${fileName}`,
      fileName,
    ];

    for (const candidate of candidates) {
      const data = await this.readAsset(candidate);
      if (data !== null) {
        return data;
      }
    }
    return null;
  }
}

/** Local-first fallback: prefer local files; fall back to the patch server on misses. */
export class FallbackSource implements GameSource {
  name = "fallback";

  constructor(
    private local: LocalUnpackedSource,
    private server: PatchServerSource,
  ) {}

  async getManifest(): Promise<Map<string, PatchEntry>> {
    const localManifest = await this.local.getManifest();
    if (localManifest.size > 0) {
      return localManifest;
    }
    return this.server.getManifest();
  }

  async readIop(remotePath: string): Promise<Buffer> {
    try {
      return await this.local.readIop(remotePath);
    } catch {
      return this.server.readIop(remotePath);
    }
  }

  async readAsset(logicalPath: string): Promise<Buffer | null> {
    return this.local.readAsset(logicalPath);
  }

  async resolveTextureFile(fileName: string): Promise<Buffer | null> {
    return this.local.resolveTextureFile(fileName);
  }
}

/** Returns the active GameSource based on environment configuration. */
export function getSource(): GameSource {
  const server = new PatchServerSource();

  if (!LOCAL_UNPACKED_DIR) {
    if (SOURCE_MODE === "local") {
      throw new Error("SOURCE_MODE=local requires LOCAL_UNPACKED_DIR to be set");
    }
    return server;
  }

  const local = new LocalUnpackedSource(LOCAL_UNPACKED_DIR);

  if (SOURCE_MODE === "local") {
    return local;
  }
  if (SOURCE_MODE === "server") {
    return server;
  }
  return new FallbackSource(local, server);
}
