import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { extractIop, applySecondaryXor } from "../lib/iop";
import {
  CACHE_DIR,
  IOP_CACHE_DIR,
  readCachedOrDownload,
} from "../lib/patch-manifest";
import { writeJson } from "../lib/utils";

const QUEST_INFO_IOP = "config/sp2_quest_info.ini.iop";
const QUEST_INFO_NAME = "sp2_quest_info.ini";

const QUEST_HELP_IOP = "config/sp2_quest_help.ini.iop";
const QUEST_HELP_NAME = "sp2_quest_help.ini";

const QUEST_PRESENT_IOP = "config/sp2_quest_present.ini.iop";
const QUEST_PRESENT_NAME = "sp2_quest_present.ini";

const QUEST_GUIDE_IOP = "config/sp2_quest_guide.ini.iop";
const QUEST_GUIDE_NAME = "sp2_quest_guide.ini";

export interface QuestDate {
  year: number;
  month: number;
  date: number;
  hour: number;
}

export interface QuestSubTask {
  index: number;
  title: string;
  icon: string;
  progress: string;
  progressResult: string;
  help: number;
  performType: number;
  channelingType: number;
  pcroomStyle?: number;
  onedayStyle?: number;
  repeatStyle?: number;
  start: QuestDate;
  end: QuestDate;
  occurValue: number;
  completeValue: number;
  periodHour: number;
  playCompleteShow?: number;
  playOccurShow?: number;
  completeRoomStyle?: number;
  deathTimePass?: number;
  maxReward: number;
  rewardPresents: number[];
  customValues: number[];
  rawFields: Record<string, string>;
}

export interface Quest {
  id: number;
  section: string;
  className: string;
  mainIndex: number;
  maxSubQuest: number;
  subTasks: QuestSubTask[];
  rawFields: Record<string, string>;
}

export type RawSection = { name: string; fields: Record<string, string> };

function decodeKorean(buf: Buffer): string {
  try {
    return new TextDecoder("cp949").decode(buf);
  } catch {
    return new TextDecoder("euc-kr").decode(buf);
  }
}

function parseIniSections(text: string): RawSection[] {
  const sections: RawSection[] = [];
  let current: RawSection | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) continue;

    if (line.startsWith("[") && line.endsWith("]")) {
      current = { name: line.slice(1, -1), fields: {} };
      sections.push(current);
      continue;
    }

    if (!current) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    current.fields[key] = value;
  }

  return sections;
}

function normalizeNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

function parseDate(
  fields: Record<string, string>,
  prefix: "start" | "end",
): QuestDate {
  return {
    year: normalizeNumber(fields[`${prefix}_year`]) ?? 0,
    month: normalizeNumber(fields[`${prefix}_month`]) ?? 0,
    date: normalizeNumber(fields[`${prefix}_date`]) ?? 0,
    hour: normalizeNumber(fields[`${prefix}_hour`]) ?? 0,
  };
}

function parseRewardPresents(fields: Record<string, string>): number[] {
  const out: number[] = [];
  for (let i = 1; i <= 5; i++) {
    const raw = fields[`reward_present${i}`];
    if (raw === undefined || raw === "") break;
    out.push(normalizeNumber(raw) ?? 0);
  }
  return out;
}

function parseCustomValues(fields: Record<string, string>): number[] {
  const out: number[] = [];
  for (let i = 1; i <= 8; i++) {
    const raw = fields[`custom_value${i}`];
    if (raw === undefined || raw === "") break;
    out.push(normalizeNumber(raw) ?? 0);
  }
  return out;
}

function parseSubTask(
  index: number,
  fields: Record<string, string>,
): QuestSubTask {
  return {
    index,
    title: fields.title ?? "",
    icon: fields.icon ?? "",
    progress: fields.progress ?? "",
    progressResult: fields.progress_result ?? "",
    help: normalizeNumber(fields.help) ?? 0,
    performType: normalizeNumber(fields.perform_type) ?? 0,
    channelingType: normalizeNumber(fields.channeling_type) ?? 0,
    pcroomStyle: normalizeNumber(fields.pcroom_style),
    onedayStyle: normalizeNumber(fields.oneday_style),
    repeatStyle: normalizeNumber(fields.repeat_style),
    start: parseDate(fields, "start"),
    end: parseDate(fields, "end"),
    occurValue: normalizeNumber(fields.occur_value) ?? 0,
    completeValue: normalizeNumber(fields.complete_value) ?? 0,
    periodHour: normalizeNumber(fields.period_hour) ?? 0,
    playCompleteShow: normalizeNumber(fields.play_complete_show),
    playOccurShow: normalizeNumber(fields.play_occur_show),
    completeRoomStyle: normalizeNumber(fields.complete_room_style),
    deathTimePass: normalizeNumber(fields.death_time_pass),
    maxReward: normalizeNumber(fields.max_reward) ?? 0,
    rewardPresents: parseRewardPresents(fields),
    customValues: parseCustomValues(fields),
    rawFields: fields,
  };
}

