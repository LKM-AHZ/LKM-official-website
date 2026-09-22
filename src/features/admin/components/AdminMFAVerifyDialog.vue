<script setup lang="ts">
// AdminMFAVerifyDialog.vue — 后台 2FA step-up 弹窗（配合 useAdminMFA）。
// 挂在需要写操作的后台组件里；open 由 useAdminMFA().dialog 驱动。
import { ref, watch, nextTick } from "vue";
import type { AdminMFAState } from "~/lib/http/useAdminMFA";
import { t } from "~/lib/i18n";

const props = defineProps<{ state: AdminMFAState }>();
const emit = defineEmits<{
  (e: "verify", code: string): void;
  (e: "cancel"): void;
}>();

const code = ref("");
const codeInput = ref<HTMLInputElement | null>(null);

// 组件实例常驻（只有 v-if 内部节点随 state.open 挂载），不主动清空的话
// 重开弹窗会把上一次输入的验证码带进来，既可一键误提交又误导用户
watch(
  () => props.state.open,
  async (open) => {
    if (!open) return;
    code.value = "";
    await nextTick();
    codeInput.value?.focus();
  },
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.state.open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-mfa-title"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="!props.state.submitting && emit('cancel')"
      @keydown.esc="!props.state.submitting && emit('cancel')"
    >
      <div
        class="w-full max-w-sm rounded-xl bg-card-bg border border-surface-3 p-6 shadow-xl"
      >
        <h3
          id="admin-mfa-title"
          class="text-lg font-semibold text-deep-text mb-1"
        >
          {{ t("admin.mfaTitle") }}
        </h3>
        <p class="text-sm text-text-muted mb-4">{{ t("admin.mfaHint") }}</p>

        <form @submit.prevent="emit('verify', code.trim())">
          <input
            ref="codeInput"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="32"
            :aria-invalid="!!props.state.error"
            :placeholder="t('admin.mfaCodePlaceholder')"
            class="w-full px-3 py-2 rounded-lg text-base tracking-widest text-center bg-page-bg border border-surface-3 focus:outline-none focus:border-primary"
          />
          <!-- role="alert" 让「验证失败」被读屏即时播报；输入框同时标 aria-invalid -->
          <p
            v-if="props.state.error"
            role="alert"
            class="mt-2 text-sm text-red-500"
          >
            {{ props.state.error }}
          </p>
          <div class="flex gap-2 mt-4">
            <button
              type="button"
              class="flex-1 px-4 py-2 rounded-lg text-sm bg-surface-3 text-deep-text hover:bg-surface-3/70"
              :disabled="props.state.submitting"
              @click="emit('cancel')"
            >
              {{ t("common.cancel") }}
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 rounded-lg text-sm bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50"
              :disabled="props.state.submitting || !code.trim()"
            >
              {{ t("admin.verify") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
