"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
  Loader2,
  AlertCircle,
  LayoutGrid,
  ArrowLeft,
  Copy,
  Check,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  UIIcon,
  UIImageset,
  UI_ICONS_JSON_URL,
  UI_IMAGESET_JSON_URL,
} from "@/lib/ui-icons";

const IMAGESET_PAGE_SIZE = 48;

function IconSprite({ icon }: { icon: UIIcon }) {
  return (
    <div
      className="ls-image-frame inline-flex overflow-hidden"
      style={{
        width: icon.width,
        height: icon.height,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon.pngUrl}
        alt={`${icon.imageset}#${icon.name}`}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{
          width: icon.width,
          height: icon.height,
          objectFit: "none",
          objectPosition: `${-icon.x}px ${-icon.y}px`,
          imageRendering: "pixelated",
        }}
        className="shrink-0"
      />
    </div>
  );
}

function IconKey({ icon }: { icon: UIIcon }) {
  return (
    <span className="font-mono text-xs">
      {icon.imageset}#{icon.name}
    </span>
  );
}

interface SheetOverlayProps {
  icon: UIIcon;
  sheetSize: { width: number; height: number };
}

function SheetOverlay({ icon, sheetSize }: SheetOverlayProps) {
  const left = Math.max(0, Math.min(100, (icon.x / sheetSize.width) * 100));
  const top = Math.max(0, Math.min(100, (icon.y / sheetSize.height) * 100));
  const width = Math.max(
    0,
    Math.min(100 - left, (icon.width / sheetSize.width) * 100),
  );
  const height = Math.max(
    0,
    Math.min(100 - top, (icon.height / sheetSize.height) * 100),
  );

  return (
    <div
      className="pointer-events-none absolute border-2 border-[#facc15] bg-[#facc15]/20"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
    >
      <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-[#facc15] px-1.5 py-0.5 text-[10px] font-bold text-[#0b1120]">
        {icon.name}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-semibold">Loading UI icon data...</p>
    </div>
  );
}

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

export function IconBrowser() {
  const [iconsByImageset, setIconsByImageset] = useState<
    Record<string, UIIcon[]>
  >({});
  const [imagesets, setImagesets] = useState<string[]>([]);
  const [imagesetDetails, setImagesetDetails] = useState<
    Record<string, UIImageset>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [imagesetPage, setImagesetPage] = useState(1);
  const [selectedImageset, setSelectedImageset] = useState<string | null>(null);
  const [selectedIconKey, setSelectedIconKey] = useState<string | null>(null);
  const [sheetSize, setSheetSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [iconsRes, imagesetRes] = await Promise.all([
          fetch(UI_ICONS_JSON_URL, { cache: "default" }),
          fetch(UI_IMAGESET_JSON_URL, { cache: "default" }),
        ]);

        if (!iconsRes.ok) {
          throw new Error(`Failed to load ui-icons.json (${iconsRes.status})`);
        }
        if (!imagesetRes.ok) {
          throw new Error(
            `Failed to load ui-imageset.json (${imagesetRes.status})`,
          );
        }

        const [iconsMap, imagesetArray]: [
          Record<string, UIIcon>,
          UIImageset[],
        ] = await Promise.all([iconsRes.json(), imagesetRes.json()]);

        if (cancelled) return;

        const grouped: Record<string, UIIcon[]> = {};
        Object.values(iconsMap)
          .filter((icon) => icon.width > 0 && icon.height > 0)
          .forEach((icon) => {
            if (!grouped[icon.imageset]) grouped[icon.imageset] = [];
            grouped[icon.imageset].push(icon);
          });

        Object.keys(grouped).forEach((key) => {
          grouped[key].sort((a, b) => a.name.localeCompare(b.name));
        });

        const imagesetMap: Record<string, UIImageset> = {};
        imagesetArray.forEach((set) => {
          imagesetMap[set.name] = set;
        });

        const imagesetNames = Object.keys(grouped).sort((a, b) =>
          a.localeCompare(b),
        );

        setIconsByImageset(grouped);
        setImagesetDetails(imagesetMap);
        setImagesets(imagesetNames);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "An unexpected error occurred while loading icon data.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredImagesets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return imagesets;
    return imagesets.filter((name) => name.toLowerCase().includes(q));
  }, [imagesets, query]);

  const totalImagesetPages = useMemo(
    () => Math.max(1, Math.ceil(filteredImagesets.length / IMAGESET_PAGE_SIZE)),
    [filteredImagesets.length],
  );

  const paginatedImagesets = useMemo(() => {
    const start = (imagesetPage - 1) * IMAGESET_PAGE_SIZE;
    return filteredImagesets.slice(start, start + IMAGESET_PAGE_SIZE);
  }, [filteredImagesets, imagesetPage]);

  const selectedIcons = useMemo(() => {
    if (!selectedImageset) return [];
    return iconsByImageset[selectedImageset] ?? [];
  }, [iconsByImageset, selectedImageset]);

  const filteredIcons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return selectedIcons;
    return selectedIcons.filter((icon) => icon.name.toLowerCase().includes(q));
  }, [selectedIcons, query]);

  const selectedIcon = useMemo(() => {
    if (!selectedIconKey || !selectedImageset) return null;
    return (
      iconsByImageset[selectedImageset]?.find(
        (icon) => `${icon.imageset}#${icon.name}` === selectedIconKey,
      ) ?? null
    );
  }, [iconsByImageset, selectedIconKey, selectedImageset]);

  const selectedImagesetPngUrl = selectedImageset
    ? imagesetDetails[selectedImageset]?.pngUrl
    : null;

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setImagesetPage(1);
  };

  const clearQuery = () => {
    setQuery("");
    setImagesetPage(1);
  };

  const selectImageset = (name: string) => {
    setSelectedImageset(name);
    setSelectedIconKey(null);
    setSheetSize(null);
    setQuery("");
    setImagesetPage(1);
  };

  const backToImagesets = () => {
    setSelectedImageset(null);
    setSelectedIconKey(null);
    setSheetSize(null);
    setQuery("");
    setImagesetPage(1);
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

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  // Imageset selection screen
  if (!selectedImageset) {
    return (
      <div className="space-y-6">
        <div className="ls-card space-y-4 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search imagesets..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="border-2 border-[var(--border)] bg-[#0b1120] pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary/50"
              />
            </div>

            {query && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearQuery}
                className="shrink-0 gap-1"
              >
                <X className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">
              {filteredImagesets.length.toLocaleString()}
            </span>{" "}
            of{" "}
            <span className="font-bold text-foreground">
              {imagesets.length.toLocaleString()}
            </span>{" "}
            imagesets
            {query.trim() && " (filtered)"}
          </p>
        </div>

        {filteredImagesets.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No imagesets match your search.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {paginatedImagesets.map((name) => {
                const count = iconsByImageset[name]?.length ?? 0;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectImageset(name)}
                    className="ls-card flex flex-col items-start gap-2 p-4 text-left transition-transform"
                  >
                    <div className="flex w-full items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                      <span className="break-all text-sm font-bold text-foreground">
                        {name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {count.toLocaleString()} icon{count !== 1 ? "s" : ""}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page{" "}
                <span className="font-bold text-foreground">
                  {imagesetPage}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">
                  {totalImagesetPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImagesetPage((p) => Math.max(1, p - 1))}
                  disabled={imagesetPage === 1 || totalImagesetPages === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setImagesetPage((p) => Math.min(totalImagesetPages, p + 1))
                  }
                  disabled={
                    imagesetPage === totalImagesetPages ||
                    totalImagesetPages === 1
                  }
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

  // Sheet inspector screen
  return (
    <div className="space-y-6">
      <div className="ls-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={backToImagesets}
            className="mb-1 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to imagesets
          </Button>
          <h2 className="break-all text-lg font-black text-foreground">
            {selectedImageset}
          </h2>
          <p className="text-xs text-muted-foreground">
            {selectedIcons.length.toLocaleString()} icon
            {selectedIcons.length !== 1 ? "s" : ""} in this sheet
          </p>
        </div>
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter icons by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-2 border-[var(--border)] bg-[#0b1120] pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary/50"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_450px]">
        <div className="space-y-6 lg:sticky lg:top-4 lg:h-fit lg:self-start">
          {selectedImagesetPngUrl && (
            <section className="ls-card space-y-4 p-4">
              <div className="ls-section-header">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm">Sprite Sheet</span>
                {selectedIcon && (
                  <span className="ml-auto text-[10px] font-bold text-[#facc15]">
                    Selected: {selectedIcon.name}
                  </span>
                )}
              </div>

              <div className="flex justify-center overflow-auto rounded-lg bg-[#0b1120]">
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImagesetPngUrl}
                    alt={selectedImageset}
                    className="max-h-[70vh] max-w-full object-contain"
                    onLoad={(e) =>
                      setSheetSize({
                        width: e.currentTarget.naturalWidth,
                        height: e.currentTarget.naturalHeight,
                      })
                    }
                  />
                  {selectedIcon && sheetSize && (
                    <SheetOverlay icon={selectedIcon} sheetSize={sheetSize} />
                  )}
                </div>
              </div>

              {selectedIcon ? (
                <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-[var(--border)] bg-[#0b1120] p-4 sm:flex-row sm:justify-between">
                  <div className="text-center sm:text-left">
                    <p className="break-all text-xs font-bold text-foreground">
                      <IconKey icon={selectedIcon} />
                    </p>
                    <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[11px]">
                      <span className="text-muted-foreground">Position</span>
                      <span className="tabular-nums text-foreground">
                        {selectedIcon.x}, {selectedIcon.y}
                      </span>
                      <span className="text-muted-foreground">Size</span>
                      <span className="tabular-nums text-foreground">
                        {selectedIcon.width} × {selectedIcon.height}
                      </span>
                    </div>
                  </div>
                  <div className="max-h-[240px] max-w-full overflow-auto">
                    <IconSprite icon={selectedIcon} />
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Click an icon row to preview it on the sheet.
                </p>
              )}
            </section>
          )}
        </div>

        <section className="ls-card overflow-hidden">
          <div className="ls-section-header rounded-none border-b-2 border-[var(--border)]">
            <LayoutGrid className="h-4 w-4" />
            <span className="text-sm">Icon Keys</span>
            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">
              {filteredIcons.length.toLocaleString()}
            </span>
          </div>

          <div className="max-h-[75vh] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-[#0b1120]">
                <tr className="border-b border-[var(--border)] text-muted-foreground">
                  <th className="px-4 py-2 font-bold">Key</th>
                  <th className="px-2 py-2 font-bold">X</th>
                  <th className="px-2 py-2 font-bold">Y</th>
                  <th className="px-2 py-2 font-bold">W</th>
                  <th className="px-2 py-2 font-bold">H</th>
                  <th className="px-4 py-2 font-bold">Copy</th>
                </tr>
              </thead>
              <tbody>
                {filteredIcons.map((icon) => {
                  const key = `${icon.imageset}#${icon.name}`;
                  const isSelected = selectedIconKey === key;
                  return (
                    <tr
                      key={key}
                      onClick={() => setSelectedIconKey(key)}
                      className={`cursor-pointer border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-white/5 ${
                        isSelected ? "bg-[#facc15]/10" : ""
                      }`}
                    >
                      <td className="px-4 py-2 font-mono font-medium text-foreground">
                        {icon.name}
                      </td>
                      <td className="px-2 py-2 tabular-nums text-muted-foreground">
                        {icon.x}
                      </td>
                      <td className="px-2 py-2 tabular-nums text-muted-foreground">
                        {icon.y}
                      </td>
                      <td className="px-2 py-2 tabular-nums text-muted-foreground">
                        {icon.width}
                      </td>
                      <td className="px-2 py-2 tabular-nums text-muted-foreground">
                        {icon.height}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void copyKey(key);
                          }}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                          title="Copy key"
                        >
                          {copiedKey === key ? (
                            <Check className="h-3.5 w-3.5 text-[#22c55e]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
