export type CompetitionStatus = "upcoming" | "ongoing" | "ended";

export type QuestionType = "single" | "multiple" | "true_false" | "fill";

export type StageKey = "signup" | "warmup" | "official" | "review";

export interface CompetitionStage {
  key: StageKey;
  start: string;
  end: string;
}

export interface MockCompetition {
  id: string;
  title: string;
  description: string;
  reward: string; // i18n key：奖励规则
  startDate: string;
  endDate: string;
  duration: number; // 答题时长（分钟）
  status: CompetitionStatus;
  participantCount: number;
  category: string;
  teamMode: boolean; // 是否支持团队赛
  stages: CompetitionStage[]; // 全生命周期时间轴
}

/** 作答数据：单选/判断存选项下标，多选存下标数组，填空存文本 */
export type QuestionAnswer = number | number[] | string;

export interface MockQuestion {
  id: string;
  type: QuestionType;
  subject: string; // 学科（与 QUESTION_CATEGORIES 对齐）
  stem: string; // i18n key
  options: string[]; // i18n key（填空题为空数组）
  answer: QuestionAnswer;
  explanation: string; // i18n key
  difficulty: number; // 1-3
  tags: string[]; // 知识点标签（静态示例）
  accuracy: number; // 正确率 0-100
}

export interface MockRankEntry {
  rank: number;
  name: string; // i18n key 或占位名
  score: number;
  isSelf?: boolean;
}

/**
 * 由起止日期推导状态（单一事实来源）：写死的 status 会随日期推移与日期窗口脱节，
 * 而 CompetitionHall 正是按 status 分组的，脱节会让比赛归错组、徽章显示错误。
 * 起止按本地时间解析，结束当天仍算「进行中」。
 */
function deriveStatus(startDate: string, endDate: string): CompetitionStatus {
  const now = Date.now();
  if (now < Date.parse(`${startDate}T00:00:00`)) return "upcoming";
  if (now > Date.parse(`${endDate}T23:59:59`)) return "ended";
  return "ongoing";
}

const competitionEntries: Array<Omit<MockCompetition, "status">> = [
  {
    id: "comp-1",
    title: "competitionData.competitions.comp1.title",
    description: "competitionData.competitions.comp1.description",
    reward: "competitionData.competitions.comp1.reward",
    startDate: "2026-10-25",
    endDate: "2026-11-08",
    duration: 120,
    participantCount: 156,
    category: "competitionData.competitions.comp1.category",
    teamMode: false,
    stages: [
      { key: "signup", start: "2026-10-07", end: "2026-10-22" },
      { key: "warmup", start: "2026-10-22", end: "2026-10-25" },
      { key: "official", start: "2026-10-25", end: "2026-11-08" },
      { key: "review", start: "2026-11-08", end: "2026-11-15" },
    ],
  },
  {
    id: "comp-2",
    title: "competitionData.competitions.comp2.title",
    description: "competitionData.competitions.comp2.description",
    reward: "competitionData.competitions.comp2.reward",
    startDate: "2026-10-05",
    endDate: "2026-10-20",
    // 数学建模挑战赛是持续多日的赛事（三人组队 + 提交论文），此处填的是赛事时长
    // 而非单次答题时长；答题计时由 ExamInterface 自己的 EXAM_SECONDS 控制
    duration: 4320,
    participantCount: 328,
    category: "competitionData.competitions.comp2.category",
    teamMode: true,
    stages: [
      { key: "signup", start: "2026-09-20", end: "2026-10-04" },
      { key: "warmup", start: "2026-10-04", end: "2026-10-05" },
      { key: "official", start: "2026-10-05", end: "2026-10-20" },
      { key: "review", start: "2026-10-20", end: "2026-10-27" },
    ],
  },
  {
    id: "comp-3",
    title: "competitionData.competitions.comp3.title",
    description: "competitionData.competitions.comp3.description",
    reward: "competitionData.competitions.comp3.reward",
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    // 2880 分钟 = 48 小时，与 comp3 描述里的「48 小时极限编程挑战」一致
    duration: 2880,
    participantCount: 64,
    category: "competitionData.competitions.comp3.category",
    teamMode: true,
    stages: [
      { key: "signup", start: "2026-10-20", end: "2026-11-08" },
      { key: "warmup", start: "2026-11-08", end: "2026-11-10" },
      { key: "official", start: "2026-11-10", end: "2026-11-12" },
      { key: "review", start: "2026-11-12", end: "2026-11-19" },
    ],
  },
  {
    id: "comp-4",
    title: "competitionData.competitions.comp4.title",
    description: "competitionData.competitions.comp4.description",
    reward: "competitionData.competitions.comp4.reward",
    startDate: "2026-09-10",
    endDate: "2026-09-20",
    duration: 60,
    participantCount: 89,
    category: "competitionData.competitions.comp4.category",
    teamMode: false,
    stages: [
      { key: "signup", start: "2026-08-20", end: "2026-09-08" },
      { key: "warmup", start: "2026-09-08", end: "2026-09-10" },
      { key: "official", start: "2026-09-10", end: "2026-09-20" },
      { key: "review", start: "2026-09-20", end: "2026-09-27" },
    ],
  },
];

