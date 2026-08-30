// QA 问答 API 客户端 —— 对接后端 /api/v1/content/qa/*
//
// 后端 QuestionOut 为 snake_case 字段，这里在客户端层映射为 UI 使用的 camelCase 形状。
// 读走通用 `get`（返回解包 ApiResp.data 的 Result），写走 `get/post`。

import { get, post } from "../../http/client";
import type { PaginatedResponse } from "../types";

export type { PaginatedResponse } from "../types";

export type QaCategory = "help" | "volunteer";

/** 提问列表项展示形状（camelCase）。 */
export interface QuestionSummary {
  id: number;
  authorName: string;
  title: string;
  content: string;
  category: QaCategory;
  status: string; // open | accepted | closed
  bountyPeople: number;
  bountyPerPerson: number;
  bountyTotal: number;
  bountyDistributed: number;
  acceptedAnswerId: number | null;
  answerCount: number;
  createdAt: string;
}

export interface QaAnswer {
  id: number;
  questionId: number;
  authorId: number;
  content: string;
  isAccepted: boolean;
  createdAt: string;
}

export interface QuestionDetail extends QuestionSummary {
  situation: string;
  images: string[];
  answers: QaAnswer[];
}

export interface QuestionCreateInput {
  title: string;
  situation: string;
  content: string;
  category?: QaCategory;
  bountyPeople: number;
  bountyPerPerson: number;
}

/** 后端 QuestionOut / QuestionDetail 的 snake_case 形状。 */
interface BackendQuestion {
  id: number;
  author_id: number;
  author_name: string;
  title: string;
  situation: string;
  content: string;
  bounty_people: number;
  bounty_per_person: number;
  bounty_total: number;
  bounty_distributed: number;
  status: string;
  category: QaCategory;
  accepted_answer_id: number | null;
  answer_count: number;
  created_at: string;
}

interface BackendAnswer {
  id: number;
  question_id: number;
  author_id: number;
  content: string;
  is_accepted: boolean;
  created_at: string;
}

function mapAnswer(a: BackendAnswer): QaAnswer {
  return {
    id: a.id,
    questionId: a.question_id,
    authorId: a.author_id,
    content: a.content,
    isAccepted: a.is_accepted,
    createdAt: a.created_at,
  };
}

function mapQuestion(b: BackendQuestion): QuestionSummary {
  return {
    id: b.id,
    authorName: b.author_name,
    title: b.title,
    content: b.content,
    category: b.category,
    status: b.status,
    bountyPeople: b.bounty_people,
    bountyPerPerson: b.bounty_per_person,
    bountyTotal: b.bounty_total,
    bountyDistributed: b.bounty_distributed,
    acceptedAnswerId: b.accepted_answer_id,
    answerCount: b.answer_count,
    createdAt: b.created_at,
  };
}

function mapDetail(
  b: BackendQuestion & {
    situation: string;
    images: string[];
    answers: BackendAnswer[];
  },
): QuestionDetail {
  return {
    ...mapQuestion(b),
    situation: b.situation,
    images: b.images ?? [],
    answers: (b.answers ?? []).map(mapAnswer),
  };
}

export const qaApi = {
  /** 提问列表（可按 category 过滤）。 */
  async listQuestions(
    category?: QaCategory,
    page = 1,
    limit = 20,
  ): Promise<QuestionSummary[]> {
    const res = await get<PaginatedResponse<BackendQuestion>>(
      "/api/v1/content/qa/questions",
      {
        page,
        limit,
        ...(category ? { category } : {}),
      },
    );
    if (res.isErr()) return [];
    return (res.value.items ?? []).map(mapQuestion);
  },

  /** 提问详情。 */
  async getQuestion(id: number): Promise<QuestionDetail | null> {
    const res = await get<BackendQuestion & { situation: string; images: string[]; answers: BackendAnswer[] }>(
      `/api/v1/content/qa/questions/${id}`,
    );
    if (res.isErr()) return null;
    return mapDetail(res.value);
  },

  /** 提交提问。 */
  async createQuestion(input: QuestionCreateInput): Promise<QuestionSummary | null> {
    const res = await post<BackendQuestion>("/api/v1/content/qa/questions", {
      title: input.title,
      situation: input.situation,
      content: input.content,
      category: input.category ?? "help",
      bounty_people: input.bountyPeople,
      bounty_per_person: input.bountyPerPerson,
      images: [],
    });
    if (res.isErr()) return null;
    return mapQuestion(res.value);
  },

  /** 回答问题。 */
  async createAnswer(
    questionId: number,
    content: string,
  ): Promise<QaAnswer | null> {
    const res = await post<BackendAnswer>(
      `/api/v1/content/qa/questions/${questionId}/answers`,
      { content },
    );
    if (res.isErr()) return null;
    return mapAnswer(res.value);
  },
};
