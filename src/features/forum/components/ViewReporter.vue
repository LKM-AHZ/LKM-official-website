<template>
  <!-- 无 UI：只负责在客户端上报一次浏览，供「浏览历史」有数据可读 -->
</template>

<script setup lang="ts">
// 浏览上报。必须放在客户端：SSR 阶段后端只认 Authorization 头、而 SSR 只转发 Cookie
//（core/ports/authz.py 的 get_optional_user 只读头），服务端渲染时拿不到登录态。
//
// 失败一律静默（含 403）：这是**后台记账**，用户要看的正文已经渲染出来了。为一次浏览
// 计数弹「无权限」对话框或报错提示，只会让人莫名其妙——与点赞/收藏那类「用户的显式动作」
// 是两种性质。未登录直接跳过（后端该端点要求 interaction.history 权限点）。
import { onMounted } from "vue";
import { interactionApi } from "~/lib/api/modules/interaction";
import { useAuthStore } from "~/stores/auth";

const props = defineProps<{ contentId: string }>();

const auth = useAuthStore();

onMounted(() => {
  auth.restoreFromStorage();
  if (!auth.isLoggedIn) return;
  void interactionApi.reportView(props.contentId).then((res) => {
    if (res.isErr()) console.warn("[ViewReporter] 浏览上报失败:", res.error);
  });
});
</script>
