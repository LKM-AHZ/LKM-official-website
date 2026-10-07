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
  CONTENT_VIEWER_STATE,
} from "./content.graphql";

export type { PaginatedResponse } from "../types";

/** 板块（boards 是统一分类轴：forum/columns 都已挂 board_id，支持父/子层级） */
export interface BoardItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  parent_id: string | null;
  owner_id: string | null;
  status: string;
  require_certified: boolean;
  daily_post_limit: number;
  is_public: boolean;
}

export type ContentType =
  "discussion" | "article" | "column_post" | "blog_post" | "qa";

const CONTENT_TYPES: readonly ContentType[] = [
  "discussion",
  "article",
  "column_post",
  "blog_post",
  "qa",
];

/** 后端枚举属外部输入：未知值不能直接断言进联合类型，回退为最通用的 discussion */
function toContentType(value: unknown): ContentType {
  return typeof value === "string" &&
    (CONTENT_TYPES as readonly string[]).includes(value)
    ? (value as ContentType)
    : "discussion";
}

export interface ContentItem {
  id: string;
  content_type: ContentType;
  board_id: string;
  author_id: string | null;
  author_name: string;
  publisher: string | null;
  department: string | null;
  column_id: string | null;
  column_title: string;
  qa_question_id: string | null;
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
  id: string;
  content_id: string;
  author_id: string;
  author_name: string;
  content: string;
  floor_number: number;
  parent_id: string | null;
  like_count: number;
  /** 当前登录用户是否已给这条评论点赞；未登录时后端恒回 false */
  liked: boolean;
  created_at: string;
}

/** 详情页互动按钮的初值（当前用户是否已赞/已藏 + 两个计数）。 */
export interface ContentViewerState {
  liked: boolean;
  favorited: boolean;
  like_count: number;
  bookmark_count: number;
}

/** 点赞/取消点赞接口的返回：服务端权威计数，用于校正本地乐观值。 */
export interface LikeState {
  like_count: number;
}

/** 转发上报的返回：服务端权威转发数。 */
export interface ForwardState {
  forward_count: number;
}

/** 可举报的内容目标。后端入参也是这两个字面量（content/schemas.py 的 ContentReportCreate）。 */
export type ReportTargetType = "post" | "comment";

export interface ReportInput {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
}

export interface ContentCreateInput {
  content_type?: ContentType;
  board_id: string;
  title: string;
  content: string;
  summary?: string | null;
  cover?: string | null;
  tags?: string[];
  slug?: string | null;
  publisher?: string | null;
  department?: string | null;
  keywords?: string[];
  column_id?: string | null;
  status?: string;
  is_pinned?: boolean;
  is_featured?: boolean;
}

/**
 * 统一分页信封映射：listItems / listComments 共用，默认值（尤其 pages）不会一处改一处漏。
 * 两个后端分页对象字段名一致（items/total/page/pages），只是条目类型不同，故按 mapper 泛化。
 */
function mapPage<TIn, TOut>(
  d: {
    items?: TIn[];
    total?: number;
    page?: number;
    pages?: number;
  } | null,
  mapper: (item: TIn) => TOut,
): { items: TOut[]; total: number; page: number; pages: number } {
  return {
    items: (d?.items ?? []).map(mapper),
    total: d?.total ?? 0,
    page: d?.page ?? 1,
    pages: d?.pages ?? 1,
  };
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
  id: string;
  slug: string;
  title: string;
  description: string;
  parentId: string | null;
  ownerId: string | null;
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
  id: string;
  contentType: string;
  boardId: string;
  authorId: string | null;
  authorName: string;
  publisher: string | null;
  department: string | null;
  columnId: string | null;
  columnTitle: string;
  qaQuestionId: string | null;
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
    content_type: toContentType(i.contentType),
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
  id: string;
  contentId: string;
  authorId: string;
  authorName: string;
  content: string;
  floorNumber: number;
  parentId: string | null;
  likeCount: number;
  liked: boolean;
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
    liked: c.liked,
    created_at: c.createdAt,
  };
}

/** GraphContentViewerState（camelCase）→ ContentViewerState（snake_case） */
function mapViewerState(s: {
  liked: boolean;
  favorited: boolean;
  likeCount: number;
  bookmarkCount: number;
}): ContentViewerState {
  return {
    liked: s.liked,
    favorited: s.favorited,
    like_count: s.likeCount,
    bookmark_count: s.bookmarkCount,
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
    board_id?: string;
    content_type?: ContentType;
    author_id?: string;
  }) {
    const r = await graphqlClient
      .query(CONTENT_ITEMS, {
        page: args?.page ?? 1,
        pageSize: args?.limit ?? 20,
        boardId: args?.board_id ?? null,
        contentType: args?.content_type ?? null,
        authorId: args?.author_id ?? null,
      })
      .toPromise();
    if (r.error) return err(mapErr(r.error));
    const d = r.data?.contentItems;
    return ok(mapPage(d, mapItem));
  },

  /** 按 id 取内容详情 */
  async getItem(id: string) {
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
  async listComments(itemId: string, page = 1, limit = 20) {
    const r = await graphqlClient
      .query(CONTENT_COMMENTS, { itemId, page, pageSize: limit })
      .toPromise();
    if (r.error) return err(mapErr(r.error));
    const d = r.data?.contentComments;
    return ok(mapPage(d, mapComment));
  },

  /**
   * 当前用户对该内容的互动态（是否已赞/已藏 + 计数）。
   *
   * 必须在客户端调用：SSR 阶段后端只认 Authorization 头、而 SSR 只转发 Cookie，
   * 服务端渲染时拿不到登录态，`liked`/`favorited` 会恒为 false。
   */
  async getViewerState(contentId: string) {
    const r = await graphqlClient
      .query(CONTENT_VIEWER_STATE, { contentId })
      .toPromise();
    if (r.error) return err(mapErr(r.error));
    if (!r.data?.contentViewerState)
      return err(new AppError(ErrorCode.DOCUMENT_NOT_FOUND, "not found"));
    return ok(mapViewerState(r.data.contentViewerState));
  },

  // —— 以下写方法保留 REST ——
  createItem: (data: ContentCreateInput) =>
    post<ContentItem>("/api/v1/content/items", data),

  deleteItem: (id: string) => del<void>(`/api/v1/content/items/${id}`),

  likeItem: (id: string) => post<LikeState>(`/api/v1/content/items/${id}/like`),

  unlikeItem: (id: string) =>
    del<LikeState>(`/api/v1/content/items/${id}/like`),

  createComment: (
    itemId: string,
    data: { content: string; parent_id?: string | null },
  ) => post<ContentComment>(`/api/v1/content/items/${itemId}/comments`, data),

  deleteComment: (itemId: string, commentId: string) =>
    del<void>(`/api/v1/content/items/${itemId}/comments/${commentId}`),

  likeComment: (itemId: string, commentId: string) =>
    post<LikeState>(
      `/api/v1/content/items/${itemId}/comments/${commentId}/like`,
    ),

  unlikeComment: (itemId: string, commentId: string) =>
    del<LikeState>(
      `/api/v1/content/items/${itemId}/comments/${commentId}/like`,
    ),

  /** 转发上报：由调用方在「链接已复制」之后调用，返回新的转发数。 */
  forwardItem: (id: string) =>
    post<ForwardState>(`/api/v1/content/items/${id}/forward`),

  /** 提交举报（帖子 / 评论）。target_title 由后端从内容行回填，前端不传。 */
  reportItem: (data: ReportInput) =>
    post<{ ok: boolean }>("/api/v1/content/reports", data),
};
