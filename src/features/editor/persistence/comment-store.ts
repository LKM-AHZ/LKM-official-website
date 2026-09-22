import type { CommentReply, CommentThread } from "../engine/types";
import { t } from "~/lib/i18n";

function getKey(docId: string): string {
  return `lkm-editor-comments-${docId}`;
}

function isThread(item: unknown): item is CommentThread {
  if (!item || typeof item !== "object") return false;
  const thread = item as { id?: unknown; comments?: unknown; range?: unknown };
  return (
    typeof thread.id === "string" &&
    Array.isArray(thread.comments) &&
    !!thread.range &&
    typeof thread.range === "object"
  );
}

function read(docId: string): CommentThread[] {
  try {
    const raw = localStorage.getItem(getKey(docId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // 只挡住 JSON.parse 不够：损坏/被手改/旧 schema 的载荷会让调用方在读回的对象上
    // 直接 threads.push(...) / thread.comments.push(...) 抛未捕获的 TypeError
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isThread);
  } catch (err) {
    console.warn("[comment-store] 读取评论失败:", err);
    return [];
  }
}

function write(docId: string, threads: CommentThread[]): void {
  try {
    localStorage.setItem(getKey(docId), JSON.stringify(threads));
  } catch (err) {
    // 隐私模式 / localStorage 配额满时静默降级，不中断评论交互
    console.warn("[comment-store] 保存评论失败:", err);
  }
}

export function getThreads(docId: string): CommentThread[] {
  return read(docId);
}

export function addThread(
  docId: string,
  range: { from: number; to: number },
  text: string,
  initialComment = "",
): CommentThread {
  const threads = read(docId);
  const thread: CommentThread = {
    id: crypto.randomUUID(),
    range,
    text,
    resolved: false,
    comments: initialComment
      ? [
          {
            id: crypto.randomUUID(),
            text: initialComment,
            author: t("editor.me"),
            createdAt: new Date().toISOString(),
          },
        ]
      : [],
    createdAt: new Date().toISOString(),
  };
  threads.push(thread);
  write(docId, threads);
  return thread;
}

export function addReply(
  docId: string,
  threadId: string,
  text: string,
): CommentReply | null {
  const threads = read(docId);
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return null;
  const reply: CommentReply = {
    id: crypto.randomUUID(),
    text,
    author: t("editor.me"),
    createdAt: new Date().toISOString(),
  };
  thread.comments.push(reply);
  write(docId, threads);
  return reply;
}

export function resolveThread(docId: string, threadId: string): void {
  const threads = read(docId);
  const thread = threads.find((t) => t.id === threadId);
  if (thread) {
    thread.resolved = true;
    write(docId, threads);
  }
}

export function reopenThread(docId: string, threadId: string): void {
  const threads = read(docId);
  const thread = threads.find((t) => t.id === threadId);
  if (thread) {
    thread.resolved = false;
    write(docId, threads);
  }
}

export function deleteThread(docId: string, threadId: string): void {
  let threads = read(docId);
  threads = threads.filter((t) => t.id !== threadId);
  write(docId, threads);
}

export function clearComments(docId: string): void {
  localStorage.removeItem(getKey(docId));
}
