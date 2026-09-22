// anonymous-letter (Treehole) feature module
// Vue-based anonymous letter sharing platform

// Pages
export { default as BottlePage } from "./pages/BottlePage.vue";
export { default as HomePage } from "./pages/HomePage.vue";
export { default as MessagesPage } from "./pages/MessagesPage.vue";
export { default as MinePage } from "./pages/MinePage.vue";
export { default as RandomPage } from "./pages/RandomPage.vue";
export { default as RankPage } from "./pages/RankPage.vue";
export { default as SettingsPage } from "./pages/SettingsPage.vue";
export { default as WishPage } from "./pages/WishPage.vue";
export { default as WritePage } from "./pages/WritePage.vue";

// Stores
// 不用 `export *` / `export * as`：通配会把模块内全部符号（含内部实现与 mock 夹具）
// 无声地并入 feature 的公开面。实测这两个通配导出目前**没有任何消费者**
// （需要 storage/constants 的模块都是深链到 ./stores/*），故直接移除；
// 将来要用请按需显式具名导出。
export { useApp } from "./stores/app";
