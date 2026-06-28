import type { ItemIcon } from "./items";

export type PetIcon = ItemIcon;

export interface PetView {
  rank: number;
  name: string;
  iconKey: string;
  icon: PetIcon | null;
  model: string;
  scale: { x: number; y: number; z: number };
  ani: string;
}

export interface Pet {
  id: number;
  section: string;
  baseRank: number;
  maxRank: number;
  manualId: number;
  manual: string;
  needMaterial?: number;
  views: PetView[];
  baseStatGrowth: number[];
  addStatTypes: number[];
  rawFields: Record<string, string>;
}

export interface PetFeedRank {
  rank: number;
  maxLevel: number;
  materials: number[];
}

export interface PetManual {
  id: number;
  text: string;
  rawSegments: Array<{
    lineNo: number;
    segmentNo: number;
    text: string;
  }>;
}
