import { get, post } from "~/lib/http/client";
import type { StarHopeEntity } from "./mapping";

export interface StarHopePullData {
  items: Record<string, unknown>[];
  tombstones: { id: string; deleted_at: string }[];
  server_time: string;
}

export interface StarHopePushResult {
  synced: number;
  server_time: string;
}

// 后端路由前缀集中一处，避免 pull/push 各写一遍导致版本号或路径漂移
const STARHOPE_API_BASE = "/api/v1/starhope";

export const starhopeApi = {
  // entity 是动态路径段，一律按 URI 组件编码，避免含 / 等字符时拼出意外路由
  pull: (entity: StarHopeEntity, since?: string) =>
    get<StarHopePullData>(
      `${STARHOPE_API_BASE}/${encodeURIComponent(entity)}`,
      since ? { since } : undefined,
    ),
  push: (
    entity: StarHopeEntity,
    upserts: Record<string, unknown>[],
    deletes: { id: string; deleted_at: string }[],
  ) =>
    post<StarHopePushResult>(
      `${STARHOPE_API_BASE}/${encodeURIComponent(entity)}/sync`,
      {
        upserts,
        deletes,
      },
    ),
};
