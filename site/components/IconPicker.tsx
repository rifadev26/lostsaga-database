"use client";

import { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { getIconKey, type IconCdnEntry, type IconCdnMap } from "@/lib/ui-icons";
import { Search, ChevronDown, Check } from "lucide-react";

const MAX_RESULTS = 12;
const ROW_ICON_SIZE = 20;
const PREVIEW_SIZE = 64;

function CdnIconThumb({
  icon,
  size,
}: {
  icon: IconCdnEntry;
  size: number;
}) {
  const scale = Math.min(
    size / Math.max(icon.width, icon.height, 1),
    1,
  );
  const width = Math.floor(icon.width * scale);
  const height = Math.floor(icon.height * scale);

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded border border-[var(--border)] bg-[#0b1120]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon.iconPngUrl}
        alt={icon.name}
        width={width}
        height={height}
        className="max-h-full max-w-full object-contain"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

export function IconPicker({
  icons,
  value,
  onChange,
}: {
  icons: IconCdnMap;
  value: string;
  onChange: (key: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const allKeys = useMemo(() => {
    const keys: string[] = [];
    for (const icon of Object.values(icons)) {
      if (icon.width > 0 && icon.height > 0) {
        keys.push(getIconKey(icon));
      }
    }
    keys.sort((a, b) => a.localeCompare(b));
    return keys;
  }, [icons]);

  const selectedIcon = useMemo(() => {
    if (!value) return null;
    return icons[value] ?? null;
  }, [icons, value]);

  const filteredKeys = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return allKeys.slice(0, MAX_RESULTS);
    return allKeys
      .filter((key) => key.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [allKeys, value]);

  const handleSelect = (key: string) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search icon keys (e.g. UIIconPack10#goods...)"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          className="h-10 border-2 border-[var(--border)] bg-[#0b1120] pl-9 pr-10 text-sm"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-[#172540] hover:text-foreground"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div className="max-h-44 overflow-auto rounded-md border-2 border-[var(--border)] bg-[#111a2e] py-1">
          {filteredKeys.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">
              No icons found
            </div>
          ) : (
            filteredKeys.map((key) => {
              const icon = icons[key];
              const isSelected = value === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`flex h-9 w-full items-center gap-3 px-3 text-left transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-[#172540]"
                  }`}
                >
                  <CdnIconThumb icon={icon} size={ROW_ICON_SIZE} />
                  <span className="flex-1 truncate font-mono text-[11px]">
                    {key}
                  </span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {selectedIcon && (
        <div className="flex items-center gap-3 rounded-md border-2 border-[var(--border)] bg-[#0b1120] p-2">
          <CdnIconThumb icon={selectedIcon} size={PREVIEW_SIZE} />
          <span className="truncate font-mono text-xs text-muted-foreground">
            {value}
          </span>
        </div>
      )}
    </div>
  );
}
