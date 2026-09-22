<template>
  <div
    v-if="store.session === 'restoring'"
    class="flex items-center justify-center min-h-[40vh]"
  >
    <span class="loading loading-spinner loading-lg"></span>
  </div>
  <!-- 只有服务端校验通过（fetchMe 成功后 session=authenticated）才放行：
       isLoggedIn 可能仅来自 localStorage 快照，没有可用 token 时它也可能是 true -->
  <slot v-else-if="store.session === 'authenticated'" />
  <div v-else class="flex items-center justify-center min-h-[40vh]">
    <div class="text-center">
      <h2 class="text-xl font-semibold text-deep-text mb-2">
        {{ t("settings.loginRequired") }}
      </h2>
      <p class="text-text-muted mb-4">{{ t("settings.loginRequiredHint") }}</p>
      <a :href="loginHref" class="btn btn-primary">{{
        t("settings.goLogin")
      }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { getAuthPath } from "~/features/auth/constants/auth-paths";
import { t } from "~/lib/i18n";

const store = useAuthStore();

// 登录后要能回到当前页：沿用仓库既有的 `login?redirect=<path>` 约定
// （StarHopeLoginRequired 也这么拼）。SSR 期没有 location，先渲染不带参数的链接、
// 挂载后再补上，避免水合前后 href 不一致。
const loginHref = ref(getAuthPath("login"));

// 在 setup 阶段就发起校验（不是 onMounted）：restoreAndValidate 会同步把 session 置为
// restoring，首个渲染即命中 spinner 分支，不会先闪一下「请先登录」再切换。
// 本组件所在页面用 client:only 挂载（见 src/pages/account.astro），不存在水合不一致问题。
if (!store.isLoggedIn && store.session !== "restoring") {
  void store.restoreAndValidate().catch(() => {
    // 兜底：任何异常都回到未登录态，避免永久 spinner + 未处理的 rejection
    store.session = "anonymous";
    store.isLoggedIn = false;
  });
}

onMounted(() => {
  loginHref.value = getAuthPath(
    `login?redirect=${encodeURIComponent(window.location.pathname)}`,
  );
});
</script>
