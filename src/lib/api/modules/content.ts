// 统一内容数据层 — 社区论坛唯一内容源（后端 /api/v1/content）
//
// 收敛五套旧内容模块（forum / articles / columns / blog 阅读 / news）为单一
// contentApi：讨论帖、官方文章、专栏连载、博客发布产物统一为 ContentItem，
// 由 content_type 判别，board_id 作统一分类轴。

import { get, post, del } from "../../http/client";
import type { PaginatedResponse } from "../types";

export type { PaginatedResponse } from "../types";

/** 板块（boards 是统一分类轴：forum/columns 都已挂 board_id，支持父/子层级） */
export interface BoardItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  parent_id: number | null;
  owner_id: number | null;
  status: string;
  require_certified: boolean;
  daily_post_limit: number;
  is_public: boolean;
}

export type ContentType =
  | "discussion"
  | "article"
  | "column_post"
  | "blog_post";

export interface ContentItem {
  id: number;
  content_type: ContentType;
  board_id: number;
  author_id: number | null;
  author_name: string;
  publisher: string | null;
  department: string | null;
  column_id: number | null;
  column_title: string;
  slug: string | null;
  title: string;
  excerpt: string;
  summary: string | null;
  cover: string | null;
  keywords: string[];
  content: string;
  tags: string[];
  status: string;
  is_pinned: boolean;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  bookmark_count: number;
  forward_count: number;
  reading_time: number;
  created_at: string;
  published_at: string | null;
}

export interface ContentComment {
  id: number;
  content_id: number;
  author_id: number;
  author_name: string;
  content: string;
  floor_number: number;
  parent_id: number | null;
  like_count: number;
  created_at: string;
}

export interface ContentCreateInput {
  content_type?: ContentType;
  board_id: number;
  title: string;
  content: string;
  summary?: string | null;
  cover?: string | null;
  tags?: string[];
  slug?: string | null;
  publisher?: string | null;
  department?: string | null;
  keywords?: string[];
  column_id?: number | null;
  status?: string;
  is_pinned?: boolean;
  is_featured?: boolean;
}

export const contentApi = {
  listBoards: () => get<{ items: BoardItem[] }>("/api/v1/boards"),

  listItems: (args?: {
    page?: number;
    limit?: number;
    board_id?: number;
    content_type?: ContentType;
  }) =>
    get<PaginatedResponse<ContentItem>>("/api/v1/content/items", {
      page: args?.page ?? 1,
      limit: args?.limit ?? 20,
      ...(args?.board_id ? { board_id: args.board_id } : {}),
      ...(args?.content_type ? { content_type: args.content_type } : {}),
    }),

  getItem: (id: number) => get<ContentItem>(`/api/v1/content/items/${id}`),

  getItemBySlug: (slug: string) =>
    get<ContentItem>(`/api/v1/content/by-slug/${slug}`),

  createItem: (data: ContentCreateInput) =>
    post<ContentItem>("/api/v1/content/items", data),

  deleteItem: (id: number) => del<void>(`/api/v1/content/items/${id}`),

  likeItem: (id: number) => post<void>(`/api/v1/content/items/${id}/like`),

  unlikeItem: (id: number) => del<void>(`/api/v1/content/items/${id}/like`),

  listComments: (itemId: number, page = 1, limit = 20) =>
    get<PaginatedResponse<ContentComment>>(
      `/api/v1/content/items/${itemId}/comments`,
      { page, limit },
    ),

  createComment: (
    itemId: number,
    data: { content: string; parent_id?: number | null },
  ) => post<ContentComment>(`/api/v1/content/items/${itemId}/comments`, data),
};
