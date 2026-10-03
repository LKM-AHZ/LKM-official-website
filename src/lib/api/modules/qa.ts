// QA 问答 API 客户端 —— 对接后端 /api/v1/content/qa/*
//
// 后端 QuestionOut 为 snake_case 字段，这里在客户端层映射为 UI 使用的 camelCase 形状。
// 读走通用 `get`（返回解包 ApiResp.data 的 Result），写走 `get/post`。

import { get, getHttpAccessToken, post } from "../../http/client";
import { apiFetch } from "../fetch";
import type { PaginatedResponse } from "../types";

export type { PaginatedResponse } from "../types";

export type QaCategory = "help" | "volunteer";
export type QaSort = "newest" | "bounty";

/** 提问列表项展示形状（camelCase）。 */
export interface QuestionSummary {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  category: QaCategory;
  status: string; // open | accepted | closed
  bountyPeople: number;
  bountyPerPerson: number;
  bountyTotal: number;
  bountyDistributed: number;
  bountyExpiresAt: string | null;
  urgent: boolean;
  acceptedAnswerId: string | null;
  answerCount: number;
  createdAt: string;
}

export interface QaAnswer {
  id: string;
  questionId: string;
  authorId: string;
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
  bountyDays: number;
  urgent: boolean;
}

/** 后端 QuestionOut / QuestionDetail 的 snake_case 形状。 */
interface BackendQuestion {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  situation: string;
  content: string;
  bounty_people: number;
  bounty_per_person: number;
  bounty_total: number;
  bounty_distributed: number;
  bounty_expires_at: string | null;
  urgent: boolean;
  status: string;
  category: QaCategory;
  accepted_answer_id: string | null;
  answer_count: number;
  created_at: string;
}

interface BackendAnswer {
  id: string;
  question_id: string;
  author_id: string;
  content: string;
  is_accepted: boolean;
  created_at: string;
}

/** 详情端点比列表多出的字段：原先在两处（mapDetail 入参与 getQuestion 的泛型）各内联一遍，易漂移 */
interface BackendQuestionDetail extends BackendQuestion {
  situation: string;
  images: string[];
  answers: BackendAnswer[];
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
    authorId: b.author_id,
    authorName: b.author_name,
    title: b.title,
    content: b.content,
    category: b.category,
    status: b.status,
    bountyPeople: b.bounty_people,
    bountyPerPerson: b.bounty_per_person,
    bountyTotal: b.bounty_total,
    bountyDistributed: b.bounty_distributed,
    bountyExpiresAt: b.bounty_expires_at ?? null,
    urgent: b.urgent ?? false,
    acceptedAnswerId: b.accepted_answer_id,
    answerCount: b.answer_count,
    createdAt: b.created_at,
  };
}

function mapDetail(b: BackendQuestionDetail): QuestionDetail {
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
    sort: QaSort = "newest",
  ): Promise<QuestionSummary[]> {
    const res = await get<PaginatedResponse<BackendQuestion>>(
      "/api/v1/content/qa/questions",
      {
        page,
        limit,
        sort,
        ...(category ? { category } : {}),
      },
    );
    if (res.isErr()) return [];
    return (res.value.items ?? []).map(mapQuestion);
  },

  /** 提问详情。 */
  async getQuestion(id: string): Promise<QuestionDetail | null> {
    const res = await get<BackendQuestionDetail>(
      `/api/v1/content/qa/questions/${id}`,
    );
    if (res.isErr()) return null;
    return mapDetail(res.value);
  },

  /** 提交提问。 */
  async createQuestion(
    input: QuestionCreateInput,
  ): Promise<QuestionSummary | null> {
    const res = await post<BackendQuestion>("/api/v1/content/qa/questions", {
      title: input.title,
      situation: input.situation,
      content: input.content,
      category: input.category ?? "help",
      bounty_people: input.bountyPeople,
      bounty_per_person: input.bountyPerPerson,
      bounty_days: input.bountyDays,
      urgent: input.urgent,
      images: [],
    });
    if (res.isErr()) return null;
    return mapQuestion(res.value);
  },

  /** 回答问题。 */
  async createAnswer(
    questionId: string,
    content: string,
  ): Promise<QaAnswer | null> {
    const res = await post<BackendAnswer>(
      `/api/v1/content/qa/questions/${questionId}/answers`,
      { content },
    );
    if (res.isErr()) return null;
    return mapAnswer(res.value);
  },

  async acceptAnswer(
    questionId: string,
    answerId: string,
  ): Promise<QaAnswer | null> {
    const res = await post<BackendAnswer>(
      `/api/v1/content/qa/questions/${questionId}/accept`,
      { answer_id: answerId },
    );
    return res.isOk() ? mapAnswer(res.value) : null;
  },

  async closeQuestion(questionId: string): Promise<QuestionSummary | null> {
    const res = await post<BackendQuestion>(
      `/api/v1/content/qa/questions/${questionId}/close`,
      {},
    );
    return res.isOk() ? mapQuestion(res.value) : null;
  },

  async uploadImage(
    questionId: string,
    imageId: string,
    image: Blob,
  ): Promise<string | null> {
    const form = new FormData();
    form.append("file", image, "question-image");
    form.append("image_id", imageId);
    const token = getHttpAccessToken();
    const response = await apiFetch(
      `/api/v1/content/qa/questions/${questionId}/images`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
        timeout: 60_000,
      },
    );
    if (response.isErr() || !response.value.ok) return null;
    const payload = (await response.value.json()) as {
      data?: { url?: string };
    };
    return payload.data?.url ?? null;
  },
};
