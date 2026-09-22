<script lang="ts">
// 路由表放模块作用域：写在 <script setup> 里会随每次实例化重建 defineAsyncComponent 包装对象，
// 丢掉 Vue 内部的已解析组件缓存（同一 chunk 被反复 import / 组件被重挂载）。
// 类型用路由联合的 Partial：路由名拼错会直接是类型错误；"login" 有意不在表内（见 stores/navigation）
import { defineAsyncComponent, type Component } from "vue";
import type { StarHopeRoute } from "../stores/navigation";

const routes: Partial<Record<StarHopeRoute, Component>> = {
  dashboard: defineAsyncComponent(
    () => import("../routes/StarHopeDashboard.vue"),
  ),
  bank: defineAsyncComponent(() => import("../routes/StarHopeBank.vue")),
  practice: defineAsyncComponent(
    () => import("../routes/StarHopePractice.vue"),
  ),
  exam: defineAsyncComponent(() => import("../routes/StarHopeExam.vue")),
  "wrong-book": defineAsyncComponent(
    () => import("../routes/StarHopeWrongBook.vue"),
  ),
  ai: defineAsyncComponent(() => import("../routes/StarHopeAi.vue")),
  reader: defineAsyncComponent(() => import("../routes/StarHopeReader.vue")),
  plugins: defineAsyncComponent(() => import("../routes/StarHopePlugins.vue")),
  settings: defineAsyncComponent(
    () => import("../routes/StarHopeSettings.vue"),
  ),
};
</script>

<script setup lang="ts">
import { computed } from "vue";
import AuthGuard from "./AuthGuard.vue";
import { useNavigationStore } from "../stores/navigation";

const { currentRoute } = useNavigationStore();

// 未知/未设置的 currentRoute 会静默落到 dashboard：这里至少留一条警告，
// 否则路由名写错看起来就像「正常加载了首页」，很难发现
const activeComponent = computed(() => {
  const route = routes[currentRoute.value];
  if (!route) {
    console.warn(
      `[StarHope] 未知路由 "${currentRoute.value}"，已回退到 dashboard`,
    );
  }
  return route ?? routes.dashboard;
});
</script>

<template>
  <!-- login 只是「未登录时的落脚路由」：一律经 AuthGuard 判定，
       登录态下不再无条件弹「请先登录」（AuthGuard 自己会在未登录时渲染该提示） -->
  <AuthGuard>
    <component :is="activeComponent" />
  </AuthGuard>
</template>
