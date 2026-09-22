<template>
  <div class="space-y-6">
    <div class="text-center">
      <h3 class="text-xl font-semibold text-deep-text">
        {{ t("onboarding.follow.title") }}
      </h3>
      <p class="text-sm text-text-muted mt-1">
        {{
          t("onboarding.follow.hint", {
            min: REQUIRED_SELECTIONS,
            selected: selectedIds.length,
          })
        }}
      </p>
    </div>

    <!-- Tab 切换 -->
    <div class="flex justify-center gap-2">
      <button
        type="button"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
        :class="
          activeTab === 'category'
            ? 'bg-primary text-on-primary'
            : 'bg-surface-3 text-text-muted hover:bg-surface-3/70'
        "
        @click="activeTab = 'category'"
      >
        {{ t("onboarding.follow.categoriesTab") }}
      </button>
      <button
        type="button"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
        :class="
          activeTab === 'author'
            ? 'bg-primary text-on-primary'
            : 'bg-surface-3 text-text-muted hover:bg-surface-3/70'
        "
        @click="activeTab = 'author'"
      >
        {{ t("onboarding.follow.authorsTab") }}
      </button>
    </div>

    <!-- 板块列表 -->
    <div
      v-if="activeTab === 'category'"
      class="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <button
        v-for="item in recommendCategories"
        :key="item.id"
        type="button"
        class="flex items-start gap-3 p-3 rounded-lg border text-left transition-colors"
        :class="
          selectedSet.has(item.id)
            ? 'border-primary bg-primary/5'
            : 'border-surface-3 bg-card-bg hover:border-primary/30'
        "
        :aria-pressed="selectedSet.has(item.id)"
        @click="toggle(item.id)"
      >
        <Icon
          :icon="item.icon"
          class="w-8 h-8 shrink-0 mt-0.5"
          :class="selectedSet.has(item.id) ? 'text-primary' : 'text-text-muted'"
        />
        <div class="flex-1 min-w-0">
          <div
            class="font-medium text-sm text-deep-text flex items-center gap-2"
          >
            {{ t(item.name) }}
            <span v-if="selectedSet.has(item.id)" class="text-primary text-xs"
              >✓</span
            >
          </div>
          <div class="text-xs text-text-muted mt-0.5 line-clamp-1">
            {{ t(item.description) }}
          </div>
          <div class="text-xs text-text-muted/60 mt-1">
            {{ item.memberCount }} {{ t("onboarding.follow.members") }}
          </div>
        </div>
      </button>
    </div>

    <!-- 作者列表 -->
    <div
      v-if="activeTab === 'author'"
      class="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <button
        v-for="item in recommendAuthors"
        :key="item.id"
        type="button"
        class="flex items-start gap-3 p-3 rounded-lg border text-left transition-colors"
        :class="
          selectedSet.has(item.id)
            ? 'border-primary bg-primary/5'
            : 'border-surface-3 bg-card-bg hover:border-primary/30'
        "
        :aria-pressed="selectedSet.has(item.id)"
        @click="toggle(item.id)"
      >
        <div
          class="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm"
        >
          {{ t(item.name).charAt(0) || "?" }}
        </div>
        <div class="flex-1 min-w-0">
          <div
            class="font-medium text-sm text-deep-text flex items-center gap-2"
          >
            {{ t(item.name) }}
            <span v-if="selectedSet.has(item.id)" class="text-primary text-xs"
              >✓</span
            >
          </div>
          <div class="text-xs text-text-muted mt-0.5 line-clamp-1">
            {{ t(item.description) }}
          </div>
          <div class="text-xs text-text-muted/60 mt-1">
            {{ item.memberCount }} {{ t("onboarding.follow.followers") }}
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";

interface RecommendItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
}

const recommendCategories: RecommendItem[] = [
  {
    id: "basic-science",
    name: "onboarding.followData.basicScience.name",
    description: "onboarding.followData.basicScience.description",
    icon: "tabler:atom-2",
    memberCount: 1200,
  },
  {
    id: "applied-science",
    name: "onboarding.followData.appliedScience.name",
    description: "onboarding.followData.appliedScience.description",
    icon: "tabler:robot",
    memberCount: 890,
  },
  {
    id: "language",
    name: "onboarding.followData.language.name",
    description: "onboarding.followData.language.description",
    icon: "tabler:language",
    memberCount: 340,
  },
  {
    id: "hobby-chess",
    name: "onboarding.followData.hobbyChess.name",
    description: "onboarding.followData.hobbyChess.description",
    icon: "tabler:chess",
    memberCount: 280,
  },
  {
    id: "hobby-game",
    name: "onboarding.followData.hobbyGame.name",
    description: "onboarding.followData.hobbyGame.description",
    icon: "tabler:device-gamepad-2",
    memberCount: 420,
  },
  {
    id: "hobby-sci-fi",
    name: "onboarding.followData.hobbySciFi.name",
    description: "onboarding.followData.hobbySciFi.description",
    icon: "tabler:rocket",
    memberCount: 190,
  },
  {
    id: "hobby-music",
    name: "onboarding.followData.hobbyMusic.name",
    description: "onboarding.followData.hobbyMusic.description",
    icon: "tabler:music",
    memberCount: 310,
  },
  {
    id: "hobby-cooking",
    name: "onboarding.followData.hobbyCooking.name",
    description: "onboarding.followData.hobbyCooking.description",
    icon: "tabler:chef-hat",
    memberCount: 160,
  },
  {
    id: "math",
    name: "onboarding.followData.math.name",
    description: "onboarding.followData.math.description",
    icon: "tabler:math-symbols",
    memberCount: 520,
  },
  {
    id: "physics",
    name: "onboarding.followData.physics.name",
    description: "onboarding.followData.physics.description",
    icon: "tabler:telescope",
    memberCount: 480,
  },
];

const recommendAuthors: RecommendItem[] = [
  {
    id: "author-1",
    name: "onboarding.followData.authorJulyO.name",
    description: "onboarding.followData.authorJulyO.description",
    icon: "tabler:user",
    memberCount: 350,
  },
  {
    id: "author-2",
    name: "onboarding.followData.authorJulyHua.name",
    description: "onboarding.followData.authorJulyHua.description",
    icon: "tabler:user",
    memberCount: 420,
  },
  {
    id: "author-3",
    name: "onboarding.followData.authorJulyMoran.name",
    description: "onboarding.followData.authorJulyMoran.description",
    icon: "tabler:user",
    memberCount: 280,
  },
  {
    id: "author-4",
    name: "onboarding.followData.authorJulyYuli.name",
    description: "onboarding.followData.authorJulyYuli.description",
    icon: "tabler:user",
    memberCount: 200,
  },
  {
    id: "author-5",
    name: "onboarding.followData.authorJulyYouzhi.name",
    description: "onboarding.followData.authorJulyYouzhi.description",
    icon: "tabler:user",
    memberCount: 150,
  },
];

// 最少关注数：模板提示文案与 isComplete 门禁必须同源，避免改一处造成文案/门禁不一致
const REQUIRED_SELECTIONS = 3;

const activeTab = ref<"category" | "author">("category");
const selectedIds = ref<string[]>([]);

// Set 化查表：模板里每个条目要比对 3~5 次，数组 includes 是 O(items×selected)，
// 换成 Set 后每次 O(1)（列表将来接后端数据后差距会放大）
const selectedSet = computed(() => new Set(selectedIds.value));

function toggle(id: string) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
}

defineExpose({
  isComplete: () => selectedIds.value.length >= REQUIRED_SELECTIONS,
  getData: () => [...selectedIds.value],
});
</script>
