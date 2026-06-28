import { ASSET_BASE } from "@/lib/data";

export interface UIIcon {
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
  images: UIIcon[];
}

export const UI_ICONS_JSON_URL = `${ASSET_BASE}data/ui-icons.json`;
export const UI_IMAGESET_JSON_URL = `${ASSET_BASE}data/ui-imageset.json`;

export type UIIconsMap = Record<string, UIIcon>;

let uiIconsPromise: Promise<UIIconsMap> | null = null;

export async function loadUIIcons(): Promise<UIIconsMap> {
  if (uiIconsPromise) return uiIconsPromise;

  uiIconsPromise = fetch(UI_ICONS_JSON_URL, { cache: "default" }).then(
    async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to load ui-icons.json (${res.status})`);
      }
      return (await res.json()) as UIIconsMap;
    },
  );

  return uiIconsPromise;
}

export function getIconKey(icon: UIIcon): string {
  return `${icon.imageset}#${icon.name}`;
}
