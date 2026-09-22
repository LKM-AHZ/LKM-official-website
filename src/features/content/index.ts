export { default as ContentCallout } from "./components/Callout.astro";
export { default as ContentFigure } from "./components/Figure.astro";
// 补上缺失的公共面：ContentCard 是页面在用的组件，只是消费方目前仍走深路径
// （src/pages/forum/[categorySlug].astro）。迁移消费方到本 barrel 属清单外改动，留作后续。
// 注：ContentCallout / ContentFigure 目前全仓无引用，保留是给内容渲染预留的入口。
export { default as ContentCard } from "./components/ContentCard.astro";
