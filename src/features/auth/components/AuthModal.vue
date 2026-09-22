<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="dialogRef"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Authentication dialog"
    >
      <!-- 遮罩：点击关闭 -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        data-auth-close
        @click="close"
      ></div>

      <!-- 定位容器（居中卡片，模态卡片直接内嵌，无「卡中套卡」） -->
      <div class="relative z-10 w-full max-w-md mx-4">
        <!-- 关闭按钮：由 AuthModal 负责，不侵入卡片内部 -->
        <button
          type="button"
          class="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle z-10"
          :aria-label="t('common.close')"
          @click="close"
        >
          &#10005;
        </button>
        <slot>
          <LoginPage v-if="view === 'login'" mode="modal" />
          <RegisterPage v-else-if="view === 'register'" mode="modal" />
          <RecoveryPage v-else-if="view === 'recovery'" mode="modal" />
        </slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent } from "vue";
import { t } from "~/lib/i18n";
// 三个认证子页改为异步组件：仅在模态打开时按需加载，
// 避免登录/注册/找回把各自 JS 塞进全站每页的关键路径（首屏 TBT 成本）。
const LoginPage = defineAsyncComponent(() => import("./login/LoginPage.vue"));
const RegisterPage = defineAsyncComponent(
  () => import("./register/RegisterPage.vue"),
);
const RecoveryPage = defineAsyncComponent(
  () => import("./recovery/RecoveryPage.vue"),
);

type View = "login" | "register" | "recovery";

const isOpen = ref(false);
const view = ref<View>("login");
const dialogRef = ref<HTMLElement | null>(null);

// 触发元素：关闭后恢复焦点
let triggerElement: HTMLElement | null = null;
// 本弹窗打开前的 body overflow。非 null 同时表示「滚动锁是本弹窗加的」：
// 别的浮层可能已经锁了滚动，关闭时直接置空会把它的锁一并解掉
let previousBodyOverflow: string | null = null;

const VALID_VIEWS: View[] = ["login", "register", "recovery"];

function open(nextView: View = "login") {
  // 已经打开时不要重新捕获焦点来源：此时 activeElement 已经是弹窗内部的节点，
  // 关闭时它会随弹窗一起卸载，原来的「关闭后把焦点还回去」目标就永久丢了
  if (!isOpen.value) {
    triggerElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }
  view.value = nextView;
  isOpen.value = true;
  // 滚动锁定（记录打开前的值，关闭时原样还回去）
  if (previousBodyOverflow === null) {
    previousBodyOverflow = document.body.style.overflow;
  }
  document.body.style.overflow = "hidden";
  // 打开后聚焦首个可聚焦元素
  nextTickFocus();
}

function close() {
  if (!isOpen.value) return;
  isOpen.value = false;
  // 复原滚动
  if (previousBodyOverflow !== null) {
    document.body.style.overflow = previousBodyOverflow;
    previousBodyOverflow = null;
  }
  // 焦点还原到触发元素（它可能在弹窗打开期间被卸载，对脱离文档的元素 focus 是空操作）
  if (triggerElement?.isConnected) {
    triggerElement.focus();
  }
  triggerElement = null;
}

function nextTickFocus() {
  requestAnimationFrame(() => {
    // 用模板 ref 而不是全局 document.querySelector：页面上可能有别的 [role=dialog]
    // （如提问弹窗），全局取第一个会把焦点送进不属于本弹窗的对话框；
    // 同时排除 tabindex="-1"（不可顺序聚焦）
    const focusable = dialogRef.value?.querySelector<HTMLElement>(
      'input:not([disabled]), button:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable) focusable.focus();
  });
}

function onOpenAuth(e: Event) {
  const detail = (e as CustomEvent).detail as { view?: string } | undefined;
  const target =
    detail?.view && VALID_VIEWS.includes(detail.view as View)
      ? (detail.view as View)
      : "login";
  open(target);
}

function onCloseAuth() {
  close();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isOpen.value) {
    close();
  }
}

onMounted(() => {
  window.addEventListener("open-auth-modal", onOpenAuth);
  window.addEventListener("close-auth-modal", onCloseAuth);
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("open-auth-modal", onOpenAuth);
  window.removeEventListener("close-auth-modal", onCloseAuth);
  document.removeEventListener("keydown", onKeydown);
  // 卸载时只在「锁是本弹窗加的」情况下解锁，否则会解掉别的浮层的锁
  if (previousBodyOverflow !== null) {
    document.body.style.overflow = previousBodyOverflow;
    previousBodyOverflow = null;
  }
});
</script>