function parseQuestId(sectionName: string): number | null {
  const match = /^quest(\d+)$/i.exec(sectionName);
  return match ? Number(match[1]) : null;
}

function transformToQuests(sections: RawSection[]): Quest[] {
  return sections
    .map((section): Quest | null => {
      const id = parseQuestId(section.name);
      if (id === null) return null;

      const f = section.fields;
      const maxSubQuest = normalizeNumber(f.max_sub_quest) ?? 0;
      const subTasks: QuestSubTask[] = [];

      for (let i = 1; i <= maxSubQuest; i++) {
        const prefix = `sub${i}_`;
        const subFields: Record<string, string> = {};
        for (const [key, value] of Object.entries(f)) {
          if (key.startsWith(prefix)) {
            subFields[key.slice(prefix.length)] = value;
          }
        }
        subTasks.push(parseSubTask(i, subFields));
      }

      return {
        id,
        section: section.name,
        className: f.class_name ?? "",
        mainIndex: normalizeNumber(f.main_index) ?? 0,
        maxSubQuest,
        subTasks,
        rawFields: f,
      };
    })
    .filter((q): q is Quest => q !== null);
}

async function fetchAndDecode(
  remotePath: string,
  iniName: string,
): Promise<string> {
  console.log(`Downloading ${remotePath}`);
  const iopBuffer = await readCachedOrDownload(remotePath);
  const entries = await extractIop(iopBuffer);

  const entry = entries.find((e) =>
    e.filename.toLowerCase().includes(iniName.toLowerCase()),
  );
  if (!entry) {
    throw new Error(`${iniName} not found inside .iop archive`);
  }

  // Quest config files are XORed even when the archive comment does not mark
  // them as encrypted data. Use the secondary XOR on those entries.
  const data =
    entry.passwordType === 1 ? entry.data : applySecondaryXor(entry.data);
  const text = decodeKorean(data);

  await fsp.writeFile(path.join(CACHE_DIR, iniName), text);
  console.log(`Cached raw INI to data/.cache/${iniName}`);
  return text;
}

export async function fetchQuests(): Promise<void> {
  await fsp.mkdir(CACHE_DIR, { recursive: true });
  await fsp.mkdir(IOP_CACHE_DIR, { recursive: true });

  const infoText = await fetchAndDecode(QUEST_INFO_IOP, QUEST_INFO_NAME);
  const infoSections = parseIniSections(infoText);
  await writeJson(path.join("data", "quests-raw.json"), infoSections);
  console.log(
    `Wrote ${infoSections.length} raw sections to data/quests-raw.json`,
  );

  const quests = transformToQuests(infoSections);
  await writeJson(path.join("data", "quests.json"), quests);
  console.log(`Wrote ${quests.length} typed quests to data/quests.json`);

  const helpText = await fetchAndDecode(QUEST_HELP_IOP, QUEST_HELP_NAME);
  const helpSections = parseIniSections(helpText);
  await writeJson(path.join("data", "quest-help-raw.json"), helpSections);
  console.log(
    `Wrote ${helpSections.length} raw sections to data/quest-help-raw.json`,
  );

  const presentText = await fetchAndDecode(
    QUEST_PRESENT_IOP,
    QUEST_PRESENT_NAME,
  );
  const presentSections = parseIniSections(presentText);
  await writeJson(
    path.join("data", "quest-present-raw.json"),
    presentSections,
  );
  console.log(
    `Wrote ${presentSections.length} raw sections to data/quest-present-raw.json`,
  );

  const guideText = await fetchAndDecode(QUEST_GUIDE_IOP, QUEST_GUIDE_NAME);
  const guideSections = parseIniSections(guideText);
  await writeJson(path.join("data", "quest-guide-raw.json"), guideSections);
  console.log(
    `Wrote ${guideSections.length} raw sections to data/quest-guide-raw.json`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchQuests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
