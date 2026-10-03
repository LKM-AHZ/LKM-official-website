/** Network data for the shared treehole. Drafts and visual settings stay local. */
import { del, get, post, put } from "~/lib/http/client";
import type { Result } from "~/lib/errors/result";
import type { AppError } from "~/lib/errors/error-codes";

const base = "/api/v1/treehole";
let sessionPromise: Promise<void> | null = null;

async function value<T>(result: Promise<Result<T, AppError>>): Promise<T> {
  const response = await result;
  if (response.isErr()) throw response.error;
  return response.value;
}

export function ensureSession(): Promise<void> {
  if (!sessionPromise) {
    sessionPromise = value(post<{ ready: boolean }>(`${base}/session`))
      .then(() => undefined)
      .catch((error: unknown) => {
        sessionPromise = null;
        throw error;
      });
  }
  return sessionPromise;
}

export function showTreeholeError(error: unknown): void {
  console.error("[treehole] request failed", error);
  if (typeof window !== "undefined") {
    window.alert(
      error instanceof Error ? error.message : "树洞服务暂不可用，请稍后重试",
    );
  }
}

async function ready<T>(run: () => Promise<Result<T, AppError>>): Promise<T> {
  await ensureSession();
  return value(run());
}

export interface RemoteLetter {
  id: string;
  content: string;
  category: string;
  privacy: string;
  codename: string;
  moods: string[];
  tags: string[];
  sticker: string;
  paper: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  scheduledAt?: number;
  sealUntil?: number;
  likes: number;
  favorites: number;
  liked: boolean;
  favorited: boolean;
  isMine: boolean;
}

export type LetterWrite = Pick<
  RemoteLetter,
  | "content"
  | "category"
  | "privacy"
  | "codename"
  | "moods"
  | "tags"
  | "sticker"
  | "paper"
> & { scheduledAt?: number; sealUntil?: number };

export interface RemoteMessage {
  id: string;
  text: string;
  recalled: boolean;
  from: "me" | "peer";
  at: number;
}

export interface RemoteConversation {
  id: string;
  myLetterId: string;
  peerLetterId: string;
  peerCodename: string;
  myCodename: string;
  blocked: boolean;
  updatedAt: number;
  messages: RemoteMessage[];
}

export interface RemoteBottle {
  id: string;
  text: string;
  createdAt: number;
  ownerId?: string;
  picked: boolean;
  reply?: string;
  repliedAt?: number;
}

export interface RemoteWish {
  id: string;
  text: string;
  createdAt: number;
  ownerId?: string;
  lights: number;
}

async function allPages<T>(
  path: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const batch = await ready(() =>
      get<T[]>(`${base}/${path}`, { ...params, page, limit: 100 }),
    );
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

function allLetters(
  scope: "public" | "mine" | "random",
): Promise<RemoteLetter[]> {
  return allPages<RemoteLetter>("letters", { scope });
}

export const treeholeApi = {
  letters: allLetters,
  createLetter: (body: LetterWrite) =>
    ready(() => post<RemoteLetter>(`${base}/letters`, body)),
  editLetter: (id: string, body: LetterWrite) =>
    ready(() => put<RemoteLetter>(`${base}/letters/${id}`, body)),
  deleteLetter: (id: string) => ready(() => del(`${base}/letters/${id}`)),
  react: (id: string, kind: "like" | "favorite") =>
    ready(() =>
      post<{ active: boolean; letter: RemoteLetter }>(
        `${base}/letters/${id}/reactions/${kind}`,
      ),
    ),
  bottles: () => allPages<RemoteBottle>("bottles"),
  createBottle: (text: string) =>
    ready(() => post(`${base}/bottles`, { text })),
  replyBottle: (id: string, text: string) =>
    ready(() => post(`${base}/bottles/${id}/reply`, { text })),
  wishes: () => allPages<RemoteWish>("wishes"),
  createWish: (text: string) => ready(() => post(`${base}/wishes`, { text })),
  editWish: (id: string, text: string) =>
    ready(() => put(`${base}/wishes/${id}`, { text })),
  deleteWish: (id: string) => ready(() => del(`${base}/wishes/${id}`)),
  lightWish: (id: string) => ready(() => post(`${base}/wishes/${id}/light`)),
  conversations: () => allPages<RemoteConversation>("conversations"),
  replyLetter: (id: string, text: string) =>
    ready(() => post(`${base}/letters/${id}/reply`, { text })),
  sendMessage: (id: string, text: string) =>
    ready(() => post(`${base}/conversations/${id}/messages`, { text })),
  recallMessage: (id: string, messageId: string) =>
    ready(() =>
      post(`${base}/conversations/${id}/messages/${messageId}/recall`),
    ),
  blockConversation: (id: string) =>
    ready(() => post(`${base}/conversations/${id}/block`)),
  clearConversation: (id: string) =>
    ready(() => post(`${base}/conversations/${id}/clear`)),
  deleteConversation: (id: string) =>
    ready(() => del(`${base}/conversations/${id}`)),
  report: (
    targetType: "letter" | "bottle" | "wish",
    targetId: string,
    reason: string,
    detail: string,
  ) =>
    ready(() =>
      post(`${base}/reports`, { targetType, targetId, reason, detail }),
    ),
};
