# 添加 Widget 组件

## 步骤

1. 在 `src/components/widgets/` 下创建新的 `.astro` 文件
2. 在 `src/types.d.ts` 中定义 Props 接口（或使用内联方式）
3. 遵循现有组件模式

## 模板

```astro
---
import WidgetWrapper from '~/components/ui/WidgetWrapper.astro';
import Headline from '~/components/ui/Headline.astro';
import type { MyWidget as Props } from '~/types';

const {
  title = await Astro.slots.render('title'),
  subtitle = await Astro.slots.render('subtitle'),
  tagline,
  items = [],
  id,
  isDark = false,
  classes = {},
  bg = await Astro.slots.render('bg'),
} = Astro.props;
---

<WidgetWrapper id={id} isDark={isDark} containerClass={classes?.container ?? ''} bg={bg}>
  <Headline title={title} subtitle={subtitle} tagline={tagline} classes={classes?.headline} />
  <div class="max-w-5xl mx-auto">
    <!-- 组件内容 -->
  </div>
</WidgetWrapper>
```

## 约定

- Props 接口继承 `~/types` 中的 `Widget` 基础接口
- 使用 `WidgetWrapper` 保持一致的间距和暗色模式支持
- 使用 `Headline` 渲染标题/副标题/标签行
- 接受 `classes` prop 并用 `twMerge()` 进行样式覆写
- 支持 `title`、`subtitle`、`bg` 等具名插槽
- 使用 `intersect-once` 类实现滚动触发动画
