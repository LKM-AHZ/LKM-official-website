// src/lib/api/modules/moderation.ts — 后台自动审校规则管理
// 契约 = 后端 /api/v1/admin/moderation，走后端 cookie 会话（adminFetch）。
// 写操作（增/改/删/测试）走 require_admin_2fa：adminFetch 遇 code=4 抛 AdminMFARequiredError，
// 由 UI 层（AdminMFAVerifyDialog）弹 step-up 后重试。

import { adminFetch, readAdminResp } from "~/lib/api/admin";

export type ModerationAction = "derank" | "hide";

export interface RuleInfo {
  id: number;
  pattern: string;
  is_regex: boolean;
  action: ModerationAction;
  weight: number;
  scope: string;
  enabled: boolean;
}

export interface RuleCreateInput {
  pattern: string;
  is_regex?: boolean;
  action?: ModerationAction;
  weight?: number;
  scope?: string;
  enabled?: boolean;
}

export interface RuleUpdateInput {
  pattern?: string;
  is_regex?: boolean;
  action?: ModerationAction;
  weight?: number;
  scope?: string;
  enabled?: boolean;
}

export interface RuleTestHit {
  pattern: string;
  is_regex: boolean;
  action: ModerationAction;
  weight: number;
  scope: string;
}

export interface RuleTestResult {
  matched: boolean;
  penalty: number;
  should_hide: boolean;
  hits: RuleTestHit[];
  total_rules: number;
}

function parse<T>(data: unknown): T {
  return data as unknown as T;
}

async function getJson(url: string): Promise<unknown> {
  const res = await adminFetch(url);
  const body = await readAdminResp(res);
  return body.data;
}

async function sendJson(
  url: string,
  method: string,
  payload?: unknown,
): Promise<unknown> {
  const res = await adminFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const body = await readAdminResp(res);
  return body.data;
}

export const moderationApi = {
  listRules: () =>
    getJson("/api/v1/admin/moderation/rules").then(
      (d) => parse<{ items: RuleInfo[] }>(d).items,
    ),

  createRule: (input: RuleCreateInput) =>
    sendJson("/api/v1/admin/moderation/rules", "POST", input).then((d) =>
      parse<RuleInfo>(d),
    ),

  updateRule: (id: number, input: RuleUpdateInput) =>
    sendJson(`/api/v1/admin/moderation/rules/${id}`, "PATCH", input).then((d) =>
      parse<RuleInfo>(d),
    ),

  deleteRule: (id: number) =>
    sendJson(`/api/v1/admin/moderation/rules/${id}`, "DELETE"),

  testRule: (text: string) =>
    sendJson("/api/v1/admin/moderation/rules/test", "POST", { text }).then(
      (d) => parse<RuleTestResult>(d),
    ),
};
