// 博客模块 API — 读方法走 urql GraphQL，写方法保留 REST
//
// 与 content.ts（Task 7）同构：
//  - 被消费的读方法 getSeriesDetail / getFileContent（唯一真消费方：
//    src/features/editor/persistence/git-persistence.ts）改用 BLOG_SERIES_DETAIL /
//    BLOG_FILE_CONTENT 查询（blog.graphql.ts），后端 camelCase 字段在此映射为
//    snake_case 公共类型。
//  - 其余 blog 读方法（listSeries/listComments/listArticles/getArticleDetail/
//    listCategories/listTags/searchArticles/getAbout/listArticleComments）
//    前端全线无消费方（grep 验证），按 YAGNI 返回 err() 待按需接入，不为其
//    构建 lossy mapper。
//  - 写方法（putSeriesFile/publishSeriesFile/createComment/deleteComment/
//    toggleStar/createArticleComment/deleteArticleComment/toggleArticleLike）保留 REST。

import { post, put, del } from "../../http/client";
import { ok, err } from "../../errors/result";
import type { Result } from "../../errors/result";
import { AppError, ErrorCode } from "../../errors/error-codes";
import { graphqlClient } from "../graphql";
import { BLOG_SERIES_DETAIL, BLOG_FILE_CONTENT } from "./blog.graphql";
import type {
  ApiResponse,
  ListData,
  PaginatedData,
  BlogSeriesInfo,
  BlogSeriesDetail,
  GitFileContent,
  BlogCommentInfo,
  BlogStarStatus,
  BlogCommentCreate,
  ArticleCommentInfo,
  ArticleLikeStatus,
  ArticleCommentCreate,
  BlogArticleInfo,
  BlogArticleDetail,
  BlogCategoryInfo,
  BlogTagInfo,
  BlogSearchResult,
  BlogAboutInfo,
} from "./blog-types";
import { BLOG_API } from "./blog-constants";
import type { ArticleDetail } from "./official-articles";
import type { FileTreeNode } from "./blog-types";

export type {
  BlogSeriesInfo,
  BlogSeriesDetail,
  GitFileContent,
  BlogCommentInfo,
  BlogStarStatus,
  BlogCommentCreate,
  ArticleCommentInfo,
  ArticleLikeStatus,
  ArticleCommentCreate,
  BlogArticleInfo,
  BlogArticleDetail,
  BlogCategoryInfo,
  BlogTagInfo,
  BlogSearchResult,
  BlogAboutInfo,
  FileTreeNode,
  BlogArticle,
  ApiResponse,
  ListData,
  PaginatedData,
} from "./blog-types";

// ---- 完整 blogApi（从 feature-local blogApi 迁移） ----

/** 后端 GraphFileTreeNode（camelCase，自递归 children）。 */
interface GraphFileTreeNode {
  name: string;
  type: string;
  children?: readonly GraphFileTreeNode[] | null;
}

/**
 * 深度映射后端 fileTree（camelCase）→ 前端 FileTreeNode。
 * 后端 type 为 "blob" | "tree"，前端同名，1:1 映射，仅兜底非 tree 为 blob。
 */
function mapFileTree(nodes: readonly GraphFileTreeNode[]): FileTreeNode[] {
  return nodes.map((n) => ({
    name: n.name,
    type: n.type === "tree" ? "tree" : "blob",
    children: n.children ? mapFileTree(n.children) : undefined,
  }));
}

