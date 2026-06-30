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
  subIcon: string;
  progress: string;
  progressResult: string;
  help: number;

  performType: number;
  channelingType: number;

  onedayStyle: number;
  repeatStyle: number;
  pcroomStyle: number;
  guildStyle: number;
  guildTermsLevel: number;
  costume: number;

  start: QuestDate;
  end: QuestDate;

  occurValue: number;
  occurValueEx: number;
  occurMode: number;
  occurRoomStyle: number;
  occurExceptingMode: number;
  occurLimitGradeMin: number;
  occurLimitGradeMax: number;

  completeValue: number;
  completeMode: number;
  completeRoomStyle: number;
  completeExceptingMode: number;

  periodHour: number;

  playOccurShow: number;
  playCompleteShow: number;
  roundEndOccurShow: number;
  roundEndCompleteShow: number;

  deathTimePass: number;
  invitedPass: number;
  userModePass: number;

  completeGameAlarm: number;
  completeWebAlarm: number;

  maxReward: number;
  rewardPresents: number[];
  rewardSelectStyle: number;
  rewardSelectNum: number;

  prevMainIndex: number;
  prevSubIndex: number;
  nextMainIndex: number;
  nextSubIndex: number;

  customValues: number[];
  extraFields: Array<{ key: string; value: string }>;
}

export interface Quest {
  id: number;
  className: string;
  mainIndex: number;
  maxSubQuest: number;
  subTasks: QuestSubTask[];
}

export const QUEST_CLASS_NAMES = [
  "QuestAwardAcquire",
  "QuestAwardLevel",
  "QuestBasic",
  "QuestBattleLevel",
  "QuestBattlePvPModeAwardAcquire",
  "QuestBossModeBosswithKill",
  "QuestBuyItem",
  "QuestBuySoldier",
  "QuestCampBattleKO",
  "QuestCampBattleWin",
  "QuestCampConsecution",
  "QuestCampJoin",
  "QuestCampLevel",
  "QuestCampSeasonReward",
  "QuestContribute",
  "QuestDropKill",
  "QuestEnterBattlePvPMode",
  "QuestEnterBattlePvPModeKO",
  "QuestEnterBattlePvPModeWin",
  "QuestEnterCampBattle",
  "QuestEnterPlaza",
  "QuestEtcItemUse",
  "QuestExcavationLevelUP",
  "QuestExcavationSuccess",
  "QuestExcavationTry",
  "QuestExtraItemEquipKo",
  "QuestExtraItemReinforceSuccess",
  "QuestFishingFailed",
  "QuestFishingLevelUP",
  "QuestFishingSellPeso",
  "QuestFishingSuccess",
  "QuestFishingSuccessItem",
  "QuestGangsiAliveTime",
  "QuestGangsiHumanKill",
  "QuestGangsiHumanWin",
  "QuestGangsiKill",
  "QuestGetPotion",
  "QuestGradeUP",
  "QuestGuildLevel",
  "QuestGuildLevelMaintenance",
  "QuestGuildTeamPlayTime",
  "QuestGuildTeamWin",
  "QuestHitAttackAttribute",
  "QuestHitCount",
  "QuestKingAttack",
  "QuestLoginCount",
  "QuestMakeFriends",
  "QuestMakeMovie",
  "QuestMaxFriendSlot",
  "QuestModePlayTime",
  "QuestMonsterModeClear",
  "QuestMortmainSoldierCount",
  "QuestMovieMode",
  "QuestMultiKill",
  "QuestOpenManual",
  "QuestPesoGrowthTry",
  "QuestPickItem",
  "QuestPlayTimeCount",
  "QuestPresentReceive",
  "QuestPrisonerDrop",
  "QuestPvEMonsterKill",
  "QuestPvETimeAttack",
  "QuestQuickStartOption",
  "QuestRequestFriend",
  "QuestScreenShot",
  "QuestSoccerAssist",
  "QuestSoccerBallHit",
  "QuestSoccerGoal",
  "QuestSoccerSave",
  "QuestSoldierLevelUP",
  "QuestSoldierPractice",
  "QuestStoneAttack",
].sort();

