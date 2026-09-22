// src/lib/api/modules/dlq.ts — 后台死信队列（DLQ）管理
// 契约 = 后端 /api/v1/admin/dlq，走后端 cookie 会话（adminFetch）。
// 端点：GET ""（按 status 列）、POST /{id}/requeue、POST /{id}/discard；
// 当前后端仅要求 require_admin（无 2FA step-up）。

import { adminFetch, readAdminResp } from "~/lib/api/admin";

export type DlqStatus = "pending" | "requeued" | "discarded";

export interface DlqMessageInfo {
  id: string;
  routing_key: string;
  status: string;
  attempts: number;
  reason: string | null;
  created_at: string | null;
  payload: unknown;
}

async function getJson(url: string): Promise<unknown> {
  const res = await adminFetch(url);
  const body = await readAdminResp(res);
  return body.data;
}

async function sendJson(url: string, method: string): Promise<unknown> {
  const res = await adminFetch(url, { method });
  const body = await readAdminResp(res);
  return body.data;
}

export const dlqApi = {
  list: (status: DlqStatus = "pending") =>
    getJson(`/api/v1/admin/dlq?status=${encodeURIComponent(status)}`).then(
      // 包络缺 data/items（空体、非 JSON、后端异常）时，原来是裸断言后直接取 .items，
      // 会抛 TypeError 或返回 undefined；这里退化成空列表
      (d) => {
        const items = (d as { items?: DlqMessageInfo[] } | null)?.items;
        return Array.isArray(items) ? items : [];
      },
    ),

  requeue: (id: string) => sendJson(`/api/v1/admin/dlq/${id}/requeue`, "POST"),

  discard: (id: string) => sendJson(`/api/v1/admin/dlq/${id}/discard`, "POST"),
};