export const mockCompetitions: MockCompetition[] = competitionEntries.map(
  (c) => ({ ...c, status: deriveStatus(c.startDate, c.endDate) }),
);

export const mockQuestions: MockQuestion[] = [
  {
    id: "q1",
    type: "single",
    subject: "物理",
    stem: "competitionData.questions.q1.stem",
    options: [
      "competitionData.questions.q1.option0",
      "competitionData.questions.q1.option1",
      "competitionData.questions.q1.option2",
      "competitionData.questions.q1.option3",
    ],
    answer: 2,
    explanation: "competitionData.questions.q1.explanation",
    difficulty: 1,
    tags: ["光学", "基础"],
    accuracy: 92,
  },
  {
    id: "q2",
    type: "single",
    subject: "物理",
    stem: "competitionData.questions.q2.stem",
    options: [
      "competitionData.questions.q2.option0",
      "competitionData.questions.q2.option1",
      "competitionData.questions.q2.option2",
      "competitionData.questions.q2.option3",
    ],
    answer: 2,
    explanation: "competitionData.questions.q2.explanation",
    difficulty: 2,
    tags: ["力学", "电磁学"],
    accuracy: 68,
  },
  {
    id: "q3",
    type: "single",
    subject: "物理",
    stem: "competitionData.questions.q3.stem",
    options: [
      "competitionData.questions.q3.option0",
      "competitionData.questions.q3.option1",
      "competitionData.questions.q3.option2",
      "competitionData.questions.q3.option3",
    ],
    answer: 1,
    explanation: "competitionData.questions.q3.explanation",
    difficulty: 1,
    tags: ["力学", "牛顿定律"],
    accuracy: 88,
  },
  {
    id: "q4",
    type: "true_false",
    subject: "物理",
    stem: "competitionData.questions.q4.stem",
    options: [
      "competitionData.questions.q4.option0",
      "competitionData.questions.q4.option1",
    ],
    answer: 1,
    explanation: "competitionData.questions.q4.explanation",
    difficulty: 1,
    tags: ["声学", "基础"],
    accuracy: 81,
  },
  {
    id: "q5",
    type: "single",
    subject: "物理",
    stem: "competitionData.questions.q5.stem",
    options: [
      "competitionData.questions.q5.option0",
      "competitionData.questions.q5.option1",
      "competitionData.questions.q5.option2",
      "competitionData.questions.q5.option3",
    ],
    answer: 2,
    explanation: "competitionData.questions.q5.explanation",
    difficulty: 1,
    tags: ["矢量", "力学"],
    accuracy: 76,
  },
  {
    id: "q6",
    type: "single",
    subject: "物理",
    stem: "competitionData.questions.q6.stem",
    options: [
      "competitionData.questions.q6.option0",
      "competitionData.questions.q6.option1",
      "competitionData.questions.q6.option2",
      "competitionData.questions.q6.option3",
    ],
    answer: 1,
    explanation: "competitionData.questions.q6.explanation",
    difficulty: 2,
    tags: ["电磁学", "电路"],
    accuracy: 71,
  },
  {
    id: "q7",
    type: "single",
    subject: "数学",
    stem: "competitionData.questions.q7.stem",
    options: [
      "competitionData.questions.q7.option0",
      "competitionData.questions.q7.option1",
      "competitionData.questions.q7.option2",
      "competitionData.questions.q7.option3",
    ],
    answer: 1,
    explanation: "competitionData.questions.q7.explanation",
    difficulty: 1,
    tags: ["代数", "基础"],
    accuracy: 95,
  },
  {
    id: "q8",
    type: "single",
    subject: "计算机",
    stem: "competitionData.questions.q8.stem",
    options: [
      "competitionData.questions.q8.option0",
      "competitionData.questions.q8.option1",
      "competitionData.questions.q8.option2",
      "competitionData.questions.q8.option3",
    ],
    answer: 2,
    explanation: "competitionData.questions.q8.explanation",
    difficulty: 2,
    tags: ["算法", "时间复杂度"],
    accuracy: 64,
  },
  {
    id: "q9",
    type: "multiple",
    subject: "化学",
    stem: "competitionData.questions.q9.stem",
    options: [
      "competitionData.questions.q9.option0",
      "competitionData.questions.q9.option1",
      "competitionData.questions.q9.option2",
      "competitionData.questions.q9.option3",
    ],
    answer: [0, 2],
    explanation: "competitionData.questions.q9.explanation",
    difficulty: 2,
    tags: ["溶液", "基础"],
    accuracy: 58,
  },
  {
    id: "q10",
    type: "fill",
    subject: "生物",
    stem: "competitionData.questions.q10.stem",
    options: [],
    answer: "叶绿体",
    explanation: "competitionData.questions.q10.explanation",
    difficulty: 1,
    tags: ["细胞", "光合作用"],
    accuracy: 73,
  },
];

