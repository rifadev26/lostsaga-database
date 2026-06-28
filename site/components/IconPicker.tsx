"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { loadUIIcons, getIconKey, type UIIcon } from "@/lib/ui-icons";
import { Search, Loader2, ChevronDown, Check } from "lucide-react";

const MAX_RESULTS = 12;
const ROW_ICON_SIZE = 20;
const PREVIEW_SIZE = 64;

interface ImageSetBounds {
  width: number;
  height: number;
}

function FixedIconSprite({
  icon,
  size,
  bounds,
}: {
  icon: UIIcon;
  size: number;
  bounds: ImageSetBounds;
}) {
  const scale = size / Math.max(icon.width, icon.height);

  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0 overflow-hidden rounded border border-[var(--border)] bg-[#0b1120]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon.pngUrl}
        alt={icon.name}
        className="absolute left-0 top-0 max-w-none"
        style={{
          width: Math.floor(bounds.width * scale),
          height: Math.floor(bounds.height * scale),
          transform: `translate(${-Math.floor(icon.x * scale)}px, ${-Math.floor(icon.y * scale)}px)`,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  const [iconsByKey, setIconsByKey] = useState<Record<string, UIIcon>>({});
  const [allKeys, setAllKeys] = useState<string[]>([]);
  const [boundsByImageset, setBoundsByImageset] = useState<
    Record<string, ImageSetBounds>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadUIIcons()
      .then((map) => {
        if (cancelled) return;
        const icons = Object.values(map).filter(
          (icon) => icon.width > 0 && icon.height > 0,
        );
        const byKey: Record<string, UIIcon> = {};
        const keys: string[] = [];
        const bounds: Record<string, ImageSetBounds> = {};

        icons.forEach((icon) => {
          const key = getIconKey(icon);
          byKey[key] = icon;
          keys.push(key);

          if (!bounds[icon.imageset]) {
            bounds[icon.imageset] = { width: 0, height: 0 };
          }
          bounds[icon.imageset].width = Math.max(
            bounds[icon.imageset].width,
            icon.x + icon.width,
          );
          bounds[icon.imageset].height = Math.max(
            bounds[icon.imageset].height,
            icon.y + icon.height,
          );
        });

        keys.sort((a, b) => a.localeCompare(b));
        setIconsByKey(byKey);
        setAllKeys(keys);
        setBoundsByImageset(bounds);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load icons");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedIcon = useMemo(() => {
    if (!value) return null;
    return iconsByKey[value] ?? null;
  }, [iconsByKey, value]);

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

  const selectedBounds = selectedIcon
    ? boundsByImageset[selectedIcon.imageset]
    : null;

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
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : error ? (
            <div className="py-3 text-center text-xs text-destructive">
              {error}
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">
              No icons found
            </div>
          ) : (
            filteredKeys.map((key) => {
              const icon = iconsByKey[key];
              const bounds = boundsByImageset[icon.imageset];
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
                  <FixedIconSprite
                    icon={icon}
                    size={ROW_ICON_SIZE}
                    bounds={bounds}
                  />
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

      {selectedIcon && selectedBounds && (
        <div className="flex items-center gap-3 rounded-md border-2 border-[var(--border)] bg-[#0b1120] p-2">
          <FixedIconSprite
            icon={selectedIcon}
            size={PREVIEW_SIZE}
            bounds={selectedBounds}
          />
          <span className="truncate font-mono text-xs text-muted-foreground">
            {value}
          </span>
        </div>
      )}
    </div>
  );
}
