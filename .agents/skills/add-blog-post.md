# 添加博客或新闻内容

## 先判断内容来源

动态前端当前 `src/content.config.ts` 导出空集合，正式博客由真实后端提供。不要在
`src/content/posts/` 新建文件：该目录和旧的本地博客集合已经不存在。

| 内容类型       | 正确位置                                          | 发布方式                          |
| -------------- | ------------------------------------------------- | --------------------------------- |
| 用户博客系列   | 后端 Blog API / Git HTTP                          | 通过社区或 VS Code 扩展创建并推送 |
| 社区动态内容   | 对应后端业务 API                                  | 通过产品流程创建                  |
| 公开新闻、公告 | `../LKM-official-static/src/content/docs/<lang>/` | 静态站构建发布                    |
| 前端测试夹具   | 与测试文件同目录                                  | 只用于测试，不进入生产内容        |

## 添加静态新闻

在 `LKM-official-static` 中为中文和英文创建同名 Markdown 文件：

```yaml
---
title: 文章标题
description: 用于列表和 SEO 的摘要
publishDate: 2026-09-19
category: news
image: https://example.com/image.jpg
tags: [公告, 社区]
lang: zh
---
```

要求：

1. 日期使用 `YYYY-MM-DD`，表示首次发布日期。
2. 中英文文件名一致，`lang` 分别为 `zh` 和 `en`。
3. 图片必须是可长期访问的 HTTPS URL，优先使用项目自有资产。
4. 不发布占位文案，不在正文写密码、内部地址或个人敏感信息。
5. 在静态站目录运行 `pnpm check && pnpm build`。

## 修改动态博客能力

若任务是新增博客字段、页面或交互，应同时检查：

- 前端 `src/lib/api/modules/blog.ts` 和相关页面；
- 后端 `app/modules/blog/` 的 schema、service、router 或 GraphQL；
- VS Code 扩展中的 API 与 Git HTTP 调用。

不得重新引入与真实后端并行的本地内容集合作为生产数据源。
