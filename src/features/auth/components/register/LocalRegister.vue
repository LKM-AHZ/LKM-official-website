<template>
  <form
    v-if="flow.stage === 'form'"
    @submit.prevent="flow.submit()"
    class="space-y-4"
  >
    <p class="text-sm text-text-muted text-center">
      {{ t("register.local.onlyUsername") }}
    </p>
    <AuthField
      id="reg-local-username"
      :label="t('register.local.username')"
      :placeholder="t('register.local.usernamePlaceholder')"
      autocomplete="username"
      v-model="flow.username"
    />
    <AuthField
      id="reg-local-password"
      :label="t('register.local.password')"
      type="password"
      :placeholder="t('register.local.passwordPlaceholder')"
      autocomplete="new-password"
      v-model="flow.password"
    />
    <AuthField
      id="reg-local-confirm"
      :label="t('register.local.confirm')"
      type="password"
      :placeholder="t('register.local.confirmPlaceholder')"
      autocomplete="new-password"
      v-model="flow.confirm"
    />
    <ApplyReasonField :flow="flow" />
    <AuthStatus v-if="flow.error" type="error" :message="flow.error" />
    <button
      type="submit"
      class="btn btn-primary w-full active:scale-[0.98] transition-transform"
      :disabled="flow.loading"
    >
      <span
        v-if="flow.loading"
        class="loading loading-spinner loading-sm"
      ></span>
      <span v-else>{{ t("register.local.submit") }}</span>
    </button>
  </form>
</template>

<script setup lang="ts">
import type { RegisterFlow } from "~/features/auth/composables/useRegisterFlow";
import { t } from "~/lib/i18n";
import AuthField from "../shared/AuthField.vue";
import ApplyReasonField from "../shared/ApplyReasonField.vue";
import AuthStatus from "../shared/AuthStatus.vue";

defineProps<{ flow: RegisterFlow }>();
</script>
