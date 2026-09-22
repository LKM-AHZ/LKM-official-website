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
  const thread = threads.find((item) => item.id === threadId);
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

/** resolve/reopen 只差一个布尔值：共用同一套「读-改-写」骨架，避免两份拷贝各自漂移 */
function setResolved(docId: string, threadId: string, resolved: boolean): void {
  const threads = read(docId);
  const thread = threads.find((item) => item.id === threadId);
  if (thread) {
    thread.resolved = resolved;
    write(docId, threads);
  }
}

export function resolveThread(docId: string, threadId: string): void {
  setResolved(docId, threadId, true);
}

export function reopenThread(docId: string, threadId: string): void {
  setResolved(docId, threadId, false);
}

export function deleteThread(docId: string, threadId: string): void {
  let threads = read(docId);
  threads = threads.filter((item) => item.id !== threadId);
  write(docId, threads);
}

export function clearComments(docId: string): void {
  // 与 read/write 保持一致：隐私模式/禁用存储时访问 localStorage 会抛 SecurityError，
  // 不该让它冒到调用方
  try {
    localStorage.removeItem(getKey(docId));
  } catch (err) {
    console.warn("[comment-store] 清空评论失败:", err);
  }
}
