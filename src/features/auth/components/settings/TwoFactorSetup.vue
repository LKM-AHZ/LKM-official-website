<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">{{ t("settings.2fa.title") }}</h3>

    <div
      class="flex items-center justify-between p-3 bg-page-bg rounded-lg gap-3"
    >
      <div>
        <span class="font-medium">{{ t("settings.2fa.totp") }}</span>
        <span
          class="badge badge-xs ml-2"
          :class="enabled ? 'badge-success' : 'badge-ghost'"
        >
          {{ enabled ? t("settings.2fa.on") : t("settings.2fa.off") }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <AuthStatus
          v-if="error"
          type="error"
          :message="error"
          class="text-xs"
        />
        <button
          v-if="!enabled && !enabling"
          type="button"
          class="btn btn-ghost btn-xs"
          @click="startEnable"
        >
          {{ t("settings.2fa.enable") }}
        </button>
        <button
          v-else-if="enabled"
          type="button"
          class="btn btn-ghost btn-xs text-error"
          @click="openDisableDialog"
        >
          {{ t("settings.2fa.disable") }}
        </button>
      </div>
    </div>

    <!-- 开启流程 Step 1：展示二维码 / 密钥，引导扫码 -->
    <div v-if="enabling" class="p-3 bg-page-bg rounded-lg space-y-3">
      <p class="text-xs text-text-muted">
        {{ t("settings.2fa.scanHint") }}
      </p>
      <div class="flex justify-center">
        <img
          v-if="qrUrl"
          :src="qrUrl"
          :alt="t('settings.2fa.qrAlt')"
          class="w-40 h-40 rounded-lg bg-white p-1"
        />
      </div>
      <div v-if="secret" class="text-center">
        <span
          class="font-mono text-xs bg-base-200 rounded px-2 py-1 break-all"
          >{{ secret }}</span
        >
      </div>

      <!-- Step 2：输入验证码完成设置 -->
      <form class="space-y-2" @submit.prevent="confirmEnable">
        <input
          v-model.trim="code"
          type="text"
          inputmode="numeric"
          class="input input-bordered input-sm w-full"
          :placeholder="t('settings.2fa.codePlaceholder')"
        />
        <div class="flex gap-2">
          <button
            type="submit"
            class="btn btn-primary btn-sm"
            :disabled="code.length < 6 || verifying"
          >
            <span
              v-if="verifying"
              class="loading loading-spinner loading-xs"
            ></span>
            <template v-else>{{ t("settings.2fa.confirmEnable") }}</template>
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs"
            :disabled="verifying"
            @click="cancelEnable"
          >
            {{ t("common.cancel") }}
          </button>
        </div>
      </form>
    </div>

    <!-- 恢复码展示（设置完成后返回并展示一次） -->
    <div
      v-if="recoveryCodes.length"
      class="p-3 bg-page-bg rounded-lg space-y-2"
    >
      <div class="flex items-center justify-between">
        <span class="font-medium text-sm">{{
          t("settings.2fa.recoveryCodes")
        }}</span>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          @click="acknowledgeRecoveryCodes"
        >
          {{ t("settings.2fa.hideRecoveryCodes") }}
        </button>
      </div>
      <p class="text-xs text-text-muted">
        {{ t("settings.2fa.recoveryHint") }}
      </p>
      <ul class="grid grid-cols-2 gap-1 font-mono text-xs">
        <li v-for="rc in recoveryCodes" :key="rc">{{ rc }}</li>
      </ul>
    </div>

    <!-- 关闭 2FA 需输入 TOTP 或恢复码 -->
    <!-- @submit.prevent：两个输入框里回车会触发原生表单提交（整页跳转并丢掉对话框状态） -->
    <form
      v-if="disableDialogOpen"
      class="p-3 bg-page-bg rounded-lg space-y-2"
      @submit.prevent="doDisable"
    >
      <p class="text-xs text-text-muted">{{ t("settings.2fa.disableHint") }}</p>
      <input
        v-if="!disableUsingRecovery"
        v-model.trim="disableCode"
        type="text"
        inputmode="numeric"
        class="input input-bordered input-sm w-full"
        placeholder="000000"
      />
      <input
        v-else
        v-model.trim="disableRecoveryCode"
        type="text"
        class="input input-bordered input-sm w-full"
        :placeholder="t('messages.mfa.recoveryPlaceholder')"
      />
      <button
        type="button"
        class="block text-xs text-primary hover:underline"
        @click="toggleDisableMode"
      >
        {{
          disableUsingRecovery
            ? t("messages.mfa.useTotp")
            : t("messages.mfa.useRecovery")
        }}
      </button>
      <div class="flex gap-2">
        <button
          type="button"
          class="btn btn-error btn-sm"
          :disabled="!disableCodeValid"
          @click="doDisable"
        >
          <span
            v-if="verifyingDisable"
            class="loading loading-spinner loading-xs"
          ></span>
          <template v-else>{{ t("settings.2fa.confirmDisable") }}</template>
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          :disabled="verifyingDisable"
          @click="closeDisableDialog"
        >
          {{ t("common.cancel") }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import QRCode from "qrcode";
import { authApi } from "~/lib/api/modules/auth";
import { t } from "~/lib/i18n";
import type { User } from "~/types/auth";
import AuthStatus from "../shared/AuthStatus.vue";

// 不带 payload：调用方（SettingsPage）只据此刷新提示，
// 之前 emit("update", {} as User) 是拿空对象硬充 User，类型上骗人
const emit = defineEmits<{
  (e: "update"): void;
}>();

defineProps<{
  user: User;
}>();

const enabled = ref(false);
const enabling = ref(false);
const verifying = ref(false);
const code = ref("");
const secret = ref("");
const qrUrl = ref("");
const error = ref("");
const recoveryCodes = ref<string[]>([]);
const disableDialogOpen = ref(false);
const disableCode = ref("");
const disableRecoveryCode = ref("");
const disableUsingRecovery = ref(false);
const verifyingDisable = ref(false);

// 关闭/重开禁用对话框都要清掉上一次的错误：否则 «@click="disableDialogOpen = false"»
// 会把它原样留到下一次打开（同一 error 也被启用面板复用）
function openDisableDialog(): void {
  error.value = "";
  disableDialogOpen.value = true;
}
function closeDisableDialog(): void {
  disableDialogOpen.value = false;
  error.value = "";
}
const disableCodeValid = computed(() =>
  disableUsingRecovery.value
    ? /^[0-9a-zA-Z]{20}$/.test(disableRecoveryCode.value.trim())
    : disableCode.value.length >= 6,
);

function toggleDisableMode() {
  disableUsingRecovery.value = !disableUsingRecovery.value;
  disableCode.value = "";
  disableRecoveryCode.value = "";
}

// 是否已开启 2FA：走真实 GET /auth/2fa/status
async function load() {
  const r = await authApi.get2FAStatus();
  if (r.isOk()) {
    enabled.value = r.value.enabled;
  }
}

async function startEnable() {
  error.value = "";
  enabling.value = true;
  code.value = "";
  recoveryCodes.value = [];
  const r = await authApi.start2FA();
  if (r.isErr()) {
    error.value = r.error.message;
    enabling.value = false;
    return;
  }
  secret.value = r.value.secret;
  try {
    qrUrl.value = await QRCode.toDataURL(r.value.qr_code_uri);
  } catch {
    qrUrl.value = "";
  }
}

function cancelEnable() {
  enabling.value = false;
  code.value = "";
  secret.value = "";
  qrUrl.value = "";
}

async function confirmEnable() {
  error.value = "";
  if (code.value.length < 6) {
    error.value = t("settings.2fa.enter6Digit");
    return;
  }
  verifying.value = true;
  try {
    const r = await authApi.verify2FAEnable(code.value);
    if (r.isErr()) {
      error.value = r.error.message;
      return;
    }
    enabled.value = true;
    enabling.value = false;
    recoveryCodes.value = r.value.recovery_codes ?? [];
    emit("update");
  } finally {
    verifying.value = false;
  }
}

/**
 * 用户确认已保存恢复码：后端需要这次确认（POST /2fa/setup/confirm）才算真正完成启用，
 * 此前前端从未调用 confirm2FA，若后端记录未确认态则 2FA 会停在半启用。
 */
async function acknowledgeRecoveryCodes(): Promise<void> {
  try {
    const r = await authApi.confirm2FA();
    if (r.isErr()) error.value = r.error.message;
  } catch (e) {
    console.warn("[TwoFactorSetup] 确认恢复码失败:", e);
  } finally {
    recoveryCodes.value = [];
  }
}

async function doDisable() {
  error.value = "";
  if (!disableCodeValid.value) {
    error.value = t("settings.2fa.enter6Digit");
    return;
  }
  verifyingDisable.value = true;
  try {
    // 未用到的那个字段传 undefined（与 verify2FA 的调用方式一致）：
    // 传空串会被后端的 6 位 TOTP 校验拒绝
    const r = await authApi.disable2FA(
      disableUsingRecovery.value ? undefined : disableCode.value,
      disableUsingRecovery.value ? disableRecoveryCode.value : undefined,
    );
    if (r.isErr()) {
      error.value = r.error.message;
      return;
    }
    enabled.value = false;
    recoveryCodes.value = [];
    disableDialogOpen.value = false;
    disableCode.value = "";
    disableRecoveryCode.value = "";
    disableUsingRecovery.value = false;
    emit("update");
  } finally {
    verifyingDisable.value = false;
  }
}

onMounted(load);
</script>
