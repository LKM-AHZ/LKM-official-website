// forum 功能模块出口（统一内容合并后保留的活跃组件与数据）
// 注：旧 forum REST/GraphQL 数据层已移除，论坛统一走 contentApi（~/lib/api/modules/content）。

export { default as ForumCommentSection } from "./components/CommentSection.vue";
export { default as ForumPostInteractions } from "./components/PostInteractions.vue";
export { default as ForumCreatePostDialog } from "./components/CreatePostDialog.vue";

// 不用 `export *`：隐式扩散会连内部符号一起暴露，且与其它 feature 的同名导出容易撞车。
// 这里只列本模块有意对外的那几个（当前仓内没有消费方走这个 barrel，直连 data/categories 即可）
export type { ForumCategory } from "./data/categories";
export {
  forumCategories,
  getRootCategories,
  getChildCategories,
  getCategoryBySlug,
} from "./data/categories";
