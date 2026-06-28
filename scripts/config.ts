// Central configuration for all data fetchers.
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

export const MAX_HERO = 938;
export const FETCH_CONCURRENCY = 20;
export const IMAGE_CONCURRENCY = 15;
export const IMAGE_TIMEOUT_MS = 15_000;

export const API_BASE = "https://apis.lostsaga.xyz";
export const DATA_DIR = path.join(ROOT_DIR, "data");
export const IMAGE_OUTPUT_DIR_REL = "data/images/heroes";
export const IMAGE_OUTPUT_DIR = path.join(ROOT_DIR, IMAGE_OUTPUT_DIR_REL);

// Source selection for local unpacked client vs remote patch server.
// LOCAL_UNPACKED_DIR: root of an unpacked Lost Saga client tree (e.g. D:\LostSaga\UNPACKED).
// SOURCE_MODE: "local" | "server" | "fallback". Defaults to "fallback" when LOCAL_UNPACKED_DIR is set.
export const LOCAL_UNPACKED_DIR = (process.env.LOCAL_UNPACKED_DIR ?? "").trim();
export const SOURCE_MODE = (process.env.SOURCE_MODE ?? "fallback").trim();

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
