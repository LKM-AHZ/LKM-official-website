/** 成就分类：取值是封闭集合，用联合类型而不是 string，拼错会在编译期报出来 */
export type AchievementCategory =
  "special" | "posting" | "helping" | "files" | "activity";

/** 成就达成条件类型（同样封闭） */
export type AchievementRequirementType =
  | "onboarding"
  | "post_count"
  | "featured_count"
  | "accepted_answers"
  | "approved_files"
  | "checkin_streak"
  | "project_count"
  | "column_articles";

/** 积分流水的关联对象类型 */
export type PointReferenceType =
  "checkin" | "post" | "comment" | "answer" | "file" | "competition" | "task";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: { type: AchievementRequirementType; threshold: number };
  sortOrder: number;
}

export interface UserAchievement {
  achievementId: string;
  progress: number;
  unlocked: boolean;
}

export interface PointLog {
  id: string;
  amount: number;
  reason: string;
  referenceType: PointReferenceType;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  points: number;
  title: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  requirementCount: number;
  currentProgress: number;
  completed: boolean;
}

export interface ExchangeItem {
  id: string;
  name: string;
  description: string;
  image?: string;
  pointsCost: number;
  stock: number;
  isVirtual: boolean;
}

export const achievements: Achievement[] = [
  {
    id: "a1",
    name: "contributionData.achievements.a1.name",
    description: "contributionData.achievements.a1.description",
    icon: "tabler:star",
    category: "special",
    requirement: { type: "onboarding", threshold: 1 },
    sortOrder: 1,
  },
  {
    id: "a2",
    name: "contributionData.achievements.a2.name",
    description: "contributionData.achievements.a2.description",
    icon: "tabler:pencil",
    category: "posting",
    requirement: { type: "post_count", threshold: 1 },
    sortOrder: 2,
  },
  {
    id: "a3",
    name: "contributionData.achievements.a3.name",
    description: "contributionData.achievements.a3.description",
    icon: "tabler:pencil-plus",
    category: "posting",
    requirement: { type: "post_count", threshold: 10 },
    sortOrder: 3,
  },
  {
    id: "a4",
    name: "contributionData.achievements.a4.name",
    description: "contributionData.achievements.a4.description",
    icon: "tabler:star-filled",
    category: "posting",
    requirement: { type: "featured_count", threshold: 1 },
    sortOrder: 4,
  },
  {
    id: "a5",
    name: "contributionData.achievements.a5.name",
    description: "contributionData.achievements.a5.description",
    icon: "tabler:writing",
    category: "posting",
    requirement: { type: "post_count", threshold: 100 },
    sortOrder: 5,
  },
  {
    id: "a6",
    name: "contributionData.achievements.a6.name",
    description: "contributionData.achievements.a6.description",
    icon: "tabler:heart-handshake",
    category: "helping",
    requirement: { type: "accepted_answers", threshold: 5 },
    sortOrder: 6,
  },
  {
    id: "a7",
    name: "contributionData.achievements.a7.name",
    description: "contributionData.achievements.a7.description",
    icon: "tabler:brain",
    category: "helping",
    requirement: { type: "accepted_answers", threshold: 20 },
    sortOrder: 7,
  },
  {
    id: "a8",
    name: "contributionData.achievements.a8.name",
    description: "contributionData.achievements.a8.description",
    icon: "tabler:file-check",
    category: "files",
    requirement: { type: "approved_files", threshold: 10 },
    sortOrder: 8,
  },
  {
    id: "a9",
    name: "contributionData.achievements.a9.name",
    description: "contributionData.achievements.a9.description",
    icon: "tabler:calendar-check",
    category: "activity",
    requirement: { type: "checkin_streak", threshold: 7 },
    sortOrder: 9,
  },
  {
    id: "a10",
    name: "contributionData.achievements.a10.name",
    description: "contributionData.achievements.a10.description",
    icon: "tabler:calendar-star",
    category: "activity",
    requirement: { type: "checkin_streak", threshold: 30 },
    sortOrder: 10,
  },
  {
    id: "a11",
    name: "contributionData.achievements.a11.name",
    description: "contributionData.achievements.a11.description",
    icon: "tabler:rocket",
    category: "activity",
    requirement: { type: "project_count", threshold: 3 },
    sortOrder: 11,
  },
  {
    id: "a12",
    name: "contributionData.achievements.a12.name",
    description: "contributionData.achievements.a12.description",
    icon: "tabler:article",
    category: "special",
    requirement: { type: "column_articles", threshold: 5 },
    sortOrder: 12,
  },
];

// Current user's achievement progress (mock)
const userAchievementProgress: Array<{
  achievementId: string;
  progress: number;
}> = [
  { achievementId: "a1", progress: 1 },
  { achievementId: "a2", progress: 1 },
  { achievementId: "a3", progress: 10 },
  { achievementId: "a4", progress: 1 },
  { achievementId: "a5", progress: 45 },
  { achievementId: "a6", progress: 5 },
  { achievementId: "a7", progress: 12 },
  { achievementId: "a8", progress: 7 },
  { achievementId: "a9", progress: 7 },
  { achievementId: "a10", progress: 7 },
  { achievementId: "a11", progress: 3 },
  { achievementId: "a12", progress: 5 },
];

