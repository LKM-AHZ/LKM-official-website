// src/lib/api/modules/dlq.ts — 后台死信队列（DLQ）管理
// 契约 = 后端 /api/v1/admin/dlq，走后端 cookie 会话（adminFetch）。
// 端点：GET ""（按 status 列）、POST /{id}/requeue、POST /{id}/discard；
// 当前后端仅要求 require_admin（无 2FA step-up）。

import { adminFetch, readAdminResp } from "~/lib/api/admin";

export type DlqStatus = "pending" | "requeued" | "discarded";

export interface DlqMessageInfo {
  id: string;
  routing_key: string;
  /** 与 list(status) 共用同一联合，避免响应侧退化成裸 string 后与请求侧漂移 */
  status: DlqStatus;
  attempts: number;
  reason: string | null;
  created_at: string | null;
  payload: unknown;
}

/** 唯一的请求出口：GET 与 POST 只差 method，原先拆成的两个近乎相同的 helper 已合一 */
async function request(
  url: string,
  method: "GET" | "POST" = "GET",
): Promise<unknown> {
  const res = await adminFetch(url, { method });
  const body = await readAdminResp(res);
  return body.data;
}

export const dlqApi = {
  list: (status: DlqStatus = "pending") =>
    request(`/api/v1/admin/dlq?status=${encodeURIComponent(status)}`).then(
      // 包络缺 data/items（空体、非 JSON、后端异常）时，原来是裸断言后直接取 .items，
      // 会抛 TypeError 或返回 undefined；这里退化成空列表
      (d) => {
        const items = (d as { items?: DlqMessageInfo[] } | null)?.items;
        return Array.isArray(items) ? items : [];
      },
    ),

  requeue: (id: string) => request(`/api/v1/admin/dlq/${id}/requeue`, "POST"),

  discard: (id: string) => request(`/api/v1/admin/dlq/${id}/discard`, "POST"),
};
