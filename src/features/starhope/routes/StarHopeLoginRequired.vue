<script setup lang="ts">
import { getAuthPath } from "~/features/auth/constants/auth-paths";
import { t } from "~/lib/i18n";
const loginUrl = getAuthPath("login?redirect=/starhope");
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-page-bg">
    <div class="w-full max-w-md px-4">
      <div class="card-base p-8 text-center">
        <div class="text-5xl mb-4" aria-hidden="true">🔐</div>
        <h1 class="text-2xl font-bold text-deep-text mb-2">
          {{ t("starhope.loginRequired.title") }}
        </h1>
        <p class="text-sm text-text-muted mb-6">
          {{ t("starhope.loginRequired.message") }}
        </p>
        <a
          :href="loginUrl"
          class="inline-block btn-primary rounded-lg px-6 py-2.5 text-sm font-semibold"
        >
          {{ t("starhope.loginRequired.goLogin") }}
        </a>
      </div>
    </div>
  </div>
</template>
