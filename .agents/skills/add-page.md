# 添加页面

## 步骤

1. 在 `src/pages/` 下创建新的 `.astro` 文件
2. 标准页面使用 `PageLayout`，自定义布局使用 `BaseLayout`
3. 使用 `src/features/` 和 `src/ui/` 中的组件组合页面

## 模板

```astro
---
import PageLayout from '~/layouts/PageLayout.astro';
import Hero from '~/features/homepage/Hero.astro';
import Features from '~/features/homepage/Features.astro';

const metadata = {
  title: '页面标题',
  description: 'SEO 页面描述',
};
---

<PageLayout metadata={metadata}>
  <Hero
    tagline="可选标签"
    title="页面主标题"
    subtitle="辅助文本"
    image={{
      src: '~/assets/images/hero.png',
      alt: 'Hero 图片描述',
    }}
  />

  <Features
    title="区块标题"
    items={[
      { title: '功能 1', description: '描述', icon: 'tabler:star' },
      { title: '功能 2', description: '描述', icon: 'tabler:rocket' },
    ]}
  />
</PageLayout>
```

## 可用布局

| 布局             | 路径                             | 用途                    |
| ---------------- | -------------------------------- | ----------------------- |
| `BaseLayout`     | `~/layouts/BaseLayout.astro`     | 最简布局（含顶栏/页脚） |
| `PageLayout`     | `~/layouts/PageLayout.astro`     | 标准页面布局            |
| `SidebarLayout`  | `~/layouts/SidebarLayout.astro`  | 带侧边栏布局            |
| `MarkdownLayout` | `~/layouts/MarkdownLayout.astro` | Markdown 内容布局       |
| `BlogLayout`     | `~/layouts/BlogLayout.astro`     | 博客页面布局            |

## 可用业务组件

业务组件按功能模块组织在 `src/features/` 下：

| 模块       | 路径                    | 说明       |
| ---------- | ----------------------- | ---------- |
| `homepage` | `~/features/homepage/`  | 首页组件   |
| `blog`     | `~/features/blog/`      | 博客组件   |
| `auth`     | `~/features/auth/`      | 认证组件   |
| `docs`     | `~/features/docs/`      | 文档组件   |
| `search`   | `~/features/search/`    | 搜索组件   |
| `shell`    | `~/features/shell/`     | 通用 UI 壳 |
| (其他)     | `~/features/<feature>/` | 按需查阅   |

## 注意事项

- `src/pages/` 下的页面按文件名自动路由
- 使用 `PageLayout`（含 Header + Footer）或 `BaseLayout`（最简布局）
- 图标使用 `tabler:icon-name` 格式，来自 `@iconify-json/tabler`
