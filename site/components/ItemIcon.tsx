"use client";

import Image from "next/image";
import type { ItemIcon } from "@/lib/items";

interface ItemIconProps {
  icon: ItemIcon;
  maxSize?: number;
  className?: string;
}

export function ItemIcon({ icon, maxSize = 48, className }: ItemIconProps) {
  const maxDim = Math.max(icon.width, icon.height);
  const scale = maxDim > maxSize ? maxSize / maxDim : 1;
  const scaledWidth = Math.max(1, Math.round(icon.width * scale));
  const scaledHeight = Math.max(1, Math.round(icon.height * scale));

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        width: scaledWidth,
        height: scaledHeight,
      }}
    >
      <Image
        src={icon.pngUrl}
        alt={icon.name}
        width={scaledWidth}
        height={scaledHeight}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="object-contain"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