const thresholdById = new Map(
  achievements.map((a) => [a.id, a.requirement.threshold]),
);

// unlocked 由「进度 >= 该成就门槛」派生，不再手工维护：否则改一处忘一处就会渲染出
// 「已解锁但进度不足」这种自相矛盾的数据
export const userAchievements: UserAchievement[] = userAchievementProgress.map(
  ({ achievementId, progress }) => {
    const threshold = thresholdById.get(achievementId);
    if (threshold === undefined) {
      throw new Error(`mock-contribution: 未知成就 id: ${achievementId}`);
    }
    return { achievementId, progress, unlocked: progress >= threshold };
  },
);

// 按 createdAt 倒序（新流水在前）：消费方直接按数组顺序渲染，不要在这里留乱序
export const pointLogs: PointLog[] = [
  {
    id: "p1",
    amount: 5,
    reason: "contributionData.pointLogs.checkin",
    referenceType: "checkin",
    createdAt: "2026-07-27",
  },
  {
    id: "p5",
    amount: 5,
    reason: "contributionData.pointLogs.checkin",
    referenceType: "checkin",
    createdAt: "2026-07-26",
  },
  {
    id: "p2",
    amount: 10,
    reason: "contributionData.pointLogs.post",
    referenceType: "post",
    createdAt: "2026-07-20",
  },
  {
    id: "p3",
    amount: 2,
    reason: "contributionData.pointLogs.comment",
    referenceType: "comment",
    createdAt: "2026-07-20",
  },
  {
    id: "p4",
    amount: 20,
    reason: "contributionData.pointLogs.answerAccepted",
    referenceType: "answer",
    createdAt: "2026-07-18",
  },
  {
    id: "p6",
    amount: 15,
    reason: "contributionData.pointLogs.fileApproved",
    referenceType: "file",
    createdAt: "2026-07-15",
  },
  {
    id: "p7",
    amount: 50,
    reason: "contributionData.pointLogs.competition",
    referenceType: "competition",
    createdAt: "2026-07-10",
  },
  {
    id: "p8",
    amount: 30,
    reason: "contributionData.pointLogs.dailyTask",
    referenceType: "task",
    createdAt: "2026-07-09",
  },
];

export const leaderboard: {
  daily: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  total: LeaderboardEntry[];
} = {
  daily: [
    {
      rank: 1,
      username: "qiyue-hua",
      displayName: "contributionData.leaderboard.names.qiyueHua",
      points: 85,
      title: "contributionData.leaderboard.titles.hardcore",
    },
    {
      rank: 2,
      username: "qiyue-o",
      displayName: "contributionData.leaderboard.names.qiyueO",
      points: 60,
      title: "contributionData.leaderboard.titles.columnAuthor",
    },
    {
      rank: 3,
      username: "physics-lover",
      displayName: "contributionData.leaderboard.names.physicsLover",
      points: 45,
      title: "contributionData.leaderboard.titles.active",
    },
    {
      rank: 4,
      username: "math-genius",
      displayName: "contributionData.leaderboard.names.mathGenius",
      points: 30,
      title: "contributionData.leaderboard.titles.newcomer",
    },
    {
      rank: 5,
      username: "chem-master",
      displayName: "contributionData.leaderboard.names.chemMaster",
      points: 25,
      title: "contributionData.leaderboard.titles.active",
    },
  ],
  weekly: [
    {
      rank: 1,
      username: "qiyue-o",
      displayName: "contributionData.leaderboard.names.qiyueO",
      points: 420,
      title: "contributionData.leaderboard.titles.columnAuthor",
    },
    {
      rank: 2,
      username: "qiyue-moran",
      displayName: "contributionData.leaderboard.names.qiyueMoran",
      points: 350,
      title: "contributionData.leaderboard.titles.active",
    },
    {
      rank: 3,
      username: "qiyue-hua",
      displayName: "contributionData.leaderboard.names.qiyueHua",
      points: 310,
      title: "contributionData.leaderboard.titles.hardcore",
    },
    {
      rank: 4,
      username: "physics-lover",
      displayName: "contributionData.leaderboard.names.physicsLover",
      points: 280,
      title: "contributionData.leaderboard.titles.active",
    },
    {
      rank: 5,
      username: "qiyue-yuli",
      displayName: "contributionData.leaderboard.names.qiyueYuli",
      points: 220,
      title: "contributionData.leaderboard.titles.active",
    },
    {
      rank: 6,
      username: "astronomy-fan",
      displayName: "contributionData.leaderboard.names.astronomyFan",
      points: 180,
      title: "contributionData.leaderboard.titles.newcomer",
    },
    {
      rank: 7,
      username: "code-wizard",
      displayName: "contributionData.leaderboard.names.codeWizard",
      points: 150,
      title: "contributionData.leaderboard.titles.newcomer",
    },
    {
      rank: 8,
      username: "math-genius",
      displayName: "contributionData.leaderboard.names.mathGenius",
      points: 120,
      title: "contributionData.leaderboard.titles.newcomer",
    },
  ],
  total: [
    {
      rank: 1,
      username: "qiyue-o",
      displayName: "contributionData.leaderboard.names.qiyueO",
      points: 12500,
      title: "contributionData.leaderboard.titles.columnAuthor",
    },
    {
      rank: 2,
      username: "qiyue-hua",
      displayName: "contributionData.leaderboard.names.qiyueHua",
      points: 8900,
      title: "contributionData.leaderboard.titles.hardcore",
    },
    {
      rank: 3,
      username: "qiyue-moran",
      displayName: "contributionData.leaderboard.names.qiyueMoran",
      points: 5200,
      title: "contributionData.leaderboard.titles.active",
    },
    {
      rank: 4,
      username: "physics-lover",
      displayName: "contributionData.leaderboard.names.physicsLover",
      points: 4500,
      title: "contributionData.leaderboard.titles.active",
    },
    {
      rank: 5,
      username: "qiyue-yuli",
      displayName: "contributionData.leaderboard.names.qiyueYuli",
      points: 3800,
      title: "contributionData.leaderboard.titles.active",
    },
    {
      rank: 6,
      username: "astronomy-fan",
      displayName: "contributionData.leaderboard.names.astronomyFan",
      points: 3200,
      title: "contributionData.leaderboard.titles.newcomer",
    },
    {
      rank: 7,
      username: "code-wizard",
      displayName: "contributionData.leaderboard.names.codeWizard",
      points: 2800,
      title: "contributionData.leaderboard.titles.newcomer",
    },
    {
      rank: 8,
      username: "math-genius",
      displayName: "contributionData.leaderboard.names.mathGenius",
      points: 2400,
      title: "contributionData.leaderboard.titles.newcomer",
    },
    {
      rank: 9,
      username: "chem-master",
      displayName: "contributionData.leaderboard.names.chemMaster",
      points: 2100,
      title: "contributionData.leaderboard.titles.newcomer",
    },
    {
      rank: 10,
      username: "qiyue-youzhi",
      displayName: "contributionData.leaderboard.names.qiyueYouzhi",
      // 名次与积分必须自洽：原值与 rank 9 同为 2100，会让「同分不同名次」出现在榜单里
      points: 1900,
      title: "contributionData.leaderboard.titles.fileExpert",
    },
  ],
};

