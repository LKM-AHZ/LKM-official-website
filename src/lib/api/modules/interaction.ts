// src/lib/api/modules/interaction.ts — 内容收藏 / 浏览上报 / 浏览历史
// 契约 = 后端 /api/v1/interaction（app/modules/interaction/router.py），snake_case 原样透传。
// 依赖 src/lib/http/client 的 get/post/del（自动解包 {code,message,data}）返回 Result<T>。

import { del, get, post } from "../../http/client";
import type { PaginatedResponse } from "../types";

/** 收藏/取消收藏的返回：服务端权威状态与计数，用于校正本地乐观值。 */
export interface FavoriteState {
  content_id: string;
  favorited: boolean;
  bookmark_count: number;
}

/** 浏览上报结果（后端 upsert 幂等：重复上报只刷新 viewed_at）。 */
export interface ViewState {
  content_id: string;
  viewed_at: string;
}

/** 收藏 / 历史列表共用的内容摘要（后端 `_ContentSummaryItem`）。 */
interface ContentSummaryItem {
  content_id: string;
  content_type: string;
  title: string;
  slug: string | null;
  board_id: string;
}

/** 「我的收藏」列表项（后端 app/modules/interaction/schemas.py 的 FavoriteItem）。 */
export interface FavoriteItem extends ContentSummaryItem {
  created_at: string;
}

/** 「浏览历史」列表项（后端 HistoryItem，比收藏多的是 viewed_at）。 */
export interface HistoryItem extends ContentSummaryItem {
  viewed_at: string;
}

export const interactionApi = {
  favorite: (contentId: string) =>
    post<FavoriteState>(`/api/v1/interaction/favorites/${contentId}`),

  unfavorite: (contentId: string) =>
    del<FavoriteState>(`/api/v1/interaction/favorites/${contentId}`),

  myFavorites: (page = 1, limit = 20) =>
    get<PaginatedResponse<FavoriteItem>>("/api/v1/interaction/me/favorites", {
      page,
      limit,
    }),

  /** 浏览上报：同内容重复调用幂等（只刷新时间），失败由调用方决定是否提示。 */
  reportView: (contentId: string) =>
    post<ViewState>(`/api/v1/interaction/views/${contentId}`),

  myHistory: (page = 1, limit = 20) =>
    get<PaginatedResponse<HistoryItem>>("/api/v1/interaction/me/history", {
      page,
      limit,
    }),
};
