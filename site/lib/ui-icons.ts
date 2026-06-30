export interface UIIcon {
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

interface IconWithKey {
  imageset: string;
  name: string;
}

export function buildIconMap<T extends IconWithKey>(icons: T[]): Record<string, T> {
  const map: Record<string, T> = {};
  for (const icon of icons) {
    map[`${icon.imageset}#${icon.name}`] = icon;
  }
  return map;
}

export function getIconKey<T extends IconWithKey>(icon: T): string {
  return `${icon.imageset}#${icon.name}`;
}
