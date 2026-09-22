<template>
  <Teleport to="body">
    <Transition name="cd-fade">
      <div
        v-if="open"
        ref="overlayRef"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="handleCancel"
      >
        <!-- 遮罩：仅用于压暗，pointer-events-none 让点击穿透到外层 overlay，
             否则点击目标始终是遮罩，外层 @click.self 永远不触发（点遮罩关不掉） -->
        <div
          class="absolute inset-0 bg-black/40 pointer-events-none"
          aria-hidden="true"
        ></div>

        <!-- 对话框 -->
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          :class="[
            'relative z-10 w-full max-w-sm rounded-2xl bg-card-bg border border-surface-3 shadow-xl p-6',
            danger ? 'border-error/30' : '',
          ]"
          tabindex="-1"
        >
          <h3 class="text-lg font-semibold mb-1">{{ title }}</h3>
          <p v-if="message" class="text-sm text-text-muted mb-5">
            {{ message }}
          </p>

          <div class="flex gap-3 justify-end">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              data-testid="confirm"
              class="btn btn-sm"
              :class="danger ? 'btn-error text-white' : 'btn-primary'"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onBeforeUnmount, nextTick, ref } from "vue";
import { t } from "~/lib/i18n";

// 文案默认值走 i18n：调用方漏传 confirmText/cancelText/title 时，
// 空串会渲染成「空白按钮 + 空 aria-label」，既不可用也不可访问
const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }>(),
  {
    title: t("common.confirm"),
    message: "",
    confirmText: t("common.confirm"),
    cancelText: t("common.cancel"),
    danger: false,
  },
);

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

const overlayRef = ref<HTMLElement | null>(null);
// 锁前的 body overflow。非 null 同时表示「锁是本对话框加的」：
// 别的浮层可能已经锁过滚动，关闭时直接置空会把它们的锁一起解掉
let previousBodyOverflow: string | null = null;

function handleConfirm() {
  emit("confirm");
}

function handleCancel() {
  emit("cancel");
}

function onKeydown(e: KeyboardEvent) {
  // 只在自身打开时响应（未打开的实例不得因别的弹窗按 Esc 而 emit cancel）
  if (e.key === "Escape" && props.open) handleCancel();
}

// 打开后聚焦到对话框（供键盘/读屏访问），并锁定背景滚动
watch(
  () => props.open,
  async (val) => {
    if (val) {
      if (previousBodyOverflow === null) {
        previousBodyOverflow = document.body.style.overflow;
      }
      document.body.style.overflow = "hidden";
      await nextTick();
      overlayRef.value?.focus();
      return;
    }
    if (previousBodyOverflow !== null) {
      document.body.style.overflow = previousBodyOverflow;
      previousBodyOverflow = null;
    }
  },
);

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  // 打开状态下被父级直接卸载时也要解锁
  if (previousBodyOverflow !== null) {
    document.body.style.overflow = previousBodyOverflow;
    previousBodyOverflow = null;
  }
});
</script>

<style scoped>
.cd-fade-enter-active,
.cd-fade-leave-active {
  transition: opacity 0.2s ease;
}
.cd-fade-enter-from,
.cd-fade-leave-to {
  opacity: 0;
}
</style>
