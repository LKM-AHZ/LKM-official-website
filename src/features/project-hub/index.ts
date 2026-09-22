export { default as ProjectHubProjectHall } from "./components/ProjectHall.vue";
// 补上缺失的公共面：页面 src/pages/projects/[projectId].astro 直接用这个组件，
// barrel 只露一半会让消费方以为它不对外
export { default as ProjectHubProjectDetail } from "./components/ProjectDetail.vue";
