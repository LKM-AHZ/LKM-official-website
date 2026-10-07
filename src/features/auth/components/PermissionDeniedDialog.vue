<template>
  <ConfirmDialog
    :open="open"
    :title="t('permission.deniedTitle')"
    :message="message"
    :confirm-text="confirmText"
    :cancel-text="t('permission.dismiss')"
    @confirm="handleConfirm"
    @cancel="open = false"
  />
</template>

<script setup lang="ts">
// 全站唯一的「越权被拒」出口：由 lib/http/client.ts 在非 GET 的 403 上广播
// lkm:permission-denied（分类见 lib/http/permission-denied.ts），本组件负责把
// 后端那句 `Missing permission: content.create` 翻译成用户看得懂的
// 「无权限 + 去哪补完注册」，而不是各调用方各自展示英文原文或干脆静默。
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { onPermissionDenied } from "~/lib/http/permission-denied";
import { getAuthPath } from "~/features/auth/constants/auth-paths";
import ConfirmDialog from "~/features/auth/components/settings/ConfirmDialog.vue";
import { t } from "~/lib/i18n";

const auth = useAuthStore();
const open = ref(false);

// local 是唯一「补完注册就能解锁」的档位（后端只给 local:member 授了 avatar_update）；
// normal/admin 被拒属于角色或对象级权限，建议他们「去注册」是错的。
// 刻意用 user.account_level 而不是 store 的 accountLevel getter —— 后者在会话未水合时
// 兜底成 "local"，会把「还不知道是谁」说成「你是本地账户」。
const isLocalAccount = computed(() => auth.user?.account_level === "local");

const message = computed(() =>
  t(isLocalAccount.value ? "permission.deniedLocal" : "permission.deniedOther"),
);
const confirmText = computed(() =>
  t(isLocalAccount.value ? "permission.goRegister" : "permission.viewAccount"),
);

// 一次动作可能并发多个 403（多图上传、批量操作）：已弹出时不重入，
// 否则会反复重置对话框状态、把用户正要点的按钮挪走
function handleDenied(): void {
  if (!open.value) open.value = true;
}

function handleConfirm(): void {
  open.value = false;
  // 绑定邮箱/手机号在账户设置的 security 段，带上 section 让引导直接落到那一栏
  window.location.href = getAuthPath(
    isLocalAccount.value ? "account?section=security" : "account",
  );
}

let unsubscribe: (() => void) | null = null;
onMounted(() => {
  unsubscribe = onPermissionDenied(handleDenied);
});
onUnmounted(() => {
  unsubscribe?.();
});
</script>
