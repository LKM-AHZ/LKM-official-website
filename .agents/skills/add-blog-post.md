# 添加博客文章

## 步骤

1. 在 `src/content/post/` 下创建新的 `.md` 或 `.mdx` 文件
2. 添加必需的 frontmatter：

```yaml
---
publishDate: 2026-01-15T00:00:00Z
title: '文章标题'
excerpt: '文章摘要'
image: '~/assets/images/your-image.png'
category: 'tutorials'
tags:
  - astro
  - tailwind
author: '作者名'
---
```

3. 使用 Markdown 编写内容（如需嵌入组件可使用 MDX）
4. 运行 `pnpm run build` 验证文章正确渲染

## Frontmatter 字段

| 字段          | 是否必填 | 说明                         |
| ------------- | -------- | ---------------------------- |
| `title`       | 是       | 文章标题                     |
| `publishDate` | 否       | ISO 8601 日期                |
| `updateDate`  | 否       | ISO 8601 日期                |
| `draft`       | 否       | 设为 `true` 则不在列表中显示 |
| `excerpt`     | 否       | 列表页摘要                   |
| `image`       | 否       | 封面图路径（本地图片用 `~/` 前缀） |
| `category`    | 否       | 单个分类名称                 |
| `tags`        | 否       | 标签数组                     |
| `author`      | 否       | 作者名                       |
| `metadata`    | 否       | 覆盖 SEO 元数据              |

## URL 模式

文章路径为 `/blog/{slug}`，slug 由文件名生成。

## 注意事项

- 阅读时间由 remark 插件自动计算
- 使用 `~/` 引用的图片在构建时自动优化
- 使用 `.mdx` 扩展名可在文章中嵌入 Astro 组件
