<template>
  <Teleport to="body">
    <Transition name="cd-fade">
      <div
        v-if="state.open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="onCancel"
      >
        <!-- 遮罩：只负责压暗，pointer-events-none 让点击穿透到外层 overlay，
             否则事件目标始终是遮罩，外层 @click.self 永远不触发（点遮罩关不掉） -->
        <div
          class="absolute inset-0 bg-black/40 pointer-events-none"
          aria-hidden="true"
        ></div>

        <!-- 对话框 -->
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="t('messages.mfa.stepUpDialogTitle')"
          class="relative z-10 w-full max-w-sm rounded-2xl bg-card-bg border border-surface-3 shadow-xl p-6"
        >
          <h3 class="text-lg font-semibold mb-1">
            {{ t("messages.mfa.stepUpDialogTitle") }}
          </h3>
          <p class="text-sm text-text-muted mb-5">{{ state.message }}</p>

          <form class="space-y-4" @submit.prevent="submit">
            <input
              v-if="!showRecovery"
              v-model.trim="code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              pattern="[0-9]*"
              class="input input-bordered w-full text-center text-lg tracking-[0.5em]"
              :placeholder="t('messages.mfa.codePlaceholder')"
              autofocus
            />
            <input
              v-else
              v-model.trim="code"
              type="text"
              autocomplete="one-time-code"
              maxlength="20"
              class="input input-bordered w-full text-center text-lg tracking-widest"
              :placeholder="t('messages.mfa.recoveryPlaceholder')"
              autofocus
            />

            <p v-if="state.error" class="text-sm text-error">
              {{ state.error }}
            </p>

            <button
              type="button"
              class="block text-xs text-primary hover:underline"
              @click="toggleMode"
            >
              {{
                showRecovery
                  ? t("messages.mfa.useTotp")
                  : t("messages.mfa.useRecovery")
              }}
            </button>

            <div class="flex gap-3 justify-end">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                :disabled="state.submitting"
                @click="onCancel"
              >
                {{ t("common.cancel") }}
              </button>
              <button
                type="submit"
                class="btn btn-primary btn-sm"
                :disabled="state.submitting || !codeValid"
              >
                <span
                  v-if="state.submitting"
                  class="loading loading-spinner loading-xs"
                ></span>
                <template v-else>{{ t("messages.mfa.verifyButton") }}</template>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import type { StepUpDialogState } from "~/lib/http/useStepUp2FA";
import { t } from "~/lib/i18n";

const props = defineProps<{ state: StepUpDialogState }>();

const emit = defineEmits<{
  (e: "submit", code: string, mode: "totp" | "recovery"): void;
  (e: "cancel"): void;
}>();

const code = ref("");
const showRecovery = ref(false);

// 验证成功时是父级（useStepUp2FA.finish(true)）直接关弹窗，不走 onCancel：
// 不复位的话 showRecovery 会残留 true，下次打开直接进「恢复码」模式，输入框与文案都是错的
watch(
  () => props.state.open,
  (open) => {
    if (!open) {
      code.value = "";
      showRecovery.value = false;
    }
  },
);

// Escape 关闭：与「取消」按钮同一语义，submitting 期间同样不允许中断
function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape" && props.state.open && !props.state.submitting) {
    onCancel();
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));

// TOTP 固定 6 位数字（只判长度会把 "abcdef" 也放过去）；
// 恢复码后端为 secrets.token_hex(10) 生成的 20 位十六进制，这里用 20 位字母数字做超集校验，
// 不会误拒有效码，最终以服务端校验为准。
const codeValid = computed(() =>
  showRecovery.value
    ? /^[0-9a-zA-Z]{20}$/.test(code.value.trim())
    : /^\d{6}$/.test(code.value.trim()),
);

function toggleMode() {
  showRecovery.value = !showRecovery.value;
  code.value = "";
}

function submit() {
  if (!codeValid.value) return;
  const mode: "totp" | "recovery" = showRecovery.value ? "recovery" : "totp";
  emit("submit", code.value.trim(), mode);
  code.value = "";
}

function onCancel() {
  code.value = "";
  showRecovery.value = false;
  emit("cancel");
}
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
