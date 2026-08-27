// forum 功能模块出口（统一内容合并后保留的活跃组件与数据）
// 注：旧 forum REST/GraphQL 数据层已移除，论坛统一走 contentApi（~/lib/api/modules/content）。

export { default as ForumCommentSection } from "./components/CommentSection.vue";
export { default as ForumPostInteractions } from "./components/PostInteractions.vue";
export { default as ForumCreatePostDialog } from "./components/CreatePostDialog.vue";

export * from "./data/categories";
