<template>
  <component
    :is="mode === 'modal' ? 'div' : AuthShell"
    :max-width="mode === 'modal' ? undefined : '440px'"
    :class="mode === 'modal' ? 'w-full' : undefined"
  >
    <AuthCard
      :title="t('recovery.title')"
      :subtitle="t('recovery.subtitle')"
      :mode="mode"
    >
      <RecoveryFlow @login="switchToLogin" />
    </AuthCard>
  </component>
</template>

<script setup lang="ts">
import { t } from "~/lib/i18n";
import { getAuthPath } from "~/features/auth/constants/auth-paths";
import AuthShell from "../shared/AuthShell.vue";
import AuthCard from "../shared/AuthCard.vue";
import RecoveryFlow from "./RecoveryFlow.vue";

const props = withDefaults(defineProps<{ mode?: "page" | "modal" }>(), {
  mode: "page",
});

function switchToLogin() {
  // page 模式（独立路由 /account/recovery）下并没有 AuthModal：原实现只会把一个登录弹窗
  // 叠在本页上方而 URL 仍是 recovery，看起来像坏了；直接跳到登录入口更符合预期
  if (props.mode === "page") {
    window.location.href = getAuthPath("login");
    return;
  }
  window.dispatchEvent(new CustomEvent("close-auth-modal"));
  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent("open-auth-modal", { detail: { view: "login" } }),
    );
  }, 150);
}
</script>
