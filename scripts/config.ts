// Central configuration for all data parsers.
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, "..");

export const FETCH_CONCURRENCY = 20;
export const IMAGE_CONCURRENCY = 15;
export const IMAGE_TIMEOUT_MS = 15_000;

export const DATA_DIR = path.join(ROOT_DIR, "data");
export const SITE_DIR = path.join(ROOT_DIR, "site");
export const PUBLIC_DIR = path.join(SITE_DIR, "public");
export const ASSETS_REPO_DIR = path.join(ROOT_DIR, "..", "lostsaga-assets");
export const ASSETS_IMAGE_BASE_URL =
  "https://cdn.jsdelivr.net/gh/rifadev26/lostsaga-assets@main/images";

// ZipCrypto passwords for Lost Saga .iop archives (Korean client).
export const IOP_PASSWORDS = {
  primary: Buffer.from("iosuccess#@"),
  secondary: Buffer.from("XrFrI0%3BF%!0Dcx$30-"),
};

// Secondary XOR key table from ioLocalParent.cpp (bPassword = false -> data key).
// The C++ array is [MAX_KEY = 30]; the 30th byte is implicitly zero.
export const IOP_DATA_KEY = Uint8Array.from([
  48, 29, 96, 1, 9, 48, 57, 213, 178, 123, 67, 90, 2, 4, 254, 255, 6, 8, 9, 23,
  90, 44, 214, 199, 108, 119, 3, 2, 2, 0,
]);

/**
 * Server List
 */

export interface ServerConfig {
  id: number;
  alias: string; // used for slug and folder name
  name: string;
  /** Absolute root path of the unpacked client, using forward slashes. */
  root: string;
  isPrivate?: boolean;
  active?: boolean;
}

export const SERVERLIST: ServerConfig[] = [
  {
    id: 1,
    alias: "LSK",
    name: "Korea LS",
    root: "D:/LostSaga/UNPACKED/KOREA",
    active: true,
  },
  {
    id: 2,
    alias: "LSO",
    name: "Origin LS",
    root: "D:/LostSaga/UNPACKED/LSO",
  },
  {
    id: 3,
    alias: "RUBY",
    name: "RUBY LS",
    root: "D:/LostSaga/UNPACKED/RUBY",
    active: true,
  },
  {
    id: 4,
    alias: "EXOTIC",
    name: "EXOTIC REBORN",
    root: "D:/LostSaga/UNPACKED/EXOTIC",
    active: true,
  },
  {
    id: 5,
    alias: "THAILAND",
    name: "THAILAND LS",
    root: "D:/LostSaga/UNPACKED/THAILAND",
    active: true,
  },
  {
    id: 6,
    alias: "REBIRTH",
    name: "REBIRTH LS",
    root: "D:/LostSaga/UNPACKED/REBIRTH",
    active: true,
  },
];

export function getActiveServers(): ServerConfig[] {
  return SERVERLIST.filter((s) => s.active !== false);
}

export function getServerByAlias(alias: string): ServerConfig | undefined {
  return SERVERLIST.find(
    (s) => s.alias.toLowerCase() === alias.toLowerCase(),
  );
}

/** e.g. D:/LostSaga/UNPACKED/KOREA/config */
export function getServerConfigDir(alias: string): string {
  const server = getServerByAlias(alias);
  if (!server) throw new Error(`Unknown server alias: ${alias}`);
  return path.join(server.root, "config");
}

/** e.g. D:/LostSaga/UNPACKED/KOREA/xml */
export function getServerXmlDir(alias: string): string {
  const server = getServerByAlias(alias);
  if (!server) throw new Error(`Unknown server alias: ${alias}`);
  return path.join(server.root, "xml");
}

/** e.g. D:/LostSaga/UNPACKED/KOREA/_map */
export function getServerMapDir(alias: string): string {
  const server = getServerByAlias(alias);
  if (!server) throw new Error(`Unknown server alias: ${alias}`);
  return path.join(server.root, "_map");
}

/** e.g. <repo>/data/LSK */
export function getServerDataDir(alias: string): string {
  return path.join(DATA_DIR, alias);
}

/** e.g. <assets-repo>/images/LSK */
export function getServerPublicImageDir(alias: string): string {
  return path.join(ASSETS_REPO_DIR, "images", alias);
}

/** CDN URL for a server image, e.g. https://cdn.jsdelivr.net/gh/.../LSK/icon/foo%23bar.png */
export function getServerImageUrl(
  alias: string,
  ...segments: string[]
): string {
  return (
    ASSETS_IMAGE_BASE_URL +
    "/" +
    path.posix.join(alias, ...segments.map(encodeURIComponent))
  );
}
