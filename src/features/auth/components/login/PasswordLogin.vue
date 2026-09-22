<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="label pb-1" for="login-password">
        <span class="label-text font-medium">{{
          t("auth.login.passwordLabel")
        }}</span>
      </label>
      <input
        id="login-password"
        type="password"
        class="input input-bordered w-full"
        :class="{ 'input-error': passwordError }"
        v-model="password"
        :placeholder="t('auth.login.passwordPlaceholder')"
        autocomplete="current-password"
        @input="passwordError = ''"
      />
      <span v-if="passwordError" class="label-text-alt text-error">{{
        passwordError
      }}</span>
    </div>
    <div
      v-if="
        identifiedAccount.account_level &&
        identifiedAccount.account_level !== 'local'
      "
      class="text-right"
    >
      <a
        :href="getAuthPath('account/recovery')"
        class="text-xs text-primary hover:underline"
        >{{ t("auth.login.forgotPassword") }}</a
      >
    </div>
    <button type="submit" class="btn btn-primary w-full" :disabled="loading">
      <span v-if="loading" class="loading loading-spinner loading-xs"></span>
      <template v-else>{{ t("auth.login.title") }}</template>
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getAuthPath } from "~/features/auth/constants/auth-paths";
import { t } from "~/lib/i18n";
import type { LoginMethod } from "~/types/auth";

const emit = defineEmits<{
  (e: "login", method: LoginMethod, credentials: Record<string, string>): void;
}>();

const props = defineProps<{
  identifiedAccount: { username: string; account_level?: string };
}>();

const password = ref("");
const passwordError = ref("");
const loading = ref(false);

async function handleSubmit() {
  if (!password.value) {
    passwordError.value = t("auth.login.passwordRequired");
    return;
  }
  if (password.value.length < 6) {
    passwordError.value = t("auth.login.passwordTooShort");
    return;
  }
  passwordError.value = "";
  loading.value = true;
  emit("login", "password", {
    username: props.identifiedAccount.username,
    password: password.value,
  });
  loading.value = false;
}
</script>
