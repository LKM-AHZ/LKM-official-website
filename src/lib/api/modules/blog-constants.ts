// src/lib/api/modules/blog-constants.ts
// Blog 模块的 API 路径常量 — 从 features/blog-community/constants/blog-api.ts 迁移

export const BLOG_API = {
  series: {
    list: "/api/v1/blog/series",
    detail: (id: string) => `/api/v1/blog/series/${id}`,
    create: "/api/v1/blog/series",
    update: (id: string) => `/api/v1/blog/series/${id}`,
    delete: (id: string) => `/api/v1/blog/series/${id}`,
    publish: (id: string) => `/api/v1/blog/series/${id}/publish`,
  },
  star: {
    toggle: (id: string) => `/api/v1/blog/series/${id}/star`,
  },
  comments: {
    list: (id: string) => `/api/v1/blog/series/${id}/comments`,
    create: (id: string) => `/api/v1/blog/series/${id}/comments`,
    delete: (seriesId: string, commentId: string) =>
      `/api/v1/blog/series/${seriesId}/comments/${commentId}`,
  },
  files: {
    get: (id: string, filepath: string) =>
      `/api/v1/blog/series/${id}/files/${filepath}`,
    put: (id: string, filepath: string) =>
      `/api/v1/blog/series/${id}/files/${filepath}`,
  },
  // 文章相关的只读端点对齐后端真实 /api/v1/articles（旧的 blog 假路径已废弃）。
  articles: {
    list: "/api/v1/articles",
    detail: (slug: string) => `/api/v1/articles/${slug}`,
    like: (slug: string) => `/api/v1/articles/${slug}/like`,
    comments: {
      list: (slug: string) => `/api/v1/articles/${slug}/comments`,
      create: (slug: string) => `/api/v1/articles/${slug}/comments`,
      delete: (commentId: string) => `/api/v1/articles/comments/${commentId}`,
    },
  },
  categories: {
    list: "/api/v1/articles/categories",
    detail: (slug: string) => `/api/v1/articles/categories/${slug}`,
  },
  tags: {
    list: "/api/v1/articles/tags",
    detail: (slug: string) => `/api/v1/articles/tags/${slug}`,
  },
  search: {
    query: "/api/v1/articles/search",
  },
  about: {
    get: "/api/v1/articles/about",
  },
} as const;