export const QUEST_PERFORM_OPTIONS = [
  { value: 1, label: "Normal" },
  { value: 2, label: "Event" },
];

export const CHANNELING_TYPE_OPTIONS = [
  { value: -1, label: "None" },
  { value: 0, label: "WeMadeBuy" },
  { value: 300, label: "mGame" },
  { value: 400, label: "Daum" },
  { value: 600, label: "Naver" },
  { value: 700, label: "Tooniland" },
  { value: 800, label: "Nexon" },
  { value: 900, label: "Hangame" },
  { value: 1000, label: "Valofe" },
  { value: 1100, label: "HappyTalk" },
];

export const ROOM_STYLE_OPTIONS = [
  { value: 0, label: "None" },
  { value: 1, label: "Battle Room" },
  { value: 2, label: "Plaza" },
  { value: 3, label: "Ladder Battle" },
  { value: 4, label: "Headquarters" },
  { value: 5, label: "Shuffle Room" },
  { value: 6, label: "Match Room" },
];

export const QUEST_OCCUR_OPTIONS = [
  { value: 0, label: "None" },
  { value: 1, label: "Enter Lobby" },
  { value: 2, label: "Enter Battle PvE" },
  { value: 3, label: "Enter Battle PvP" },
  { value: 4, label: "Battle PvP Final Result" },
  { value: 5, label: "Battle Final Result" },
  { value: 6, label: "Plaza Enter" },
  { value: 7, label: "Fishing Success" },
  { value: 8, label: "Fishing Failed" },
  { value: 9, label: "Fishing LevelUp" },
  { value: 10, label: "Fishing Sell" },
  { value: 11, label: "Soldier Acquire" },
  { value: 12, label: "Grade Exp Acquire" },
  { value: 13, label: "Soldier Exp Acquire" },
  { value: 14, label: "Lobby/Plaza Enter" },
  { value: 15, label: "Game Login" },
  { value: 16, label: "PvE Round Clear" },
  { value: 17, label: "Enter Room PvE" },
  { value: 18, label: "Enter Room PvP" },
  { value: 19, label: "Excavation LevelUp" },
  { value: 20, label: "EtcItem Use" },
  { value: 21, label: "Camp Season Reward" },
  { value: 22, label: "Game Login Dormant" },
  { value: 23, label: "PC Room Authority" },
  { value: 24, label: "Friend Recommend" },
  { value: 25, label: "Game Login Dormant Custom" },
  { value: 26, label: "Practice Success" },
];

