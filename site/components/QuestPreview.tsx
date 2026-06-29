"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { type Quest } from "@/lib/quest";
import {
  type QuestPresentInfo,
  formatPresentLabel,
} from "@/lib/quest-present";
import { type IconCdnEntry, type IconCdnMap } from "@/lib/ui-icons";
import {
  Coins,
  Shirt,
  Gem,
  Package,
  User,
  Gift,
  Clock,
  CircleDollarSign,
  Award,
  HelpCircle,
  X,
  Calendar,
} from "lucide-react";

interface QuestPreviewProps {
  quest: Quest;
  presents: Record<number, QuestPresentInfo>;
  icons: IconCdnMap;
}

const PRESENT_ICONS: Record<number, React.ElementType> = {
  1: Coins,
  2: Shirt,
  3: Gem,
  4: Package,
  5: User,
  6: Gift,
  7: Clock,
  8: CircleDollarSign,
  9: Award,
};

const PRESENT_COLORS: Record<number, string> = {
  1: "text-yellow-600",
  2: "text-purple-600",
  3: "text-cyan-600",
  4: "text-green-600",
  5: "text-orange-600",
  6: "text-pink-600",
  7: "text-purple-500",
  8: "text-amber-600",
  9: "text-blue-600",
};

function formatDate(date: { year: number; month: number; date: number; hour: number }) {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.date).padStart(2, "0")} ${String(date.hour).padStart(2, "0")}:00`;
}

function CdnIconImage({
  icon,
  size,
}: {
  icon: IconCdnEntry;
  size: number;
}) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon.iconPngUrl}
        alt={icon.name}
        className="max-h-full max-w-full object-contain"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

function QuestIconSprite({
  icons,
  iconKey,
  subIconKey,
  size = 72,
}: {
  icons: IconCdnMap;
  iconKey: string;
  subIconKey?: string;
  size?: number;
}) {
  const icon = iconKey ? icons[iconKey] : undefined;
  const subIcon = subIconKey ? icons[subIconKey] : undefined;

  if (!icon) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-black/10 text-amber-900/40"
        style={{ width: size, height: size }}
      >
        <HelpCircle className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <CdnIconImage icon={icon} size={size} />
      {subIcon && (
        <div className="absolute left-0 top-0 opacity-90">
          <CdnIconImage icon={subIcon} size={size} />
        </div>
      )}
    </div>
  );
}

function RewardSlot({
  index,
  present,
  theme,
}: {
  index: number;
  present?: QuestPresentInfo;
  theme: "normal" | "event";
}) {
  const Icon = present
    ? PRESENT_ICONS[present.type] ?? HelpCircle
    : undefined;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border-2 p-1.5 text-center",
        theme === "event"
          ? "border-pink-300/70 bg-pink-100/60"
          : "border-[#c4a574] bg-[#fdf6e3]/80",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg border-2",
          theme === "event"
            ? "border-pink-300/80 bg-white/60"
            : "border-[#c4a574] bg-white/70",
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              "h-7 w-7",
              PRESENT_COLORS[present?.type ?? 0] ?? "text-amber-700",
            )}
          />
        ) : (
          <X className="h-7 w-7 text-[#c4a574]/70" />
        )}
      </div>
      <span
        className={cn(
          "line-clamp-2 min-h-[2em] text-[9px] font-bold leading-tight",
          theme === "event" ? "text-pink-900" : "text-[#5c4328]",
        )}
      >
        {present ? formatPresentLabel(present) : `Reward ${index}`}
      </span>
    </div>
  );
}

function SubTab({
  index,
  active,
  onClick,
}: {
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-md border px-2.5 text-xs font-bold transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-[var(--border)] bg-[#0b1120] text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      Sub {index}
    </button>
  );
}

export function QuestPreview({ quest, presents, icons }: QuestPreviewProps) {
  const [activeSubIndex, setActiveSubIndex] = useState(
    quest.subTasks[0]?.index ?? 1,
  );

  const sub = useMemo(
    () =>
      quest.subTasks.find((s) => s.index === activeSubIndex) ??
      quest.subTasks[0],
    [quest.subTasks, activeSubIndex],
  );

  const theme = sub?.performType === 2 ? "event" : "normal";
  const isEvent = theme === "event";

  const rewards = useMemo(() => {
    if (!sub) return [];
    const slots: (QuestPresentInfo | undefined)[] = [];
    const maxSlots = Math.max(5, sub.maxReward, sub.rewardPresents.length);
    for (let i = 0; i < maxSlots; i++) {
      slots.push(presents[sub.rewardPresents[i] ?? 0]);
    }
    return slots;
  }, [sub, presents]);

  const descriptionLines = useMemo(() => {
    if (!sub) return [];
    const lines: string[] = [];
    if (sub.title) lines.push(sub.title);
    if (sub.progress) {
      sub.progress.split(/\\n|\n/).forEach((line) => {
        if (line.trim()) lines.push(line.trim());
      });
    }
    if (lines.length === 0) lines.push("No description set.");
    return lines;
  }, [sub]);

  if (!sub) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {quest.subTasks.map((s) => (
          <SubTab
            key={s.index}
            index={s.index}
            active={sub.index === s.index}
            onClick={() => setActiveSubIndex(s.index)}
          />
        ))}
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-lg border-2 shadow-md",
          isEvent
            ? "border-pink-400 bg-[#fff0f5]"
            : "border-[#8b6f47] bg-[#f5e6c8]",
        )}
      >
        {/* Title bar */}
        <div
          className={cn(
            "relative border-b-2 px-4 py-2 text-center",
            isEvent
              ? "border-pink-400 bg-pink-400/80"
              : "border-[#8b6f47] bg-[#a67c52]",
          )}
        >
          <h3 className="truncate text-sm font-black text-white drop-shadow-sm">
            {sub.title || "Untitled Quest"}
          </h3>
        </div>

        {/* Main content */}
        <div className="p-3">
          {/* Icon + description */}
          <div className="flex gap-3">
            <div className="relative shrink-0">
              <span
                className={cn(
                  "absolute -left-1 -top-1 z-10 rounded px-1 py-0 text-[8px] font-black uppercase tracking-wide text-white shadow-sm",
                  isEvent ? "bg-pink-600" : "bg-green-600",
                )}
              >
                {isEvent ? "EVENT" : "NEW"}
              </span>
              <div
                className={cn(
                  "rounded-full p-1",
                  isEvent ? "bg-pink-200/50" : "bg-[#e8d5b5]",
                )}
              >
                <QuestIconSprite
                  icons={icons}
                  iconKey={sub.icon}
                  subIconKey={sub.subIcon}
                  size={68}
                />
              </div>
            </div>
            <div
              className={cn(
                "h-40 flex-1 overflow-y-auto rounded border p-2 text-xs leading-relaxed",
                isEvent
                  ? "border-pink-300/60 bg-pink-50/50 text-pink-900"
                  : "border-[#c4a574] bg-[#fdf6e3] text-[#5c4328]",
              )}
              style={{
                backgroundImage: isEvent
                  ? "repeating-linear-gradient(transparent, transparent 18px, rgba(236,72,153,0.1) 18px, rgba(236,72,153,0.1) 19px)"
                  : "repeating-linear-gradient(transparent, transparent 18px, rgba(139,111,71,0.15) 18px, rgba(139,111,71,0.15) 19px)",
                backgroundAttachment: "local",
              }}
            >
              {descriptionLines.map((line, i) => (
                <p key={i} className="py-0.5">
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-black uppercase text-white",
                isEvent ? "bg-pink-600" : "bg-red-700",
              )}
            >
              Goal
            </span>
            <span
              className={cn(
                "text-xs font-bold",
                isEvent ? "text-pink-900" : "text-[#5c4328]",
              )}
            >
              {sub.progress || "Objective"}{" "}
              {sub.completeValue > 0 && (
                <span className="font-black">
                  0/{sub.completeValue} {sub.progressResult || "Items"}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Reward section */}
        <div
          className={cn(
            "border-t-2 px-3 py-3",
            isEvent
              ? "border-pink-400 bg-pink-200/50"
              : "border-[#8b6f47] bg-[#e6d2a8]/80",
          )}
        >
          <div
            className={cn(
              "mb-2 rounded-md px-2 py-0.5 text-center text-[10px] font-black",
              isEvent
                ? "bg-pink-300/70 text-pink-900"
                : "bg-[#d4b483] text-[#5c4328]",
            )}
          >
            Rewards
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {rewards.slice(0, 5).map((present, i) => (
              <RewardSlot
                key={i}
                index={i + 1}
                present={present}
                theme={theme}
              />
            ))}
          </div>
        </div>

        {/* Action button */}
        <div
          className={cn(
            "border-t-2 p-2",
            isEvent
              ? "border-pink-400 bg-pink-300/40"
              : "border-[#8b6f47] bg-[#d4b483]/70",
          )}
        >
          <button
            type="button"
            disabled
            className={cn(
              "h-8 w-full rounded-md border-2 text-xs font-black uppercase tracking-wide text-white shadow-sm",
              isEvent
                ? "border-pink-500 bg-pink-500"
                : "border-[#8b6f47] bg-[#a67c52]",
            )}
          >
            Accept (SPACE)
          </button>
        </div>
      </div>

      {/* Dates footer */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> Start: {formatDate(sub.start)}
        </span>
        <span>End: {formatDate(sub.end)}</span>
      </div>
    </div>
  );
}
