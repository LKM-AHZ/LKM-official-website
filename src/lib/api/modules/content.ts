// 统一内容数据层 — 社区论坛唯一内容源（后端 /api/v1/content）
//
// 收敛五套旧内容模块（forum / articles / columns / blog 阅读 / news）为单一
// contentApi：讨论帖、官方文章、专栏连载、博客发布产物统一为 ContentItem，
// 由 content_type 判别，board_id 作统一分类轴。
//
// 读方法（listBoards / listItems / getItem / getItemBySlug / listComments）
// 走 GraphQL 只读查询（urql graphqlClient），将后端 camelCase 字段映射为
// snake_case 公共类型；写方法（create/delete/like/createComment）保留 REST。

import { post, del } from "../../http/client";
import { ok, err } from "../../errors/result";
import { AppError, ErrorCode } from "../../errors/error-codes";
import { graphqlClient } from "../graphql";
import {
  BOARDS,
  CONTENT_ITEMS,
  CONTENT_ITEM,
  CONTENT_ITEM_BY_SLUG,
  CONTENT_COMMENTS,
} from "./content.graphql";

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
  "discussion" | "article" | "column_post" | "blog_post" | "qa";

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
  qa_question_id: number | null;
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

/** 统一 GraphQL 错误 → AppError（区分网络层 vs GraphQL 业务错误） */
function mapErr(
  error:
    | {
        message: string;
        graphQLErrors?: { message: string }[];
        networkError?: Error;
      }
    | string
    | null
    | undefined,
): AppError {
  if (error && typeof error === "object") {
    // graphQLErrors = 业务/校验类错误(如字段校验、实体不存在以错误返回),
    // networkError = 真实网络/连接失败。二者用不同 ErrorCode 区分。
    if (error.networkError === undefined && error.graphQLErrors?.length) {
      return new AppError(
        ErrorCode.VALIDATION_ERROR,
        error.graphQLErrors.map((e) => e.message).join("; ") || "graphql error",
      );
    }
    return new AppError(
      ErrorCode.NETWORK_ERROR,
      error.message || "graphql error",
    );
  }
  return new AppError(
    ErrorCode.NETWORK_ERROR,
    String(error || "graphql error"),
  );
}

/** GraphBoard（camelCase）→ BoardItem（snake_case） */
function mapBoard(b: {
  id: number;
  slug: string;
  title: string;
  description: string;
  parentId: number | null;
  ownerId: number | null;
  status: string;
  requireCertified: boolean;
  dailyPostLimit: number;
  isPublic: boolean;
}): BoardItem {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    description: b.description,
    parent_id: b.parentId,
    owner_id: b.ownerId,
    status: b.status,
    require_certified: b.requireCertified,
    daily_post_limit: b.dailyPostLimit,
    is_public: b.isPublic,
  };
}

/** GraphContentItem（camelCase）→ ContentItem（snake_case） */
function mapItem(i: {
  id: number;
  contentType: string;
  boardId: number;
  authorId: number | null;
  authorName: string;
  publisher: string | null;
  department: string | null;
  columnId: number | null;
  columnTitle: string;
  qaQuestionId: number | null;
  slug: string | null;
  title: string;
  excerpt: string;
  summary: string | null;
  cover: string | null;
  keywords: string[];
  content: string;
  tags: string[];
  status: string;
  isPinned: boolean;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  forwardCount: number;
  readingTime: number;
  createdAt: string;
  publishedAt: string | null;
}): ContentItem {
  return {
    id: i.id,
    content_type: i.contentType as ContentType,
    board_id: i.boardId,
    author_id: i.authorId,
    author_name: i.authorName,
    publisher: i.publisher,
    department: i.department,
    column_id: i.columnId,
    column_title: i.columnTitle,
    qa_question_id: i.qaQuestionId,
    slug: i.slug,
    title: i.title,
    excerpt: i.excerpt,
    summary: i.summary,
    cover: i.cover,
    keywords: i.keywords,
    content: i.content,
    tags: i.tags,
    status: i.status,
    is_pinned: i.isPinned,
    is_featured: i.isFeatured,
    view_count: i.viewCount,
    like_count: i.likeCount,
    comment_count: i.commentCount,
    bookmark_count: i.bookmarkCount,
    forward_count: i.forwardCount,
    reading_time: i.readingTime,
    created_at: i.createdAt,
    published_at: i.publishedAt,
  };
}

