// src/lib/api/modules/blog-types.ts
// Blog 模块的类型定义 — 从 features/blog-community/types/blog.ts 迁移

export interface BlogSeriesInfo {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  repo_name: string;
  status: "active" | "archived";
  // GraphQL 的 GraphBlogSeries/GraphSeriesComment 并不暴露这两个时间字段
  //（blog.ts 的映射因此填的是空串），声明为可选以反映真实载荷
  created_at?: string;
  updated_at?: string;
  star_count: number;
  is_starred: boolean;
}

export interface BlogSeriesDetail extends BlogSeriesInfo {
  file_tree: FileTreeNode[] | null;
}

export interface FileTreeNode {
  name: string;
  type: "blob" | "tree";
  children?: FileTreeNode[];
}

export interface GitFileContent {
  filepath: string;
  content: string;
}

export interface BlogCommentInfo {
  id: string;
  user_id: string;
  series_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // 与 ArticleCommentInfo 及后端模型保持一致：app/modules/blog/schemas.py:83
  // 声明 `profile: ProfileInfo | None = None`，GraphQL 侧同样是可空（graphql.py:128），
  // 故这里不能声明为非空，否则 comment.profile.nickname 会在运行时抛错
  profile: {
    nickname: string | null;
    avatar: string | null;
    role: string;
  } | null;
  replies: BlogCommentInfo[];
}

export interface BlogStarStatus {
  starred: boolean;
  star_count: number;
}

// ── 文章（/api/v1/articles）评论与点赞 ──

/** 文章评论（后端 ArticleCommentOut，平铺列表，含 parent_id 自引用用于组树）。 */
export interface ArticleCommentInfo {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  /** 作者 profile（后端 ProfileInfo），可能缺失。 */
  profile: {
    nickname: string | null;
    avatar: string | null;
    role: string;
  } | null;
}

/** 文章点赞状态（后端 ArticleLikeStatus）。 */
export interface ArticleLikeStatus {
  liked: boolean;
  like_count: number;
}

/** 文章评论创建入参（后端 ArticleCommentCreate）。 */
export interface ArticleCommentCreate {
  content: string;
  parent_id?: string | null;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  request_id?: string;
}

export interface ListData<T> {
  items: T[];
}

// 与模块内其它后端载荷类型统一用 snake_case（原为 camelCase 别名，与本文件其余
// 类型不一致；该类型当前无任何消费方，仅被 blog.ts 再导出）
export interface BlogArticle {
  series_id: string;
  series_title: string;
  series_description: string | null;
  series_cover: string | null;
  filepath: string;
  filename: string;
}

/** 系列评论创建入参 —— 与文章评论同一契约（后端同为 {content, parent_id}） */
export type BlogCommentCreate = ArticleCommentCreate;

export interface BlogArticleInfo {
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[];
  published: string;
  updated: string | null;
  word_count: number;
  reading_time: number;
}

export interface BlogArticleDetail extends BlogArticleInfo {
  content: string;
  prev_article: { slug: string; title: string } | null;
  next_article: { slug: string; title: string } | null;
}

export interface BlogCategoryInfo {
  slug: string;
  name: string;
  article_count: number;
}

export interface BlogTagInfo {
  slug: string;
  name: string;
  article_count: number;
}

export interface BlogSearchResult {
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  published: string;
}

export interface BlogAboutInfo {
  content: string;
}

/**
 * blog 模块的分页信封：page / page_size / total_pages。
 * 与 api/types.ts 的 PaginatedResponse（items / total / page / pages）字段名不同，
 * 是两套后端响应形状，不要合并成同一个类型（合并会丢掉 page_size 的语义）。
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
