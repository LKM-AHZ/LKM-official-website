// 统一内容模型类型（前后端契约，对齐 LKM-service /api/v1/content）
// 收敛论坛讨论帖 / 官方文章 / 专栏连载 / 博客发布产物为单一 ContentItem。

export type ContentType =
  | "discussion"
  | "article"
  | "column_post"
  | "blog_post"
  | "qa";

/** 板块（boards 是统一分类轴，支持父/子层级嵌套展示） */
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
  created_at: string;
}

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
