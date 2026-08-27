// 官方文章（/api/v1/articles）SSR 数据访问层
//
// 官方站点文章列表/详情页使用真实后端的 /api/v1/articles 端点（经 API_URL 直连）。
// 此处提供统一的官方文章类型与首页「最新新闻」分类聚合，供 SSR 页面复用。
// 与 Vue 博客（/api/v1/blog/*）相互独立。

/** 官方文章列表项 */
export interface OfficialArticle {
  slug: string;
  title: string;
  description: string | null;
  cover: string | null;
  category: string;
  published: string;
  views: number;
  likes: number;
  comments: number;
}

/** 官方文章详情（列表项基础上含正文与互动扩展字段） */
export interface ArticleDetail extends OfficialArticle {
  bookmarks: number;
  department: string;
  publisher: string;
  content: string;
  reading_time: number;
  keywords: string[];
  tags?: string[];
}

/** 首页「最新新闻」展示用到的三大新闻分类 slug（与新闻资讯页 NEWS_SECTIONS 对齐） */
export const NEWS_CATEGORY_SLUGS: readonly string[] = [
  "announcement",
  "news",
  "science",
];