export const QUEST_COMPLETE_OPTIONS = [
  { value: 0, label: "None" },
  { value: 1, label: "PvE Round Clear" },
  { value: 2, label: "Enter Battle PvP" },
  { value: 3, label: "Battle PvP KO" },
  { value: 4, label: "Battle PvP Win" },
  { value: 5, label: "Grade Up" },
  { value: 6, label: "Time Growth Try" },
  { value: 7, label: "Time Growth Success" },
  { value: 8, label: "Peso Growth Try" },
  { value: 9, label: "Buy Etc Item" },
  { value: 10, label: "Fishing Try" },
  { value: 11, label: "Fishing Success" },
  { value: 12, label: "Fishing Failed" },
  { value: 13, label: "Fishing LevelUp" },
  { value: 14, label: "Fishing Sell Peso" },
  { value: 15, label: "Fishing Success Item" },
  { value: 16, label: "Battle PvP Award Row Acquire" },
  { value: 17, label: "Soldier Practice Success" },
  { value: 18, label: "Buy Extra Item" },
  { value: 19, label: "Extra Item Reinforce Success" },
  { value: 20, label: "Soldier LevelUp" },
  { value: 21, label: "Enter Plaza" },
  { value: 22, label: "Manual Close" },
  { value: 23, label: "Game Login" },
  { value: 24, label: "Battle PvE KO" },
  { value: 25, label: "Pick Item" },
  { value: 26, label: "Tutorial Clear" },
  { value: 27, label: "Present Recv" },
  { value: 28, label: "Camp Join" },
  { value: 29, label: "Enter Camp Battle" },
  { value: 30, label: "Camp Battle KO" },
  { value: 31, label: "Camp Battle Win" },
  { value: 32, label: "Camp Season Reward" },
  { value: 33, label: "Award Acquire" },
  { value: 34, label: "Prisoner Drop" },
  { value: 35, label: "Prisoner Save" },
  { value: 36, label: "Enter Headquarter" },
  { value: 37, label: "Battle Exp Acquire" },
  { value: 38, label: "Battle PvP FinalResult Show" },
  { value: 39, label: "Drop Kill" },
  { value: 40, label: "Multi Kill" },
  { value: 41, label: "Enter Lobby" },
  { value: 42, label: "Enter Battle Observer" },
  { value: 43, label: "EtcItem Use" },
  { value: 44, label: "Friend Request" },
  { value: 45, label: "Friend Make" },
  { value: 46, label: "Stone Attack" },
  { value: 47, label: "Other King Attack" },
  { value: 48, label: "Crown Hold Time" },
  { value: 49, label: "Bossmode Become Boss" },
  { value: 50, label: "Bossmode Boss With Kill" },
  { value: 51, label: "Soldier Acquire" },
  { value: 52, label: "Attack Hit" },
  { value: 53, label: "Attack Defense" },
  { value: 54, label: "Camp Exp Acquire" },
  { value: 55, label: "Camp FinalResult Show" },
  { value: 56, label: "Quick Start Option Select" },
  { value: 57, label: "Soccer Ball Hit" },
  { value: 58, label: "Soccer Goal" },
  { value: 59, label: "Soccer Assist" },
  { value: 60, label: "Soccer Save" },
  { value: 61, label: "Excavation Try" },
  { value: 62, label: "Excavation Success" },
  { value: 63, label: "Battle PvE Team KO" },
  { value: 64, label: "Excavation Fail" },
  { value: 65, label: "Screen Shot" },
  { value: 66, label: "Movie Mode" },
  { value: 67, label: "Make Movie" },
  { value: 68, label: "Extra Item Acquire" },
  { value: 69, label: "Extra Item Equip" },
  { value: 70, label: "Extra Item Equip KO" },
  { value: 71, label: "Excavation LevelUp" },
  { value: 72, label: "Gangsi Kill" },
  { value: 73, label: "Gangsi Human Kill" },
  { value: 74, label: "Gangsi Alive Time" },
  { value: 75, label: "Gangsi Human Win" },
  { value: 76, label: "Hit Attack Attribute" },
  { value: 77, label: "PC Room Login" },
  { value: 78, label: "Champion AI Clear" },
  { value: 79, label: "Accessory Compound Success" },
  { value: 80, label: "Practice Success" },
];

function formatDate(prefix: "start" | "end", date: QuestDate): string[] {
  return [
    `${prefix}_year=${date.year}`,
    `${prefix}_month=${date.month}`,
    `${prefix}_date=${date.date}`,
    `${prefix}_hour=${date.hour}`,
  ];
}

function emptyDate(): QuestDate {
  return { year: 2026, month: 1, date: 1, hour: 5 };
}

export function createDefaultSubTask(index: number): QuestSubTask {
  return {
    index,
    title: "",
    icon: "",
    subIcon: "",
    progress: "",
    progressResult: "",
    help: 0,

    performType: 2,
    channelingType: -1,

    onedayStyle: 0,
    repeatStyle: 0,
    pcroomStyle: 0,
    guildStyle: 0,
    guildTermsLevel: 0,
    costume: 0,

    start: emptyDate(),
    end: emptyDate(),

    occurValue: 1,
    occurValueEx: -1,
    occurMode: -1,
    occurRoomStyle: -1,
    occurExceptingMode: -1,
    occurLimitGradeMin: -1,
    occurLimitGradeMax: -1,

    completeValue: 1,
    completeMode: -1,
    completeRoomStyle: -1,
    completeExceptingMode: -1,

    periodHour: 0,

    playOccurShow: 1,
    playCompleteShow: 1,
    roundEndOccurShow: 1,
    roundEndCompleteShow: 1,

    deathTimePass: 0,
    invitedPass: 0,
    userModePass: 0,

    completeGameAlarm: 0,
    completeWebAlarm: 0,

    maxReward: 1,
    rewardPresents: [0],
    rewardSelectStyle: 0,
    rewardSelectNum: 1,

    prevMainIndex: 0,
    prevSubIndex: 0,
    nextMainIndex: 0,
    nextSubIndex: 0,

    customValues: [0],
    extraFields: [],
  };
}

