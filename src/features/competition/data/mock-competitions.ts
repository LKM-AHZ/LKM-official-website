export interface MockCompetition {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  duration: number; // 答题时长（分钟）
  status: "upcoming" | "ongoing" | "ended";
  participantCount: number;
  category: string;
}

export interface MockQuestion {
  id: string;
  // 只保留单选/判断：作答 UI（ExamInterface）用 answers[index] = 选项下标 存答案，
  // 不支持多选数组，数据集中也没有任何 multiple/数组答案，故不再声明该形状
  type: "single" | "true_false";
  stem: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: number;
}

/**
 * 由起止日期推导状态（单一事实来源）：写死的 status 会随日期推移与日期窗口脱节，
 * 而 CompetitionHall 正是按 status 分组的，脱节会让比赛归错组、徽章显示错误。
 * 起止按本地时间解析，结束当天仍算「进行中」。
 */
function deriveStatus(
  startDate: string,
  endDate: string,
): MockCompetition["status"] {
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
    startDate: "2026-07-20",
    endDate: "2026-08-10",
    duration: 120,
    participantCount: 156,
    category: "competitionData.competitions.comp1.category",
  },
  {
    id: "comp-2",
    title: "competitionData.competitions.comp2.title",
    description: "competitionData.competitions.comp2.description",
    startDate: "2026-08-15",
    endDate: "2026-08-25",
    // 数学建模挑战赛是持续多日的赛事（三人组队 + 提交论文），此处填的是赛事时长
    // 而非单次答题时长；答题计时由 ExamInterface 自己的 EXAM_SECONDS 控制
    duration: 4320,
    participantCount: 0,
    category: "competitionData.competitions.comp2.category",
  },
  {
    id: "comp-3",
    title: "competitionData.competitions.comp3.title",
    description: "competitionData.competitions.comp3.description",
    startDate: "2026-09-01",
    endDate: "2026-09-03",
    // 2880 分钟 = 48 小时，与 comp3 描述里的「48 小时极限编程挑战」一致
    duration: 2880,
    participantCount: 0,
    category: "competitionData.competitions.comp3.category",
  },
  {
    id: "comp-4",
    title: "competitionData.competitions.comp4.title",
    description: "competitionData.competitions.comp4.description",
    startDate: "2026-07-01",
    endDate: "2026-07-15",
    duration: 60,
    participantCount: 89,
    category: "competitionData.competitions.comp4.category",
  },
];

export const mockCompetitions: MockCompetition[] = competitionEntries.map(
  (c) => ({ ...c, status: deriveStatus(c.startDate, c.endDate) }),
);

export const mockQuestions: MockQuestion[] = [
  {
    id: "q1",
    type: "single",
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
  },
  {
    id: "q2",
    type: "single",
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
  },
  {
    id: "q3",
    type: "single",
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
  },
  {
    id: "q4",
    type: "true_false",
    stem: "competitionData.questions.q4.stem",
    options: [
      "competitionData.questions.q4.option0",
      "competitionData.questions.q4.option1",
    ],
    answer: 1,
    explanation: "competitionData.questions.q4.explanation",
    difficulty: 1,
  },
  {
    id: "q5",
    type: "single",
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
  },
  {
    id: "q6",
    type: "single",
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
  },
  {
    id: "q7",
    type: "single",
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
  },
  {
    id: "q8",
    type: "single",
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
  },
];

export const QUESTION_CATEGORIES = [
  "全部",
  "物理",
  "数学",
  "化学",
  "生物",
  "信息科学",
];
