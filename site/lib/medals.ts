import type { ItemIcon } from "./items";

export interface Medal {
  id: number;
  section: string;
  itemType: number;
  name: string;
  limitLevel?: number;
  maxClass?: number;
  useClasses: number[];
  charGrowth: number[];
  itemGrowth: number[];
  iconKey?: string;
  subIconKey?: string;
  icon: ItemIcon | null;
  subIcon: ItemIcon | null;
  manualId: number;
  manual: string;
  sellPeso: number;
  enableSelectStat?: boolean;
  subMedalType?: number;
  totalPoint?: number;
  rawFields: Record<string, string>;
}
