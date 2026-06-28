"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconPicker } from "@/components/IconPicker";
import {
  Scroll,
  Copy,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Quest,
  type QuestSubTask,
  type QuestDate,
  QUEST_CLASS_NAMES,
  QUEST_PERFORM_OPTIONS,
  CHANNELING_TYPE_OPTIONS,
  ROOM_STYLE_OPTIONS,
  QUEST_OCCUR_OPTIONS,
  QUEST_COMPLETE_OPTIONS,
  createDefaultQuest,
  createDefaultSubTask,
  generateQuestIni,
  downloadIni,
} from "@/lib/quest";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1).padStart(2, "0"),
}));

function Field({
  label,
  children,
  htmlFor,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-bold text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  id,
  placeholder,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const normalize = (raw: string) => {
    if (raw.trim() === "") return min ?? 0;
    const num = Number(raw);
    if (Number.isNaN(num)) return value;
    let next = num;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  };

  const commit = () => {
    const raw = inputRef.current?.value ?? "";
    onChange(normalize(raw));
  };

  return (
    <Input
      key={value}
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      defaultValue={value}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit();
          e.currentTarget.blur();
        }
      }}
      className="h-10 border-2 border-[var(--border)] bg-[#0b1120] px-2.5 text-sm"
    />
  );
}

