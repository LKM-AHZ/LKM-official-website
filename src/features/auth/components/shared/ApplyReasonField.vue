<template>
  <div class="w-full">
    <label :for="fieldId" class="label pb-1">
      <span class="label-text font-medium">{{
        t("auth.register.applyReasonLabel")
      }}</span>
    </label>
    <textarea
      :id="fieldId"
      class="textarea textarea-bordered w-full"
      rows="3"
      maxlength="500"
      :placeholder="t('auth.register.applyReasonPlaceholder')"
      :value="flow.applyReason"
      @input="flow.applyReason = ($event.target as HTMLTextAreaElement).value"
    />
    <span class="label-text-alt text-text-muted">{{
      t("auth.register.applyReasonHint")
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { useId } from "vue";
import type { RegisterFlow } from "~/features/auth/composables/useRegisterFlow";
import { t } from "~/lib/i18n";

defineProps<{ flow: RegisterFlow }>();

const fieldId = `reg-apply-reason-${useId()}`;
</script>
