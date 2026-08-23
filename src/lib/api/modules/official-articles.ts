// 官方文章（/api/v1/articles）SSR 数据访问层
//
// 官方站点文章列表/详情页使用真实后端的 /api/v1/articles 端点（经 API_URL 直连）。
// 此处提供统一的类型与聚合函数，供 文章列表 / 所有分类 / 归档 / 新闻资讯 等 SSR 页面复用。
// 与 Vue 博客（/api/v1/blog/*）相互独立。

import { ssrFetch } from "~/lib/fetch-ssr";
import { t } from "~/lib/i18n";

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

/** 官方文章列表分页数据 */
export interface OfficialArticleListData {
  items: OfficialArticle[];
  total: number;
}

/** 官方文章分类 */
export interface OfficialArticleCategory {
  slug: string;
  name: string;
  article_count: number;
}

/** 后端分类 slug → 翻译 key（未知 slug 直接回退为 slug） */
const ARTICLE_CATEGORY_KEYS: Record<string, string> = {
  announcement: "messages.articles.categories.announcement",
  architecture: "messages.articles.categories.architecture",
  security: "messages.articles.categories.security",
  engineering: "messages.articles.categories.engineering",
  ai: "messages.articles.categories.ai",
  community: "messages.articles.categories.community",
  culture: "messages.articles.categories.culture",
  news: "messages.articles.categories.news",
  science: "messages.articles.categories.science",
};

/** 首页「最新新闻」展示用到的三大新闻分类 slug（与新闻资讯页 NEWS_SECTIONS 对齐） */
export const NEWS_CATEGORY_SLUGS: readonly string[] = [
  "announcement",
  "news",
  "science",
];

/** 分类 slug → 显示名 */
export function categoryLabel(slug: string): string {
  const key = ARTICLE_CATEGORY_KEYS[slug];
  return key ? t(key) : slug;
}

/**
 * 拉取全部分页文章（用于归档 / 分类筛选等聚合场景）。
 * 最多拉取 maxPages 页，每页 pageSize 条，避免后端总文章数过多时无限请求。
 */
export async function fetchAllArticles(
  pageSize = 100,
  maxPages = 20,
): Promise<{ articles: OfficialArticle[]; error: string | null }> {
  const articles: OfficialArticle[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await ssrFetch<OfficialArticleListData>(
      `/api/v1/articles?page=${page}&page_size=${pageSize}`,
      {
        fallback: null,
      },
    );

    if (error || !data) {
      return { articles, error };
    }

    articles.push(...data.items);

    if (data.items.length === 0 || articles.length >= data.total) {
      break;
    }
  }

  return { articles, error: null };
}

/**
 * 拉取官方文章分类列表。
 * 优先使用后端分类端点（/api/v1/articles/categories）；
 * 若端点不可用，则回退为根据全部文章中的 category 字段聚合统计。
 */
export async function fetchArticleCategories(): Promise<{
  categories: OfficialArticleCategory[];
  error: string | null;
}> {
  const { data, error } = await ssrFetch<
    { items: OfficialArticleCategory[] } | OfficialArticleCategory[]
  >("/api/v1/articles/categories", { fallback: null });

  if (!error && data) {
    const items = Array.isArray(data) ? data : data.items;
    if (Array.isArray(items)) {
      return { categories: items, error: null };
    }
  }

  const { articles, error: articlesError } = await fetchAllArticles();
  if (articlesError) {
    return { categories: [], error: articlesError };
  }

  const countBySlug = new Map<string, number>();
  for (const article of articles) {
    if (!article.category) continue;
    countBySlug.set(
      article.category,
      (countBySlug.get(article.category) ?? 0) + 1,
    );
  }

  const categories = Array.from(countBySlug.entries())
    .map(([slug, count]) => ({
      slug,
      name: categoryLabel(slug),
      article_count: count,
    }))
    .sort((a, b) => b.article_count - a.article_count);

  return { categories, error: null };
}