function TextInput({
  value,
  onChange,
  id,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}) {
  return (
    <Input
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 border-2 border-[var(--border)] bg-[#0b1120] text-sm"
    />
  );
}

function SelectField({
  value,
  onChange,
  options,
  id,
}: {
  value: number;
  onChange: (value: number) => void;
  options: { value: number; label: string }[];
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-10 w-full rounded-lg border-2 border-[var(--border)] bg-[#0b1120] px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function BoolToggle({
  value,
  onChange,
  trueLabel = "On",
  falseLabel = "Off",
}: {
  value: number;
  onChange: (value: number) => void;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <div className="inline-flex h-10 rounded-lg border-2 border-[var(--border)] bg-[#0b1120] p-1">
      <button
        type="button"
        onClick={() => onChange(0)}
        className={cn(
          "rounded-md px-4 text-xs font-bold transition-colors",
          value === 0
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {falseLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(1)}
        className={cn(
          "rounded-md px-4 text-xs font-bold transition-colors",
          value === 1
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {trueLabel}
      </button>
    </div>
  );
}

function DateTimeField({
  label,
  date,
  onChange,
  id,
}: {
  label: string;
  date: QuestDate;
  onChange: (date: QuestDate) => void;
  id?: string;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <div className="grid grid-cols-4 gap-2">
        <div className="space-y-1">
          <NumberInput
            id={id ? `${id}-year` : undefined}
            value={date.year}
            onChange={(year) => onChange({ ...date, year })}
            placeholder="YYYY"
          />
          <span className="block text-[10px] text-muted-foreground">Year</span>
        </div>
        <div className="space-y-1">
          <SelectField
            id={id ? `${id}-month` : undefined}
            value={date.month}
            onChange={(month) => onChange({ ...date, month })}
            options={MONTH_OPTIONS}
          />
          <span className="block text-[10px] text-muted-foreground">Month</span>
        </div>
        <div className="space-y-1">
          <NumberInput
            id={id ? `${id}-day` : undefined}
            value={date.date}
            onChange={(dateVal) => onChange({ ...date, date: dateVal })}
            min={1}
            max={31}
            placeholder="DD"
          />
          <span className="block text-[10px] text-muted-foreground">Day</span>
        </div>
        <div className="space-y-1">
          <NumberInput
            id={id ? `${id}-hour` : undefined}
            value={date.hour}
            onChange={(hour) => onChange({ ...date, hour })}
            min={0}
            max={23}
            placeholder="HH"
          />
          <span className="block text-[10px] text-muted-foreground">Hour</span>
        </div>
      </div>
    </Field>
  );
}

export function QuestGenerator() {
  const [quest, setQuest] = useState<Quest>(createDefaultQuest());
  const [activeSub, setActiveSub] = useState(1);
  const [copied, setCopied] = useState(false);
  const [mainLinked, setMainLinked] = useState(true);

  const output = useMemo(() => generateQuestIni(quest), [quest]);

  const updateQuest = (patch: Partial<Quest>) => {
    setQuest((prev) => {
      const next = { ...prev, ...patch };
      if (patch.maxSubQuest !== undefined && patch.maxSubQuest !== prev.maxSubQuest) {
        next.subTasks = adjustSubTasks(prev.subTasks, Math.max(1, patch.maxSubQuest));
      }
      return next;
    });
  };

  const updateId = (id: number) => {
    setQuest((prev) => {
      const next = { ...prev, id };
      if (mainLinked) {
        next.mainIndex = id;
      }
      return next;
    });
  };

  const updateMainIndex = (mainIndex: number) => {
    setQuest((prev) => ({ ...prev, mainIndex }));
    setMainLinked(false);
  };

  const updateSubTask = (index: number, patch: Partial<QuestSubTask>) => {
    setQuest((prev) => {
      const subTasks = prev.subTasks.map((sub) => {
        if (sub.index !== index) return sub;
        const next = { ...sub, ...patch };
        if (patch.maxReward !== undefined) {
          next.rewardPresents = adjustArray(
            sub.rewardPresents,
            Math.max(0, patch.maxReward),
            0,
          );
        }
        return next;
      });
      return { ...prev, subTasks };
    });
  };

  const addSubQuest = () => {
    const nextIndex = quest.maxSubQuest + 1;
    updateQuest({ maxSubQuest: nextIndex });
    setActiveSub(nextIndex);
  };

  const removeSubQuest = (index: number) => {
    if (quest.maxSubQuest <= 1) return;
    setQuest((prev) => {
      const next = {
        ...prev,
        maxSubQuest: prev.maxSubQuest - 1,
        subTasks: adjustSubTasks(
          prev.subTasks.filter((s) => s.index !== index),
          prev.maxSubQuest - 1,
        ),
      };
      return next;
    });
    setActiveSub((prev) => {
      if (prev > index && prev > 1) return prev - 1;
      if (prev === index) return Math.max(1, index - 1);
      return prev;
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
      <div className="space-y-6">
        <section className="ls-card p-5">
          <div className="ls-section-header mb-5">
            <Scroll className="h-4 w-4" />
            <span className="text-sm">Quest Base</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Quest ID" htmlFor="quest-id">
              <NumberInput
                id="quest-id"
                value={quest.id}
                onChange={updateId}
                min={1}
              />
            </Field>
            <Field label="Main Index" htmlFor="main-index">
              <NumberInput
                id="main-index"
                value={quest.mainIndex}
                onChange={updateMainIndex}
                min={1}
              />
            </Field>
            <Field label="Max Sub Quests" htmlFor="max-sub">
              <NumberInput
                id="max-sub"
                value={quest.maxSubQuest}
                onChange={(maxSubQuest) => updateQuest({ maxSubQuest })}
                min={1}
              />
            </Field>
            <Field label="Class Name" htmlFor="class-name">
              <select
                id="class-name"
                value={quest.className}
                onChange={(e) => updateQuest({ className: e.target.value })}
                className="h-10 w-full rounded-lg border-2 border-[var(--border)] bg-[#0b1120] px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {QUEST_CLASS_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <label className="mt-5 inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={mainLinked}
              onChange={(e) => setMainLinked(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-[var(--border)] bg-[#0b1120] accent-primary"
            />
            Sync Main Index with Quest ID
          </label>
        </section>

        <section className="ls-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="ls-section-header">
              <Scroll className="h-4 w-4" />
              <span className="text-sm">Sub Quests</span>
            </div>
            <Button
              type="button"
              onClick={addSubQuest}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Add Sub Quest
            </Button>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            {quest.subTasks.map((sub) => {
              const active = activeSub === sub.index;
              return (
                <div key={sub.index} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveSub(sub.index)}
                    className={cn(
                      "flex h-9 items-center gap-1.5 rounded-l-lg border-2 px-3 text-xs font-bold transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-[var(--border)] bg-[#0b1120] text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    Sub {sub.index}
                  </button>
                  {quest.subTasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubQuest(sub.index)}
                      className={cn(
                        "flex h-9 items-center rounded-r-lg border-2 border-l-0 px-2 text-muted-foreground transition-colors",
                        active
                          ? "border-primary bg-primary/10 hover:bg-destructive/10 hover:text-destructive"
                          : "border-[var(--border)] bg-[#0b1120] hover:bg-destructive/10 hover:text-destructive",
                      )}
                      title="Remove sub quest"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {quest.subTasks.map((sub) =>
            activeSub === sub.index ? (
              <SubQuestForm
                key={sub.index}
                sub={sub}
                onChange={(patch) => updateSubTask(sub.index, patch)}
              />
            ) : null,
          )}
        </section>
      </div>

      <section className="ls-card flex flex-col gap-4 p-5 lg:sticky lg:top-4 lg:h-fit lg:self-start">
        <div className="ls-section-header">
          <Scroll className="h-4 w-4" />
          <span className="text-sm">Generated INI</span>
        </div>

        <textarea
          readOnly
          value={output}
          rows={24}
          className="w-full resize-none rounded-lg border-2 border-[var(--border)] bg-[#0b1120] p-4 font-mono text-sm text-foreground outline-none focus-visible:border-ring"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-[#22c55e]" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy
              </>
            )}
          </Button>
          <Button
            onClick={() => downloadIni(output, `quest${quest.id}.ini`)}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button
            onClick={() => {
              setQuest(createDefaultQuest());
              setActiveSub(1);
              setMainLinked(true);
            }}
            variant="ghost"
            size="sm"
            className="gap-1"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </section>
    </div>
  );
}

function SubQuestForm({
  sub,
  onChange,
}: {
  sub: QuestSubTask;
  onChange: (patch: Partial<QuestSubTask>) => void;
}) {
  const prefix = `sub${sub.index}`;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-foreground">Basic Info</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title" htmlFor={`${prefix}-title`}>
            <TextInput
              id={`${prefix}-title`}
              value={sub.title}
              onChange={(title) => onChange({ title })}
            />
          </Field>
          <Field label="Progress Result" htmlFor={`${prefix}-result`}>
            <TextInput
              id={`${prefix}-result`}
              value={sub.progressResult}
              placeholder="개, 분, ..."
              onChange={(progressResult) => onChange({ progressResult })}
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Progress Text" htmlFor={`${prefix}-progress`}>
            <TextInput
              id={`${prefix}-progress`}
              value={sub.progress}
              onChange={(progress) => onChange({ progress })}
            />
          </Field>
          <Field label="Help Index" htmlFor={`${prefix}-help`}>
            <NumberInput
              id={`${prefix}-help`}
              value={sub.help}
              onChange={(help) => onChange({ help })}
              min={0}
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Icon" htmlFor={`${prefix}-icon`}>
            <IconPicker
              value={sub.icon}
              onChange={(icon) => onChange({ icon })}
            />
          </Field>
          <Field label="Sub Icon" htmlFor={`${prefix}-subicon`}>
            <IconPicker
              value={sub.subIcon}
              onChange={(subIcon) => onChange({ subIcon })}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-foreground">Conditions</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Perform Type" htmlFor={`${prefix}-perform`}>
            <SelectField
              id={`${prefix}-perform`}
              value={sub.performType}
              onChange={(performType) => onChange({ performType })}
              options={QUEST_PERFORM_OPTIONS}
            />
          </Field>
          <Field label="Channeling Type" htmlFor={`${prefix}-channel`}>
            <SelectField
              id={`${prefix}-channel`}
              value={sub.channelingType}
              onChange={(channelingType) => onChange({ channelingType })}
              options={CHANNELING_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Period Hour" htmlFor={`${prefix}-period`}>
            <NumberInput
              id={`${prefix}-period`}
              value={sub.periodHour}
              onChange={(periodHour) => onChange({ periodHour })}
              min={0}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Occur Value" htmlFor={`${prefix}-occur`}>
            <NumberInput
              id={`${prefix}-occur`}
              value={sub.occurValue}
              onChange={(occurValue) => onChange({ occurValue })}
              min={0}
            />
          </Field>
          <Field label="Complete Value" htmlFor={`${prefix}-complete`}>
            <NumberInput
              id={`${prefix}-complete`}
              value={sub.completeValue}
              onChange={(completeValue) => onChange({ completeValue })}
              min={0}
            />
          </Field>
          <Field label="Complete Room Style" htmlFor={`${prefix}-crs`}>
            <SelectField
              id={`${prefix}-crs`}
              value={sub.completeRoomStyle}
              onChange={(completeRoomStyle) => onChange({ completeRoomStyle })}
              options={ROOM_STYLE_OPTIONS}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="One-day Style">
            <BoolToggle
              value={sub.onedayStyle}
              onChange={(onedayStyle) => onChange({ onedayStyle })}
            />
          </Field>
          <Field label="Repeat Style">
            <BoolToggle
              value={sub.repeatStyle}
              onChange={(repeatStyle) => onChange({ repeatStyle })}
            />
          </Field>
          <Field label="PC Room Style">
            <BoolToggle
              value={sub.pcroomStyle}
              onChange={(pcroomStyle) => onChange({ pcroomStyle })}
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <DateTimeField
          label="Start Date"
          id={`${prefix}-start`}
          date={sub.start}
          onChange={(start) => onChange({ start })}
        />
        <DateTimeField
          label="End Date"
          id={`${prefix}-end`}
          date={sub.end}
          onChange={(end) => onChange({ end })}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-foreground">Rewards</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Max Reward" htmlFor={`${prefix}-max-reward`}>
            <NumberInput
              id={`${prefix}-max-reward`}
              value={sub.maxReward}
              onChange={(maxReward) =>
                onChange({ maxReward: Math.max(0, maxReward) })
              }
              min={0}
            />
          </Field>
          <Field label="Reward Select Style">
            <BoolToggle
              value={sub.rewardSelectStyle}
              onChange={(rewardSelectStyle) => onChange({ rewardSelectStyle })}
            />
          </Field>
          <Field label="Reward Select Num" htmlFor={`${prefix}-rsn`}>
            <NumberInput
              id={`${prefix}-rsn`}
              value={sub.rewardSelectNum}
              onChange={(rewardSelectNum) => onChange({ rewardSelectNum })}
              min={1}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: sub.maxReward }).map((_, i) => (
            <Field key={i} label={`Reward Present ${i + 1}`}>
              <NumberInput
                value={sub.rewardPresents[i] ?? 0}
                onChange={(value) => {
                  const rewardPresents = [...sub.rewardPresents];
                  rewardPresents[i] = value;
                  onChange({ rewardPresents });
                }}
                min={0}
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-foreground">Advanced Trigger Settings</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Occur Mode" htmlFor={`${prefix}-om`}>
            <SelectField
              id={`${prefix}-om`}
              value={sub.occurMode}
              onChange={(occurMode) => onChange({ occurMode })}
              options={QUEST_OCCUR_OPTIONS}
            />
          </Field>
          <Field label="Occur Room Style" htmlFor={`${prefix}-ors`}>
            <SelectField
              id={`${prefix}-ors`}
              value={sub.occurRoomStyle}
              onChange={(occurRoomStyle) => onChange({ occurRoomStyle })}
              options={ROOM_STYLE_OPTIONS}
            />
          </Field>
          <Field label="Occur Value Ex" htmlFor={`${prefix}-ove`}>
            <NumberInput
              id={`${prefix}-ove`}
              value={sub.occurValueEx}
              onChange={(occurValueEx) => onChange({ occurValueEx })}
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Complete Mode" htmlFor={`${prefix}-cm`}>
            <SelectField
              id={`${prefix}-cm`}
              value={sub.completeMode}
              onChange={(completeMode) => onChange({ completeMode })}
              options={QUEST_COMPLETE_OPTIONS}
            />
          </Field>
          <Field label="Occur Excepting Mode" htmlFor={`${prefix}-oem`}>
            <NumberInput
              id={`${prefix}-oem`}
              value={sub.occurExceptingMode}
              onChange={(occurExceptingMode) => onChange({ occurExceptingMode })}
            />
          </Field>
          <Field label="Complete Excepting Mode" htmlFor={`${prefix}-cem`}>
            <NumberInput
              id={`${prefix}-cem`}
              value={sub.completeExceptingMode}
              onChange={(completeExceptingMode) =>
                onChange({ completeExceptingMode })
              }
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Occur Limit Grade Min" htmlFor={`${prefix}-olgmin`}>
            <NumberInput
              id={`${prefix}-olgmin`}
              value={sub.occurLimitGradeMin}
              onChange={(occurLimitGradeMin) => onChange({ occurLimitGradeMin })}
            />
          </Field>
          <Field label="Occur Limit Grade Max" htmlFor={`${prefix}-olgmax`}>
            <NumberInput
              id={`${prefix}-olgmax`}
              value={sub.occurLimitGradeMax}
              onChange={(occurLimitGradeMax) => onChange({ occurLimitGradeMax })}
            />
          </Field>
          <Field label="Guild Terms Level" htmlFor={`${prefix}-gtl`}>
            <NumberInput
              id={`${prefix}-gtl`}
              value={sub.guildTermsLevel}
              onChange={(guildTermsLevel) => onChange({ guildTermsLevel })}
              min={0}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-foreground">Linking & Locks</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Prev Main Index" htmlFor={`${prefix}-pmi`}>
            <NumberInput
              id={`${prefix}-pmi`}
              value={sub.prevMainIndex}
              onChange={(prevMainIndex) => onChange({ prevMainIndex })}
              min={0}
            />
          </Field>
          <Field label="Prev Sub Index" htmlFor={`${prefix}-psi`}>
            <NumberInput
              id={`${prefix}-psi`}
              value={sub.prevSubIndex}
              onChange={(prevSubIndex) => onChange({ prevSubIndex })}
              min={0}
            />
          </Field>
          <Field label="Costume">
            <BoolToggle
              value={sub.costume}
              onChange={(costume) => onChange({ costume })}
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Next Main Index" htmlFor={`${prefix}-nmi`}>
            <NumberInput
              id={`${prefix}-nmi`}
              value={sub.nextMainIndex}
              onChange={(nextMainIndex) => onChange({ nextMainIndex })}
              min={0}
            />
          </Field>
          <Field label="Next Sub Index" htmlFor={`${prefix}-nsi`}>
            <NumberInput
              id={`${prefix}-nsi`}
              value={sub.nextSubIndex}
              onChange={(nextSubIndex) => onChange({ nextSubIndex })}
              min={0}
            />
          </Field>
          <Field label="Guild Style">
            <BoolToggle
              value={sub.guildStyle}
              onChange={(guildStyle) => onChange({ guildStyle })}
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Invited Pass">
            <BoolToggle
              value={sub.invitedPass}
              onChange={(invitedPass) => onChange({ invitedPass })}
            />
          </Field>
          <Field label="User Mode Pass">
            <BoolToggle
              value={sub.userModePass}
              onChange={(userModePass) => onChange({ userModePass })}
            />
          </Field>
          <Field label="Death Time Pass">
            <BoolToggle
              value={sub.deathTimePass}
              onChange={(deathTimePass) => onChange({ deathTimePass })}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-foreground">UI & Alarms</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Play Occur Show">
            <BoolToggle
              value={sub.playOccurShow}
              onChange={(playOccurShow) => onChange({ playOccurShow })}
            />
          </Field>
          <Field label="Play Complete Show">
            <BoolToggle
              value={sub.playCompleteShow}
              onChange={(playCompleteShow) => onChange({ playCompleteShow })}
            />
          </Field>
          <Field label="Round End Occur Show">
            <BoolToggle
              value={sub.roundEndOccurShow}
              onChange={(roundEndOccurShow) => onChange({ roundEndOccurShow })}
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Round End Complete Show">
            <BoolToggle
              value={sub.roundEndCompleteShow}
              onChange={(roundEndCompleteShow) =>
                onChange({ roundEndCompleteShow })
              }
            />
          </Field>
          <Field label="Complete Game Alarm">
            <BoolToggle
              value={sub.completeGameAlarm}
              onChange={(completeGameAlarm) => onChange({ completeGameAlarm })}
            />
          </Field>
          <Field label="Complete Web Alarm">
            <BoolToggle
              value={sub.completeWebAlarm}
              onChange={(completeWebAlarm) => onChange({ completeWebAlarm })}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Custom Values</h3>
          <Button
            type="button"
            onClick={() =>
              onChange({ customValues: [...sub.customValues, 0] })
            }
            variant="outline"
            size="xs"
            className="gap-1"
          >
            <Plus className="h-3 w-3" /> Add Custom Value
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sub.customValues.map((value, i) => (
            <div key={i} className="flex items-center gap-2">
              <NumberInput
                value={value}
                onChange={(v) => {
                  const customValues = [...sub.customValues];
                  customValues[i] = v;
                  onChange({ customValues });
                }}
              />
              <Button
                type="button"
                onClick={() => {
                  const customValues = sub.customValues.filter(
                    (_, idx) => idx !== i,
                  );
                  onChange({ customValues });
                }}
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Extra Fields</h3>
          <Button
            type="button"
            onClick={() =>
              onChange({
                extraFields: [...sub.extraFields, { key: "", value: "" }],
              })
            }
            variant="outline"
            size="xs"
            className="gap-1"
          >
            <Plus className="h-3 w-3" /> Add Extra Field
          </Button>
        </div>
        <div className="space-y-3">
          {sub.extraFields.map((field, i) => (
            <div key={i} className="flex items-center gap-2">
              <TextInput
                placeholder="key"
                value={field.key}
                onChange={(key) => {
                  const extraFields = sub.extraFields.map((f, idx) =>
                    idx === i ? { ...f, key } : f,
                  );
                  onChange({ extraFields });
                }}
              />
              <TextInput
                placeholder="value"
                value={field.value}
                onChange={(value) => {
                  const extraFields = sub.extraFields.map((f, idx) =>
                    idx === i ? { ...f, value } : f,
                  );
                  onChange({ extraFields });
                }}
              />
              <Button
                type="button"
                onClick={() => {
                  const extraFields = sub.extraFields.filter(
                    (_, idx) => idx !== i,
                  );
                  onChange({ extraFields });
                }}
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function adjustSubTasks(
  subs: QuestSubTask[],
  targetLength: number,
): QuestSubTask[] {
  if (targetLength <= 0) return [];
  const trimmed = subs.slice(0, targetLength);
  const next = trimmed.map((sub, i) => ({ ...sub, index: i + 1 }));
  for (let i = trimmed.length + 1; i <= targetLength; i++) {
    next.push(createDefaultSubTask(i));
  }
  return next;
}

function adjustArray<T>(arr: T[], targetLength: number, fill: T): T[] {
  if (targetLength <= arr.length) return arr.slice(0, targetLength);
  return [...arr, ...Array.from({ length: targetLength - arr.length }, () => fill)];
}
