<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useQuestionBankStore } from "../stores/question-bank";
import { useNavigationStore } from "../stores/navigation";
import { t } from "~/lib/i18n";

const auth = useAuthStore();
const bank = useQuestionBankStore();
const { navigate } = useNavigationStore();
const questionCount = ref(0);
const folderCount = ref(0);

onMounted(async () => {
  await bank.loadQuestions();
  await bank.loadFolders();
  questionCount.value = bank.questions.value.length;
  folderCount.value = bank.folders.value.length;
});

const shortcuts = [
  {
    labelKey: "starhope.dashboard.shortcuts.bank.label",
    descKey: "starhope.dashboard.shortcuts.bank.desc",
    icon: "📚",
    route: "bank",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.practice.label",
    descKey: "starhope.dashboard.shortcuts.practice.desc",
    icon: "✏️",
    route: "practice",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.exam.label",
    descKey: "starhope.dashboard.shortcuts.exam.desc",
    icon: "📝",
    route: "exam",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.wrongBook.label",
    descKey: "starhope.dashboard.shortcuts.wrongBook.desc",
    icon: "📕",
    route: "wrong-book",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.ai.label",
    descKey: "starhope.dashboard.shortcuts.ai.desc",
    icon: "🤖",
    route: "ai",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.reader.label",
    descKey: "starhope.dashboard.shortcuts.reader.desc",
    icon: "📖",
    route: "reader",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.plugins.label",
    descKey: "starhope.dashboard.shortcuts.plugins.desc",
    icon: "🧩",
    route: "plugins",
  },
  {
    labelKey: "starhope.dashboard.shortcuts.settings.label",
    descKey: "starhope.dashboard.shortcuts.settings.desc",
    icon: "⚙️",
    route: "settings",
  },
] as const;
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-deep-text mb-1">
      {{
        t("starhope.dashboard.greeting", {
          name: auth.currentUser.value?.username ?? t("starhope.user"),
        })
      }}
    </h1>
    <p class="text-sm text-text-muted mb-8">
      {{ t("starhope.dashboard.welcomeBack") }}
    </p>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      <div class="card-base p-5 text-center">
        <div class="text-3xl mb-2">📚</div>
        <div class="text-2xl font-bold text-deep-text">{{ questionCount }}</div>
        <div class="text-xs text-text-muted mt-1">
          {{ t("starhope.dashboard.stats.totalQuestions") }}
        </div>
      </div>
      <div class="card-base p-5 text-center">
        <div class="text-3xl mb-2">📁</div>
        <div class="text-2xl font-bold text-deep-text">{{ folderCount }}</div>
        <div class="text-xs text-text-muted mt-1">
          {{ t("starhope.dashboard.stats.folders") }}
        </div>
      </div>
      <div class="card-base p-5 text-center">
        <div class="text-3xl mb-2">✏️</div>
        <div class="text-2xl font-bold text-deep-text">0</div>
        <div class="text-xs text-text-muted mt-1">
          {{ t("starhope.dashboard.stats.practiceRecords") }}
        </div>
      </div>
      <div class="card-base p-5 text-center">
        <div class="text-3xl mb-2">📝</div>
        <div class="text-2xl font-bold text-deep-text">0</div>
        <div class="text-xs text-text-muted mt-1">
          {{ t("starhope.dashboard.stats.examRecords") }}
        </div>
      </div>
    </div>
    <h2 class="text-lg font-semibold text-deep-text mb-4">
      {{ t("starhope.dashboard.shortcutsTitle") }}
    </h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div
        v-for="item in shortcuts"
        :key="item.route"
        class="card-base p-4 cursor-pointer hover:border-primary/30 transition-colors"
        role="button"
        tabindex="0"
        @click="navigate(item.route)"
        @keydown.enter="navigate(item.route)"
        @keydown.space.prevent="navigate(item.route)"
      >
        <div class="text-2xl mb-2">{{ item.icon }}</div>
        <div class="text-sm font-semibold text-deep-text">
          {{ t(item.labelKey) }}
        </div>
        <div class="text-xs text-text-muted mt-1">{{ t(item.descKey) }}</div>
      </div>
    </div>
  </div>
</template>
