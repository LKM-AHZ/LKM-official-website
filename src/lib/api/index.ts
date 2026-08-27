// src/lib/api — 统一数据访问层
//
// 设计：
//  - 基于 src/lib/http/client.ts 的原生 fetch 封装
//  - SSR（Astro 服务端）和 CSR（浏览器 Vue/Svelte/React）共用
//  - SSR 时自动使用真实后端地址直连（由 API_URL 指定）
//  - CSR 时使用同域 /api（无跨域，由 Astro 中间件代理）
//  - 每个模块的 API 返回 Result<T, AppError>

export { blogApi } from "./modules/blog";
export {
  fetchAllArticles,
  fetchArticleCategories,
  categoryLabel,
} from "./modules/official-articles";
export type {
  OfficialArticle,
  OfficialArticleListData,
  OfficialArticleCategory,
  ArticleDetail,
} from "./modules/official-articles";
export { competitionApi } from "./modules/competition";
export { qaApi } from "./modules/qa";
export { projectApi } from "./modules/project";
export { fileLibraryApi } from "./modules/file-library";
export { treeholeApi } from "./modules/treehole";
export { teamApi } from "./modules/team";
export { authApi } from "./modules/auth";
export { notificationApi } from "./modules/notification";
export { pointsApi } from "./modules/points";
export type * from "./modules/points";
export { followApi } from "./modules/follow";
export type * from "./modules/follow";
export { timelineApi } from "./modules/timeline";
export type * from "./modules/timeline";
export { moderationApi } from "./modules/moderation";
export type * from "./modules/moderation";

// GraphQL 客户端
export { graphqlClient, graphql } from "./graphql";

// 统一 fetch wrapper（用于 SSE/AbortController 场景）
export { apiFetch } from "./fetch";

// Blog 类型
export type * from "./modules/blog-types";
