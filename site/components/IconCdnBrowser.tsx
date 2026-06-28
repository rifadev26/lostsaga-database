"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
  AlertCircle,
  Copy,
  Check,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { IconCdnEntry } from "@/lib/ui-icons";

const PAGE_SIZE = 96;

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-center text-sm font-semibold text-foreground">
        Couldn&apos;t load icons
      </p>
      <p className="max-w-md text-center text-xs">{message}</p>
    </div>
  );
}

function getIconKey(entry: IconCdnEntry): string {
  return `${entry.imageset}#${entry.name}`;
}

function sortedIconKeys(entries: IconCdnEntry[]): string[] {
  return entries
    .filter((icon) => icon.width > 0 && icon.height > 0)
    .map(getIconKey)
    .sort((a, b) => a.localeCompare(b));
}

function buildIconMap(entries: IconCdnEntry[]): Map<string, IconCdnEntry> {
  const map = new Map<string, IconCdnEntry>();
  for (const entry of entries) {
    map.set(getIconKey(entry), entry);
  }
  return map;
}

export function IconCdnBrowser({
  initialData,
}: {
  initialData: IconCdnEntry[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const iconsByKey = useMemo(() => buildIconMap(initialData), [initialData]);
  const allKeys = useMemo(
    () => sortedIconKeys(initialData),
    [initialData],
  );

  const filteredKeys = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allKeys;
    return allKeys.filter((key) => key.toLowerCase().includes(q));
  }, [allKeys, query]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredKeys.length / PAGE_SIZE)),
    [filteredKeys.length],
  );

  const paginatedKeys = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredKeys.slice(start, start + PAGE_SIZE);
  }, [filteredKeys, page]);

  const selectedIcon = selectedKey
    ? iconsByKey.get(selectedKey) ?? null
    : null;

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
    setSelectedKey(null);
  };

  const clearQuery = () => {
    setQuery("");
    setPage(1);
    setSelectedKey(null);
  };

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      window.setTimeout(
        () => setCopiedKey((prev) => (prev === key ? null : prev)),
        1500,
      );
    } catch {
      // ignore
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(url);
      window.setTimeout(
        () => setCopiedKey((prev) => (prev === url ? null : prev)),
        1500,
      );
    } catch {
      // ignore
    }
  };

  if (initialData.length === 0) {
    return <ErrorState message="No icon data available." />;
  }

  return (
    <div className="space-y-6">
      <div className="ls-card space-y-4 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search icon keys (e.g. UIIconPack10#goods...)"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="border-2 border-[var(--border)] bg-[#0b1120] pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2">
            {query && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearQuery}
                className="gap-1"
              >
                <X className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">
            {filteredKeys.length.toLocaleString("en-US")}
          </span>{" "}
          of{" "}
          <span className="font-bold text-foreground">
            {allKeys.length.toLocaleString("en-US")}
          </span>{" "}
          individual CDN icons
          {query.trim() && " (filtered)"}
        </p>
      </div>

      {selectedIcon && (
        <section className="ls-card space-y-4 p-4">
          <div className="ls-section-header">
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm">Selected Icon</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
              {selectedIcon.width} × {selectedIcon.height}
            </span>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[#0b1120] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedIcon.iconPngUrl}
                alt={selectedKey ?? ""}
                className="max-h-full max-w-full object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
                  Key
                </p>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-[#0b1120] px-2 py-1 text-xs break-all">
                    {selectedKey}
                  </code>
                  <button
                    type="button"
                    onClick={() => selectedKey && void copyKey(selectedKey)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                    title="Copy key"
                  >
                    {copiedKey === selectedKey ? (
                      <Check className="h-3.5 w-3.5 text-[#22c55e]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
                  CDN URL
                </p>
                <div className="flex items-start gap-2">
                  <code className="block max-w-full truncate rounded bg-[#0b1120] px-2 py-1 text-[11px]">
                    {selectedIcon.iconPngUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyUrl(selectedIcon.iconPngUrl)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                    title="Copy URL"
                  >
                    {copiedKey === selectedIcon.iconPngUrl ? (
                      <Check className="h-3.5 w-3.5 text-[#22c55e]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {filteredKeys.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No icons match your search.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
            {paginatedKeys.map((key) => {
              const icon = iconsByKey.get(key);
              if (!icon) return null;
              const isSelected = selectedKey === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  className={`group relative flex aspect-square items-center justify-center rounded border-2 bg-[#0b1120] p-1 transition-colors hover:border-primary/50 ${
                    isSelected
                      ? "border-primary"
                      : "border-[var(--border)]"
                  }`}
                  title={key}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={icon.iconPngUrl}
                    alt={key}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="max-h-full max-w-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-bold text-foreground">{page}</span> of{" "}
              <span className="font-bold text-foreground">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || totalPages === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
