<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "../stores/auth";
import { useQuestionBankStore } from "../stores/question-bank";
import { useNavigationStore } from "../stores/navigation";
import { t } from "~/lib/i18n";

const auth = useAuthStore();
const bank = useQuestionBankStore();
const { navigate, navItems } = useNavigationStore();
const questionCount = ref(0);
const folderCount = ref(0);
const loading = ref(true);

onMounted(async () => {
  try {
    await Promise.all([bank.loadQuestions(), bank.loadFolders()]);
    questionCount.value = bank.questions.value.length;
    folderCount.value = bank.folders.value.length;
  } finally {
    loading.value = false;
  }
});

const shortcuts = [
  {
    labelKey: "starhope.dashboard.shortcuts.bank.label",
    descKey: "starhope.dashboard.shortcuts.bank.desc",
    route: "bank",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.practice.label",
    descKey: "starhope.dashboard.shortcuts.practice.desc",
    route: "practice",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.exam.label",
    descKey: "starhope.dashboard.shortcuts.exam.desc",
    route: "exam",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.wrongBook.label",
    descKey: "starhope.dashboard.shortcuts.wrongBook.desc",
    route: "wrong-book",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.ai.label",
    descKey: "starhope.dashboard.shortcuts.ai.desc",
    route: "ai",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.reader.label",
    descKey: "starhope.dashboard.shortcuts.reader.desc",
    route: "reader",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.plugins.label",
    descKey: "starhope.dashboard.shortcuts.plugins.desc",
    route: "plugins",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.settings.label",
    descKey: "starhope.dashboard.shortcuts.settings.desc",
    route: "settings",
  },
] as const;
</script>

<template>
  <div
    class="mx-auto w-full max-w-6xl px-4 py-7 pb-16 sm:px-7 sm:py-9 lg:px-10"
  >
    <section
      class="mb-7 overflow-hidden rounded-3xl border border-surface-3 bg-card-bg p-6 sm:p-8"
    >
      <div
        class="mb-5 flex size-11 items-center justify-center rounded-2xl bg-btn-regular-bg text-primary-readable"
      >
        <Icon icon="tabler:school" class="size-6" aria-hidden="true" />
      </div>
      <p class="mb-1 text-xs font-semibold tracking-wide text-primary-readable">
        {{ t("starhope.tagline") }}
      </p>
      <h1
        class="text-2xl font-semibold tracking-tight text-deep-text sm:text-3xl"
      >
        {{
          t("starhope.dashboard.greeting", {
            name: auth.currentUser.value?.username ?? t("starhope.user"),
          })
        }}
      </h1>
      <p class="mt-2 text-sm text-text-muted">
        {{ t("starhope.dashboard.welcomeBack") }}
      </p>
    </section>

    <div class="mb-9 grid grid-cols-2 gap-3">
      <div class="card-base flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <span
          class="flex size-11 items-center justify-center rounded-2xl bg-btn-regular-bg text-primary-readable"
          ><Icon icon="tabler:books" class="size-5" aria-hidden="true"
        /></span>
        <div>
          <div class="text-2xl font-semibold tabular-nums text-deep-text">
            {{ loading ? "—" : questionCount }}
          </div>
          <div class="text-xs text-text-muted">
            {{ t("starhope.dashboard.stats.totalQuestions") }}
          </div>
        </div>
      </div>
      <div class="card-base flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <span
          class="flex size-11 items-center justify-center rounded-2xl bg-btn-regular-bg text-primary-readable"
          ><Icon icon="tabler:folder" class="size-5" aria-hidden="true"
        /></span>
        <div>
          <div class="text-2xl font-semibold tabular-nums text-deep-text">
            {{ loading ? "—" : folderCount }}
          </div>
          <div class="text-xs text-text-muted">
            {{ t("starhope.dashboard.stats.folders") }}
          </div>
        </div>
      </div>
    </div>

    <h2 class="mb-4 text-base font-semibold text-deep-text">
      {{ t("starhope.dashboard.shortcutsTitle") }}
    </h2>
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <button
        v-for="item in shortcuts"
        :key="item.route"
        type="button"
        class="card-base group flex min-h-32 flex-col items-start p-4 text-left hover:border-primary-readable/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-action sm:p-5"
        @click="navigate(item.route)"
      >
        <Icon
          :icon="
            navItems.find((nav) => nav.route === item.route)?.icon ??
            'tabler:arrow-right'
          "
          class="mb-4 size-5 text-primary-readable"
          aria-hidden="true"
        />
        <span class="text-sm font-semibold text-deep-text">{{
          t(item.labelKey)
        }}</span>
        <span class="mt-1 text-xs text-text-muted">{{ t(item.descKey) }}</span>
        <Icon
          icon="tabler:arrow-up-right"
          class="mt-auto self-end text-text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
