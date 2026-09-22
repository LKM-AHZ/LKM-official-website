export { default as Hero } from "./components/Hero.astro";
export { default as HeroText } from "./components/HeroText.astro";
export { default as Features2 } from "./components/Features2.astro";
export { default as Stats } from "./components/Stats.astro";
export { default as Pricing } from "./components/Pricing.astro";
export { default as Testimonials } from "./components/Testimonials.astro";
export { default as Brands } from "./components/Brands.astro";
export { default as FAQs } from "./components/FAQs.astro";

export { default as CallToAction } from "./components/CallToAction.astro";
export { default as Content } from "./components/Content.astro";
export { default as Contact } from "./components/Contact.astro";
export { default as Note } from "./components/Note.astro";
export { default as Announcement } from "./components/Announcement.astro";
export { default as ClockTimeline } from "./components/ClockTimeline.astro";
// 指向 .astro 包装件（内部渲染 <BlogLatestPostsClient client:visible />）；
// 此前误指向 Vue 客户端组件，使 .astro 包装件不可达、且与下一行成为同一模块的别名
export { default as BlogLatestPosts } from "./components/BlogLatestPosts.astro";
export { default as BlogLatestPostsClient } from "./components/BlogLatestPostsClient.vue";
export { default as Section } from "./components/Section.astro";

export { default as Timeline } from "./components/Timeline.astro";
// TopNav/Sidebar 是布局级 chrome，不属于 homepage 内容区块：它们由布局文件直接引用，
// 也从 shell 的 barrel 导出，放在这里会重复公共面并让 homepage 包被顺带打进布局依赖
