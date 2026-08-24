<script setup lang="ts">
// AdminMFAVerifyDialog.vue — 后台 2FA step-up 弹窗（配合 useAdminMFA）。
// 挂在需要写操作的后台组件里；open 由 useAdminMFA().dialog 驱动。
import { ref } from "vue";
import type { AdminMFAState } from "~/lib/http/useAdminMFA";
import { t } from "~/lib/i18n";

const props = defineProps<{ state: AdminMFAState }>();
const emit = defineEmits<{
  (e: "verify", code: string): void;
  (e: "cancel"): void;
}>();

const code = ref("");
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.state.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="emit('cancel')"
    >
      <div
        class="w-full max-w-sm rounded-xl bg-card-bg border border-surface-3 p-6 shadow-xl"
      >
        <h3 class="text-lg font-semibold text-deep-text mb-1">
          {{ t("admin.mfaTitle") }}
        </h3>
        <p class="text-sm text-text-muted mb-4">{{ t("admin.mfaHint") }}</p>

        <form @submit.prevent="emit('verify', code)">
          <input
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            :placeholder="t('admin.mfaCodePlaceholder')"
            class="w-full px-3 py-2 rounded-lg text-base tracking-widest text-center bg-page-bg border border-surface-3 focus:outline-none focus:border-primary"
          />
          <p v-if="props.state.error" class="mt-2 text-sm text-red-500">
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