export function createDefaultQuest(): Quest {
  return {
    id: 15001,
    className: "QuestEtcItemUse",
    mainIndex: 15001,
    maxSubQuest: 1,
    subTasks: [createDefaultSubTask(1)],
  };
}

export function generateQuestIni(quest: Quest): string {
  const lines: string[] = [];
  lines.push(`[quest${quest.id}]`);
  lines.push(`class_name=${quest.className}`);
  lines.push(`main_index=${quest.mainIndex}`);
  lines.push(`max_sub_quest=${quest.maxSubQuest}\n`);

  for (const sub of quest.subTasks) {
    if (sub.index > 1) {
      lines.push("");
    }

    const prefix = `sub${sub.index}_`;
    const push = (key: string, value: string | number) => {
      lines.push(`${prefix}${key}=${value}`);
    };

    push("title", sub.title);
    if (sub.icon) push("icon", sub.icon);
    if (sub.subIcon) push("sub_icon", sub.subIcon);
    if (sub.progress) push("progress", sub.progress);
    if (sub.progressResult) push("progress_result", sub.progressResult);
    push("help", sub.help);

    push("perform_type", sub.performType);
    push("channeling_type", sub.channelingType);

    push("oneday_style", sub.onedayStyle);
    push("repeat_style", sub.repeatStyle);
    push("pcroom_style", sub.pcroomStyle);
    push("guild_style", sub.guildStyle);
    push("guild_terms_level", sub.guildTermsLevel);
    push("costume", sub.costume);

    for (const line of formatDate("start", sub.start)) {
      push(line.split("=")[0], line.split("=")[1]);
    }
    for (const line of formatDate("end", sub.end)) {
      push(line.split("=")[0], line.split("=")[1]);
    }

    push("occur_value", sub.occurValue);
    push("occur_value_ex", sub.occurValueEx);
    push("occur_mode", sub.occurMode);
    push("occur_room_style", sub.occurRoomStyle);
    push("occur_excepting_mode", sub.occurExceptingMode);
    push("occur_limit_grade_min", sub.occurLimitGradeMin);
    push("occur_limit_grade_max", sub.occurLimitGradeMax);

    push("complete_value", sub.completeValue);
    push("complete_mode", sub.completeMode);
    push("complete_room_style", sub.completeRoomStyle);
    push("complete_excepting_mode", sub.completeExceptingMode);

    push("period_hour", sub.periodHour);

    push("play_occur_show", sub.playOccurShow);
    push("play_complete_show", sub.playCompleteShow);
    push("round_end_occur_show", sub.roundEndOccurShow);
    push("round_end_complete_show", sub.roundEndCompleteShow);

    push("death_time_pass", sub.deathTimePass);
    push("invited_pass", sub.invitedPass);
    push("user_mode_pass", sub.userModePass);

    push("complete_game_alarm", sub.completeGameAlarm);
    push("complete_web_alarm", sub.completeWebAlarm);

    push("max_reward", sub.maxReward);
    for (
      let i = 0;
      i < Math.max(sub.maxReward, sub.rewardPresents.length);
      i++
    ) {
      push(`reward_present${i + 1}`, sub.rewardPresents[i] ?? 0);
    }

    push("rewardselect_style", sub.rewardSelectStyle);
    push("rewardselect_num", sub.rewardSelectNum);

    push("prev_main_index", sub.prevMainIndex);
    push("prev_sub_index", sub.prevSubIndex);
    push("next_main_index", sub.nextMainIndex);
    push("next_sub_index", sub.nextSubIndex);

    for (let i = 0; i < sub.customValues.length; i++) {
      push(`custom_value${i + 1}`, sub.customValues[i]);
    }

    for (const extra of sub.extraFields) {
      if (extra.key.trim()) {
        push(extra.key.trim(), extra.value);
      }
    }
  }

  return lines.join("\n") + "\n";
}

export function downloadIni(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
