// src/lib/api/modules/timeline.ts — 时间线（read-time 合流 feed）
// 契约 = 后端 /api/v1。游标分页（无 X-Total），data = {items, next_cursor}。

import { get } from "../../http/client";

export type FeedItemType =
  "discussion" | "article" | "column" | "qa" | "project" | "blog";

export interface FeedItem {
  item_type: FeedItemType;
  id: number;
  author_id: number | null;
  author_name: string;
  title: string;
  content_preview: string;
  created_at: string;
  sort_score: number;
  board_id: number | null;
  url: string;
}

export interface FeedResponse {
  items: FeedItem[];
  next_cursor: string | null;
}

export type TimelineMode = "follow" | "hot";

export const timelineApi = {
  /** cursor 为 base64 的 "{iso}|{id}"；next_cursor 为空表示已到末尾。 */
  getFeed: (mode: TimelineMode, cursor?: string | null, limit = 20) => {
    const params: Record<string, unknown> = { mode, limit };
    if (cursor) params.cursor = cursor;
    return get<FeedResponse>("/api/v1/timeline", params);
  },
};
