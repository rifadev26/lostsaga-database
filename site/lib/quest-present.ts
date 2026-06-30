export interface QuestPresentInfo {
  index: number;
  type: number;
  value1: number;
  value2: number;
  period: number;
}

export const PRESENT_TYPE_LABELS: Record<number, string> = {
  1: "Peso",
  2: "Costume",
  3: "Accessory",
  4: "Item",
  5: "Soldier",
  6: "Costume Box",
  7: "Costume (Timed)",
  8: "Token",
  9: "Medal",
};

export function getPresentTypeLabel(type: number): string {
  return PRESENT_TYPE_LABELS[type] ?? `Unknown (${type})`;
}

export function formatPresentLabel(present: QuestPresentInfo): string {
  switch (present.type) {
    case 1:
      return `${present.value1.toLocaleString()} Peso`;
    case 5:
      return `Soldier #${present.value1}`;
    case 8:
      return `${present.value1.toLocaleString()} Token`;
    case 2:
    case 7:
      return present.period > 0
        ? `${getPresentTypeLabel(present.type)} #${present.value1} (${present.period}d)`
        : `${getPresentTypeLabel(present.type)} #${present.value1}`;
    case 9:
      return `Medal #${present.value1}`;
    default:
      return `${getPresentTypeLabel(present.type)} #${present.value1}`;
  }
}

export function formatPresentSubLabel(present: QuestPresentInfo): string {
  if (present.value2 === 0) return "";
  return `#${present.value2}`;
}
