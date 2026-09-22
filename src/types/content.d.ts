// 统一内容模型类型（前后端契约，对齐 LKM-service /api/v1/content）
// 收敛论坛讨论帖 / 官方文章 / 专栏连载 / 博客发布产物为单一 ContentItem。

export type ContentType =
  "discussion" | "article" | "column_post" | "blog_post" | "qa";


/** 板块（boards 是统一分类轴，支持父/子层级嵌套展示） */
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
  created_at: string;
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
  // 非专栏内容（discussion/qa/article）没有专栏，column_title 与 column_id 同为可空
  column_title: string | null;
  qa_question_id: string | null;
  slug: string | null;
  title: string;
  /** 列表/卡片用的短摘要（后端必给，可能为空串）。列表优先用它 */
  excerpt: string;
  /** 详情页用的富摘要，可为空；excerpt 为空时才回退到 summary */
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
  created_at: string;
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
