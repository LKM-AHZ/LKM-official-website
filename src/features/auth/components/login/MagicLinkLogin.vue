<template>
  <div class="space-y-4">
    <!-- Sent state -->
    <div v-if="stage === 'sent'" class="text-center space-y-4">
      <div class="rounded-xl border border-surface-3 bg-page-bg p-6 space-y-4">
        <div class="text-4xl">📧</div>
        <p class="font-semibold text-deep-text">
          {{ t("auth.login.magicSentTitle") }}
        </p>
        <p class="text-sm text-text-muted">
          {{ t("auth.login.magicSentSimulation") }}
          <span class="font-semibold">{{ email }}</span>
        </p>
        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="btn btn-primary btn-sm"
            @click="handleSimulateClick"
            :disabled="loading"
          >
            <span
              v-if="loading"
              class="loading loading-spinner loading-xs"
            ></span>
            <template v-else>{{ t("auth.login.simulateClick") }}</template>
          </button>
          <div class="flex gap-2 justify-center">
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              @click="goToStage('expired')"
            >
              {{ t("auth.login.simulateExpired") }}
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              @click="goToStage('used')"
            >
              {{ t("auth.login.simulateUsed") }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Expired state -->
    <div v-else-if="stage === 'expired'" class="text-center space-y-4">
      <div class="alert alert-warning">
        <span>{{ t("auth.login.linkExpired") }}</span>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="stage = 'input'"
      >
        {{ t("auth.login.backToResend") }}
      </button>
    </div>

    <!-- Used state -->
    <div v-else-if="stage === 'used'" class="text-center space-y-4">
      <div class="alert alert-warning">
        <span>{{ t("auth.login.linkUsed") }}</span>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="stage = 'input'"
      >
        {{ t("auth.login.backToResend") }}
      </button>
    </div>

    <!-- Input state (default) -->
    <form v-else @submit.prevent="handleSend" class="space-y-4">
      <p class="text-sm text-text-muted text-center">
        {{ t("auth.login.magicSendTo") }}
        <span class="font-semibold">{{ email }}</span>
      </p>
      <button type="submit" class="btn btn-primary w-full">
        {{ t("auth.login.sendMagicLink") }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { t } from "~/lib/i18n";
import type { LoginMethod } from "~/types/auth";

const emit = defineEmits<{
  (e: "login", method: LoginMethod, credentials: Record<string, string>): void;
}>();

const props = defineProps<{
  identifiedAccount: { email: string };
}>();

type Stage = "input" | "sent" | "expired" | "used";

const email = computed(() => props.identifiedAccount.email || "");
const stage = ref<Stage>("input");
const loading = ref(false);

function handleSend(e: Event) {
  e.preventDefault();
  stage.value = "sent";
}

// 模拟按钮的显式状态迁移：模板里裸改 stage 会把状态机写进视图、还能绕过在途请求，
// 收口到这里后将来要加冷却/重试上限/清错都有唯一落点
function goToStage(next: Stage) {
  loading.value = false;
  stage.value = next;
}

async function handleSimulateClick() {
  loading.value = true;
  emit("login", "magic-link", { email: email.value });
  loading.value = false;
}
</script>