/** GraphContentComment（camelCase）→ ContentComment（snake_case） */
function mapComment(c: {
  id: number;
  contentId: number;
  authorId: number;
  authorName: string;
  content: string;
  floorNumber: number;
  parentId: number | null;
  likeCount: number;
  createdAt: string;
}): ContentComment {
  return {
    id: c.id,
    content_id: c.contentId,
    author_id: c.authorId,
    author_name: c.authorName,
    content: c.content,
    floor_number: c.floorNumber,
    parent_id: c.parentId,
    like_count: c.likeCount,
    created_at: c.createdAt,
  };
}

export const contentApi = {
  /** 板块列表（论坛分类轴） */
  async listBoards() {
    const r = await graphqlClient.query(BOARDS, {}).toPromise();
    if (r.error) return err(mapErr(r.error));
    const boards = (r.data?.boards ?? []).map(mapBoard);
    return ok({ items: boards });
  },

  /** 内容列表（统一分页） */
  async listItems(args?: {
    page?: number;
    limit?: number;
    board_id?: number;
    content_type?: ContentType;
  }) {
    const r = await graphqlClient
      .query(CONTENT_ITEMS, {
        page: args?.page ?? 1,
        pageSize: args?.limit ?? 20,
        boardId: args?.board_id ?? null,
        contentType: args?.content_type ?? null,
      })
      .toPromise();
    if (r.error) return err(mapErr(r.error));
    const d = r.data?.contentItems;
    return ok({
      items: (d?.items ?? []).map(mapItem),
      total: d?.total ?? 0,
      page: d?.page ?? 1,
      pages: d?.pages ?? 1,
    });
  },

  /** 按 id 取内容详情 */
  async getItem(id: number) {
    const r = await graphqlClient.query(CONTENT_ITEM, { id }).toPromise();
    if (r.error) return err(mapErr(r.error));
    if (!r.data?.contentItem)
      return err(new AppError(ErrorCode.DOCUMENT_NOT_FOUND, "not found"));
    return ok(mapItem(r.data.contentItem));
  },

  /** 按 slug 取内容详情 */
  async getItemBySlug(slug: string) {
    const r = await graphqlClient
      .query(CONTENT_ITEM_BY_SLUG, { slug })
      .toPromise();
    if (r.error) return err(mapErr(r.error));
    if (!r.data?.contentItemBySlug)
      return err(new AppError(ErrorCode.DOCUMENT_NOT_FOUND, "not found"));
    return ok(mapItem(r.data.contentItemBySlug));
  },

  /** 评论列表（统一分页） */
  async listComments(itemId: number, page = 1, limit = 20) {
    const r = await graphqlClient
      .query(CONTENT_COMMENTS, { itemId, page, pageSize: limit })
      .toPromise();
    if (r.error) return err(mapErr(r.error));
    const d = r.data?.contentComments;
    return ok({
      items: (d?.items ?? []).map(mapComment),
      total: d?.total ?? 0,
      page: d?.page ?? 1,
      pages: d?.pages ?? 1,
    });
  },

  // —— 以下写方法保留 REST ——
  createItem: (data: ContentCreateInput) =>
    post<ContentItem>("/api/v1/content/items", data),

  deleteItem: (id: number) => del<void>(`/api/v1/content/items/${id}`),

  likeItem: (id: number) => post<void>(`/api/v1/content/items/${id}/like`),

  unlikeItem: (id: number) => del<void>(`/api/v1/content/items/${id}/like`),

  createComment: (
    itemId: number,
    data: { content: string; parent_id?: number | null },
  ) => post<ContentComment>(`/api/v1/content/items/${itemId}/comments`, data),
};
