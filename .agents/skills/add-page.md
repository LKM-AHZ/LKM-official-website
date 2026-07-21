# 添加页面

## 步骤

1. 在 `src/pages/` 下创建新的 `.astro` 文件
2. 标准页面使用 `PageLayout`，自定义布局使用 `Layout`
3. 使用 `src/components/widgets/` 中的 Widget 组件组合页面

## 模板

```astro
---
import Layout from '~/layouts/PageLayout.astro';
import Hero from '~/components/widgets/Hero.astro';
import Features from '~/components/widgets/Features.astro';

const metadata = {
  title: '页面标题',
  description: 'SEO 页面描述',
};
---

<Layout metadata={metadata}>
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
</Layout>
```

## 可用 Widget 组件

Hero, Features, Content, Steps, Testimonials, FAQs, Stats, Pricing, Brands, CallToAction, Contact, Team

## 注意事项

- `src/pages/` 下的页面按文件名自动路由
- 使用 `PageLayout`（含 Header + Footer）或 `Layout`（最简布局）
- 所有 Widget 接受 `id` prop 用于锚点链接
- 图标使用 `tabler:icon-name` 格式，来自 `@iconify-json/tabler`