export const QUESTION_CATEGORIES = [
  "全部",
  "数学",
  "物理",
  "化学",
  "生物",
  "计算机",
];

/** 占位排行榜：key 为竞赛 id，Top 10 */
export const mockLeaderboards: Record<string, MockRankEntry[]> = {
  "comp-1": [
    { rank: 1, name: "物理探路者", score: 98 },
    { rank: 2, name: "光之子", score: 95 },
    { rank: 3, name: "电磁侠", score: 92 },
    { rank: 4, name: "牛顿门徒", score: 89 },
    { rank: 5, name: "相对论学徒", score: 87 },
    { rank: 6, name: "量子小白", score: 84 },
    { rank: 7, name: "力学王", score: 81 },
    { rank: 8, name: "波动公主", score: 79 },
    { rank: 9, name: "热力学手", score: 76 },
    { rank: 10, name: "光学猎人", score: 74, isSelf: true },
  ],
  "comp-2": [
    { rank: 1, name: "建模天团", score: 96 },
    { rank: 2, name: "三剑客", score: 93 },
    { rank: 3, name: "数据驱动", score: 90 },
    { rank: 4, name: "拉格朗日队", score: 88 },
    { rank: 5, name: "优化之家", score: 85 },
    { rank: 6, name: "微分方程", score: 82 },
    { rank: 7, name: "概率联队", score: 79 },
    { rank: 8, name: "蒙特卡洛", score: 77 },
    { rank: 9, name: "矩阵大师", score: 75 },
    { rank: 10, name: "我的小队", score: 72, isSelf: true },
  ],
  "comp-3": [
    { rank: 1, name: "Bug终结者", score: 100 },
    { rank: 2, name: "异步之王", score: 97 },
    { rank: 3, name: "指针水手", score: 94 },
    { rank: 4, name: "算法猎人", score: 91 },
    { rank: 5, name: "重构精灵", score: 88 },
    { rank: 6, name: "容器客", score: 85 },
    { rank: 7, name: "并发大师", score: 82 },
    { rank: 8, name: "正则武士", score: 79 },
    { rank: 9, name: "栈溢出者", score: 77 },
    { rank: 10, name: "夜猫子", score: 74, isSelf: true },
  ],
};