/** GraphBlogSeriesDetail（camelCase）→ BlogSeriesDetail（snake_case） */
function mapSeriesDetail(d: {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  repoName: string;
  status: string;
  starCount: number;
  isStarred: boolean;
  fileTree: readonly GraphFileTreeNode[] | null;
}): BlogSeriesDetail {
  // 后端 GraphBlogSeriesDetail 不含 createdAt/updatedAt，前端 BlogSeriesDetail
  // 继承 BlogSeriesInfo 强制两字段 string，此处给空串默认值。
  return {
    id: d.id,
    owner_id: d.ownerId,
    title: d.title,
    description: d.description,
    cover_url: d.coverUrl,
    repo_name: d.repoName,
    status: d.status === "archived" ? "archived" : "active",
    created_at: "",
    updated_at: "",
    star_count: d.starCount,
    is_starred: d.isStarred,
    file_tree: d.fileTree ? mapFileTree(d.fileTree) : null,
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

/** 无消费方读方法的 TODO 占位 err（YAGNI，待按需接入 GraphQL） */
function notImplemented<T>(endpoint: string): Result<T, AppError> {
  // 端点只写进开发期日志：它是内部 REST 布局信息，终端用户无从据此处理，
  // 不应出现在面向用户的错误消息里
  if (import.meta.env.DEV) {
    console.warn(`[blog] 待按需接入 GraphQL（原端点 ${endpoint}）`);
  }
  return err(new AppError(ErrorCode.UNKNOWN_ERROR, "待按需接入 GraphQL"));
}

/**
 * 拆掉写接口的 {code,message,data} 包络取 data。
 * 原先把这段 match 在 put/publish/create/star 等 6 处各抄一遍，改包络语义时必然漏改。
 */
function unwrap<T>(r: Result<ApiResponse<T>, AppError>): Result<T, AppError> {
  return r.match(
    (v) => ok(v.data),
    (e) => err(e),
  );
}

/** 博客 REST API — 纯函数对象，不包含 Vue 响应式状态 */
export const blogApi = {
  // ── 系列 ──
  // TODO: 无消费方，待按需接入 GraphQL
  listSeries: async (): Promise<Result<ListData<BlogSeriesInfo>, AppError>> =>
    notImplemented(BLOG_API.series.list),

  /** 系列详情（含文件树）— 被 git-persistence.listDocuments 消费 */
  getSeriesDetail: async (
    id: string,
  ): Promise<Result<BlogSeriesDetail, AppError>> => {
    const r = await graphqlClient.query(BLOG_SERIES_DETAIL, { id }).toPromise();
    if (r.error) return err(mapErr(r.error));
    if (!r.data?.blogSeriesDetail)
      return err(
        new AppError(ErrorCode.DOCUMENT_NOT_FOUND, "系列不存在或无权访问"),
      );
    return ok(mapSeriesDetail(r.data.blogSeriesDetail));
  },

  // ── 文件 ──
  /** 取系列内单个 file 内容 — 被 git-persistence.loadDocument 消费 */
  getFileContent: async (
    seriesId: string,
    filepath: string,
  ): Promise<Result<GitFileContent, AppError>> => {
    const r = await graphqlClient
      .query(BLOG_FILE_CONTENT, { seriesId, filepath })
      .toPromise();
    if (r.error) return err(mapErr(r.error));
    if (!r.data?.blogFileContent)
      return err(
        new AppError(ErrorCode.DOCUMENT_NOT_FOUND, "文件不存在或无权访问"),
      );
    return ok(r.data.blogFileContent);
  },

  putSeriesFile: async (
    seriesId: string,
    filepath: string,
    content: string,
    message?: string,
  ): Promise<Result<null, AppError>> => {
    const result = await put<ApiResponse<null>>(
      BLOG_API.files.put(seriesId, filepath),
      { content, message },
    );
    return unwrap(result);
  },

  publishSeriesFile: async (
    seriesId: string,
    filepath: string,
    override?: Record<string, unknown>,
  ): Promise<Result<ArticleDetail, AppError>> => {
    const result = await post<ApiResponse<ArticleDetail>>(
      BLOG_API.series.publish(seriesId),
      { filepath, override },
    );
    return unwrap(result);
  },

  // ── 评论 ──
  // TODO: 无消费方，待按需接入 GraphQL
  listComments: async (
    seriesId: string,
  ): Promise<Result<ListData<BlogCommentInfo>, AppError>> =>
    notImplemented(BLOG_API.comments.list(seriesId)),

  createComment: async (
    seriesId: string,
    data: BlogCommentCreate,
  ): Promise<Result<BlogCommentInfo, AppError>> => {
    const result = await post<ApiResponse<BlogCommentInfo>>(
      BLOG_API.comments.create(seriesId),
      data,
    );
    return unwrap(result);
  },

  // DELETE 契约：后端不返回可用 body（唯一有意义的信息是 HTTP 状态），故不像其它写方法那样
  // 拆 {code,message,data} 包络——调用方只需判断 Result 的 ok/err，不要读取 value
  deleteComment: (seriesId: string, commentId: string) =>
    del<null>(BLOG_API.comments.delete(seriesId, commentId)),

  // ── 文章（对齐后端真实 /api/v1/articles，返回契约沿用 BlogArticleInfo）──
  // TODO: 无消费方，待按需接入 GraphQL（articles.graphql.py）
  listArticles: async (
    _page = 1,
    _pageSize = 20,
  ): Promise<Result<PaginatedData<BlogArticleInfo>, AppError>> =>
    notImplemented(BLOG_API.articles.list),

  // TODO: 无消费方，待按需接入 GraphQL（articles.graphql.py）
  getArticleDetail: async (
    slug: string,
  ): Promise<Result<BlogArticleDetail, AppError>> =>
    notImplemented(BLOG_API.articles.detail(slug)),

  // ── 分类 & 标签 ──
  // TODO: 无消费方，待按需接入 GraphQL
  listCategories: async (): Promise<
    Result<ListData<BlogCategoryInfo>, AppError>
  > => notImplemented(BLOG_API.categories.list),

  // TODO: 无消费方，待按需接入 GraphQL
  listTags: async (): Promise<Result<ListData<BlogTagInfo>, AppError>> =>
    notImplemented(BLOG_API.tags.list),

  // ── 搜索 ──
  // TODO: 无消费方，待按需接入 GraphQL
  searchArticles: async (
    q: string,
  ): Promise<Result<ListData<BlogSearchResult>, AppError>> =>
    notImplemented(`${BLOG_API.search.query}?q=${encodeURIComponent(q)}`),

  // ── 关于 ──
  // TODO: 无消费方，待按需接入 GraphQL
  getAbout: async (): Promise<Result<BlogAboutInfo, AppError>> =>
    notImplemented(BLOG_API.about.get),

  // ── 收藏 ──
  toggleStar: async (
    seriesId: string,
  ): Promise<Result<BlogStarStatus, AppError>> => {
    const result = await post<ApiResponse<BlogStarStatus>>(
      BLOG_API.star.toggle(seriesId),
    );
    return unwrap(result);
  },

  // ── 文章评论与点赞（/api/v1/articles/*）──
  // TODO: 无消费方，待按需接入 GraphQL（articles.graphql.py）
  listArticleComments: async (
    slug: string,
  ): Promise<Result<ListData<ArticleCommentInfo>, AppError>> =>
    notImplemented(BLOG_API.articles.comments.list(slug)),

  createArticleComment: async (
    slug: string,
    data: ArticleCommentCreate,
  ): Promise<Result<ArticleCommentInfo, AppError>> => {
    const result = await post<ApiResponse<ArticleCommentInfo>>(
      BLOG_API.articles.comments.create(slug),
      data,
    );
    return unwrap(result);
  },

  // 同 deleteComment：DELETE 无可用 body，不拆包络
  deleteArticleComment: (commentId: string) =>
    del<null>(BLOG_API.articles.comments.delete(commentId)),

  toggleArticleLike: async (
    slug: string,
  ): Promise<Result<ArticleLikeStatus, AppError>> => {
    const result = await post<ApiResponse<ArticleLikeStatus>>(
      BLOG_API.articles.like(slug),
    );
    return unwrap(result);
  },
};
