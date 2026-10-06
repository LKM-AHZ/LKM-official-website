<script setup lang="ts">
import { getAuthPath } from "~/features/auth/constants/auth-paths";
import { t } from "~/lib/i18n";
import { Icon } from "@iconify/vue";
const loginUrl = getAuthPath("login?redirect=/starhope");
</script>

<template>
  <div
    class="flex min-h-[calc(100dvh-8rem)] items-center justify-center bg-page-bg px-4 py-10"
  >
    <div class="w-full max-w-md">
      <div class="card-base p-8 text-center sm:p-10">
        <span
          class="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-btn-regular-bg text-primary-readable"
          ><Icon icon="tabler:lock" class="size-7" aria-hidden="true"
        /></span>
        <h1 class="mb-2 text-xl font-semibold text-deep-text">
          {{ t("starhope.loginRequired.title") }}
        </h1>
        <p class="mb-6 text-sm leading-6 text-text-muted">
          {{ t("starhope.loginRequired.message") }}
        </p>
        <a
          :href="loginUrl"
          class="btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold"
        >
          {{ t("starhope.loginRequired.goLogin") }}
        </a>
      </div>
    </div>
  </div>
</template>
