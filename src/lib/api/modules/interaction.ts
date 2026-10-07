// src/lib/api/modules/interaction.ts — 内容收藏
// 契约 = 后端 /api/v1/interaction（app/modules/interaction/router.py），snake_case 原样透传。
// 依赖 src/lib/http/client 的 get/post/del（自动解包 {code,message,data}）返回 Result<T>。
//
// 只收「收藏」这一条：浏览上报（/views）与浏览历史（/me/history）后端同样就绪但前端暂无
// 消费点，等有页面了再往这里加，不预先摆空壳。

import { del, get, post } from "../../http/client";
import type { PaginatedResponse } from "../types";

/** 收藏/取消收藏的返回：服务端权威状态与计数，用于校正本地乐观值。 */
export interface FavoriteState {
  content_id: string;
  favorited: boolean;
  bookmark_count: number;
}

/** 「我的收藏」列表项（后端 app/modules/interaction/schemas.py 的 FavoriteItem）。 */
export interface FavoriteItem {
  content_id: string;
  content_type: string;
  title: string;
  slug: string | null;
  board_id: string;
  created_at: string;
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
};
