import { afterEach, expect, it, vi } from "vitest";
import { get } from "../client";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** 后端 RBAC 拒绝：`{"code":2,"message":"Missing permission: notification.read"}` */
function forbiddenResponse(): Response {
  const body = { code: 2, message: "Missing permission: notification.read" };
  return new Response(JSON.stringify(body), { status: 403 });
}

it("4xx 的 HTTP 状态码落在 AppError.cause，供调用方区分 403 无权限与真故障", async () => {
  // NotificationBell 靠 `error.cause === 403` 把「没有 notification.read」与网络故障分开提示，
  // 这条约定由 toResult 构造 AppError 时的第三个参数承载 —— 改错了铃铛会静默退回「加载失败」。
  vi.stubGlobal("fetch", vi.fn(forbiddenResponse));

  const result = await get("/api/v1/notification/me/unread-count");

  expect(result.isErr()).toBe(true);
  if (!result.isErr()) return;
  expect(result.error.cause).toBe(403);
  // 状态码与后端 msg 同时出现在面向用户的文案里，便于直接看出不是网络问题
  expect(result.error.message).toContain("403");
  expect(result.error.message).toContain("Missing permission");
});
