<template>
  <div class="space-y-4 text-center">
    <p class="text-sm text-text-muted">
      {{ t("auth.login.passkeyUnavailable") }}
    </p>
    <div class="rounded-xl border border-surface-3 bg-page-bg p-6 space-y-4">
      <div class="text-5xl">🔑</div>
      <p class="font-semibold text-deep-text">
        {{ t("auth.login.passkeyTitle") }}
      </p>
      <p class="text-xs text-text-muted">{{ t("auth.login.passkeyHint") }}</p>
      <button type="button" class="btn btn-primary" disabled>
        {{ t("auth.login.passkeyComingSoon") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from "~/lib/i18n";
</script>
