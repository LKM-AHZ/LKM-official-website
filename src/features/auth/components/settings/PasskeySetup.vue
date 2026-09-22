<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">{{ t("settings.passkey.title") }}</h3>

    <AuthStatus v-if="error" type="error" :message="error" class="text-xs" />

    <!-- 创建表单 -->
    <form class="flex gap-2 items-center" @submit.prevent="createPasskey">
      <input
        v-model.trim="newName"
        type="text"
        class="input input-bordered input-sm flex-1"
        :placeholder="t('settings.passkey.namePlaceholder')"
      />
      <button
        type="submit"
        class="btn btn-primary btn-sm"
        :disabled="creating || !newName"
      >
        <span v-if="creating" class="loading loading-spinner loading-xs"></span>
        <template v-else>{{ t("common.create") }}</template>
      </button>
    </form>

    <div v-if="loadingList" class="py-4 text-center text-sm text-text-muted">
      {{ t("common.loading") }}
    </div>

    <!-- 列表 -->
    <ul v-else class="space-y-2">
      <li
        v-for="pk in passkeys"
        :key="pk.id"
        class="flex items-center justify-between p-3 bg-page-bg rounded-lg gap-3"
      >
        <div class="flex-1 min-w-0">
          <span class="font-medium block truncate">{{ pk.device_name }}</span>
          <span class="text-xs text-text-muted"
            >{{ pk.credential_id.slice(0, 12) }}…</span
          >
        </div>
        <div class="flex gap-1 shrink-0">
          <button
            type="button"
            class="btn btn-ghost btn-xs text-error"
            :disabled="deletingId !== null"
            @click="confirmDelete = pk.id"
          >
            {{ t("common.delete") }}
          </button>
        </div>
      </li>
      <li v-if="!passkeys.length" class="text-sm text-text-muted py-2">
        {{ t("settings.passkey.empty") }}
      </li>
    </ul>

    <ConfirmDialog
      :open="confirmDelete !== null"
      :title="t('settings.passkey.deleteTitle')"
      :message="t('settings.passkey.deleteMessage')"
      :confirm-text="t('common.delete')"
      danger
      @confirm="confirmDelete && doDelete(confirmDelete)"
      @cancel="confirmDelete = null"
    />

    <StepUp2FADialog
      :state="stepUp.dialog"
      @submit="stepUp.onCode"
      @cancel="stepUp.onCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { authApi } from "~/lib/api/modules/auth";
import { t } from "~/lib/i18n";
import type { PasskeyCredential } from "~/lib/api/modules/auth";
import type { User } from "~/types/auth";
import AuthStatus from "../shared/AuthStatus.vue";
import ConfirmDialog from "./ConfirmDialog.vue";
import StepUp2FADialog from "./StepUp2FADialog.vue";
import { useStepUp2FA } from "~/lib/http/useStepUp2FA";
import { registerNew } from "../../lib/webauthn";

const props = defineProps<{
  user: User;
}>();

const passkeys = ref<PasskeyCredential[]>([]);
const loadingList = ref(false);
const error = ref("");
const newName = ref("");
const creating = ref(false);
const confirmDelete = ref<string | null>(null);
const deletingId = ref<string | null>(null);
// 危险删除 passkey 需 2FA step-up（弹窗承载于本组件）
const stepUp = useStepUp2FA(t("settings.passkey.deleteStepUpHint"));

async function load() {
  loadingList.value = true;
  error.value = "";
  try {
    const r = await authApi.listPasskeys();
    if (r.isErr()) {
      error.value = r.error.message;
      return;
    }
    passkeys.value = r.value;
  } catch (e) {
    // 只有 finally 的话，抛出的异常会以未处理拒绝逃出去，列表空着且没有任何提示
    error.value =
      e instanceof Error ? e.message : t("messages.operationFailed");
  } finally {
    loadingList.value = false;
  }
}

// 创建通行密钥：begin → 浏览器 WebAuthn → registerComplete
async function createPasskey() {
  // 显式在飞判断：按钮虽然 disabled，但 Enter 提交/程序化调用仍可能重复触发（WebAuthn 会弹两次窗）
  if (creating.value) return;
  error.value = "";
  const name = newName.value.trim();
  if (!name) return;
  creating.value = true;
  try {
    const begin = await authApi.passkeyRegisterBegin();
    if (begin.isErr()) {
      error.value = begin.error.message;
      return;
    }
    const serialized = await registerNew(begin.value.public_key);
    const done = await authApi.passkeyRegisterComplete(
      serialized.rawId,
      begin.value.challenge_id,
      serialized.response,
      name,
    );
    if (done.isErr()) {
      error.value = done.error.message;
      return;
    }
    // 重新拉取列表以获得后端分配的 id / created_at
    await load();
    newName.value = "";
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : t("settings.passkey.createFail");
  } finally {
    creating.value = false;
  }
}

async function doDelete(id: string) {
  confirmDelete.value = null;
  deletingId.value = id;
  error.value = "";
  try {
    // 危险删除 passkey 需 2FA step-up：遇缺信任自动弹窗验证后重放
    const r = await stepUp.run(() => authApi.deletePasskey(id));
    if (r.isErr()) {
      error.value = r.error.message;
      return;
    }
    passkeys.value = passkeys.value.filter((p) => p.id !== id);
  } catch (e) {
    // 与 createPasskey 对齐：step-up 编排/接口抛错时也要落成可见错误，
    // 否则行静默留在列表里，用户以为删除失败是「没反应」
    error.value =
      e instanceof Error ? e.message : t("messages.operationFailed");
  } finally {
    deletingId.value = null;
  }
}

onMounted(load);

// 用上 user：同一实例内换账号（设置页不重新挂载）时重取列表——passkey 列表属于当前账号，
// 沿用旧数据会显示上一个账号的钥匙
watch(
  () => props.user.id,
  () => void load(),
);
</script>