export const tasks: Task[] = [
  {
    id: "t1",
    title: "contributionData.tasks.t1.title",
    description: "contributionData.tasks.t1.description",
    rewardPoints: 5,
    requirementCount: 1,
    currentProgress: 1,
    completed: true,
  },
  {
    id: "t2",
    title: "contributionData.tasks.t2.title",
    description: "contributionData.tasks.t2.description",
    rewardPoints: 10,
    requirementCount: 1,
    currentProgress: 0,
    completed: false,
  },
  {
    id: "t3",
    title: "contributionData.tasks.t3.title",
    description: "contributionData.tasks.t3.description",
    rewardPoints: 30,
    requirementCount: 3,
    currentProgress: 2,
    completed: false,
  },
  {
    id: "t4",
    title: "contributionData.tasks.t4.title",
    description: "contributionData.tasks.t4.description",
    rewardPoints: 5,
    requirementCount: 10,
    currentProgress: 7,
    completed: false,
  },
  {
    id: "t5",
    title: "contributionData.tasks.t5.title",
    description: "contributionData.tasks.t5.description",
    rewardPoints: 15,
    requirementCount: 1,
    currentProgress: 0,
    completed: false,
  },
];

/** 库存哨兵：-1 = 不限量（消费方按 stock > 0 判断低库存、stock === 0 判断下架） */
export const UNLIMITED_STOCK = -1;

export const exchangeItems: ExchangeItem[] = [
  {
    id: "e1",
    name: "contributionData.exchangeItems.e1.name",
    description: "contributionData.exchangeItems.e1.description",
    pointsCost: 200,
    stock: UNLIMITED_STOCK,
    isVirtual: true,
  },
  {
    id: "e2",
    name: "contributionData.exchangeItems.e2.name",
    description: "contributionData.exchangeItems.e2.description",
    pointsCost: 500,
    stock: UNLIMITED_STOCK,
    isVirtual: true,
  },
  {
    id: "e3",
    name: "contributionData.exchangeItems.e3.name",
    description: "contributionData.exchangeItems.e3.description",
    pointsCost: 1000,
    stock: 5,
    isVirtual: true,
  },
  {
    id: "e4",
    name: "contributionData.exchangeItems.e4.name",
    description: "contributionData.exchangeItems.e4.description",
    pointsCost: 800,
    stock: 50,
    isVirtual: false,
  },
  {
    id: "e5",
    name: "contributionData.exchangeItems.e5.name",
    description: "contributionData.exchangeItems.e5.description",
    pointsCost: 500,
    stock: 100,
    isVirtual: false,
  },
  {
    id: "e6",
    name: "contributionData.exchangeItems.e6.name",
    description: "contributionData.exchangeItems.e6.description",
    pointsCost: 1500,
    stock: 30,
    isVirtual: false,
  },
];
