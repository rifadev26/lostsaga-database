"use client";

import Link from "next/link";
import { ItemIcon } from "./ItemIcon";
import type { ItemIcon as ItemIconType } from "@/lib/items";
import { Box } from "lucide-react";

interface PreviewCardProps {
  href: string;
  name: string;
  icon: ItemIconType | null;
  label?: string;
}

export function PreviewCard({
  href,
  name,
  icon,
  label = "View",
}: PreviewCardProps) {
  return (
    <Link href={href} prefetch={false} className="group block">
      <div className="ls-card flex h-full flex-col overflow-hidden">
        <div className="ls-image-frame relative flex aspect-square w-full shrink-0 items-center justify-center">
          {icon ? (
            <div className="relative flex items-center justify-center p-4">
              <ItemIcon icon={icon} maxSize={96} />
            </div>
          ) : (
            <Box className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <div className="border-t-2 border-black/5 bg-[#0e1626] px-3 py-2 text-center">
          <p
            className="truncate text-xs font-medium text-foreground"
            title={name}
          >
            {name}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-center border-t-2 border-black/5 bg-[#0c1322] px-3 py-2">
          <span className="ls-btn-green h-7 w-full text-xs">{label}</span>
        </div>
      </div>
    </Link>
  );
}
