import { ASSET_BASE } from "@/lib/data";

export interface UIIcon {
  id: number;
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

export interface UIImageset {
  name: string;
  ddsFile: string;
  pngFile: string;
  pngUrl: string;
  images: Omit<UIIcon, "imageset">[];
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

export type UIIconsMap = Record<string, UIIcon>;
export type IconCdnMap = Record<string, IconCdnEntry>;

export const UI_ICONS_JSON_URL = `${ASSET_BASE}data/ui-icons.json`;
export const UI_IMAGESET_JSON_URL = `${ASSET_BASE}data/ui-imageset.json`;

let uiIconsPromise: Promise<UIIconsMap> | null = null;

function buildIconMap(icons: UIIcon[]): UIIconsMap {
  const map: UIIconsMap = {};
  for (const icon of icons) {
    map[`${icon.imageset}#${icon.name}`] = icon;
  }
  return map;
}

export async function loadUIIcons(): Promise<UIIconsMap> {
  if (uiIconsPromise) return uiIconsPromise;

  uiIconsPromise = fetch(UI_ICONS_JSON_URL, { cache: "default" })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to load ui-icons.json (${res.status})`);
      }
      const icons = (await res.json()) as UIIcon[];
      return buildIconMap(icons);
    });

  return uiIconsPromise;
}

export function getIconKey(icon: UIIcon): string {
  return `${icon.imageset}#${icon.name}`;
}
