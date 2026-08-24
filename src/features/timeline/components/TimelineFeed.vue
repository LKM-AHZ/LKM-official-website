<script setup lang="ts">
// TimelineFeed.vue — 时间线(read-time 合流 feed)：follow|hot 切换 + 加载更多。
// 游标分页 → usePagination cursorLoader；登录门控 follow，未登录自动降级 hot。
import { ref, computed } from "vue";
import { timelineApi } from "~/lib/api";
import type { FeedItem, TimelineMode } from "~/lib/api/modules/timeline";
import { usePagination } from "~/lib/http/usePagination";
import { useAuthStore } from "~/stores/auth";
import { t } from "~/lib/i18n";

const auth = useAuthStore();
const isLoggedIn = computed(() => auth.isLoggedIn);
const mode = ref<TimelineMode>("follow");

const { items, loading, error, loadMore } = usePagination<FeedItem>({
  cursorLoader: async (cursor, limit) => {
    const effective: TimelineMode =
      mode.value === "follow" && isLoggedIn.value ? "follow" : "hot";
    return timelineApi.getFeed(effective, cursor, limit);
  },
  clearOnRefresh: true,
  immediate: false,
});

const entries = items;

async function loadFirst(): Promise<void> {
  // 清空并重置游标后拉第一页
  entries.value = [];
  await loadMore();
}

async function switchMode(m: TimelineMode): Promise<void> {
  if (mode.value === m) return;
  mode.value = m;
  await loadFirst();
}

async function refresh(): Promise<void> {
  await loadFirst();
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-deep-text">
        {{ t("timeline.title") }}
      </h1>
      <button
        type="button"
        class="text-sm text-text-muted hover:text-primary"
        @click="refresh"
      >
        {{ t("timeline.refresh") }}
      </button>
    </div>

    <!-- 模式切换 -->
    <div class="flex gap-1 mb-4">
      <button
        type="button"
        class="px-3 py-1.5 rounded-lg text-sm transition-colors"
        :class="
          mode === 'follow'
            ? 'bg-primary text-on-primary'
            : 'bg-surface-3 text-text-muted hover:bg-surface-3/70'
        "
        :disabled="!isLoggedIn"
        title="登录后可查看关注流"
        @click="switchMode('follow')"
      >
        {{ t("timeline.follow") }}
      </button>
      <button
        type="button"
        class="px-3 py-1.5 rounded-lg text-sm transition-colors"
        :class="
          mode === 'hot'
            ? 'bg-primary text-on-primary'
            : 'bg-surface-3 text-text-muted hover:bg-surface-3/70'
        "
        @click="switchMode('hot')"
      >
        {{ t("timeline.hot") }}
      </button>
    </div>

    <div
      v-if="loading && entries.length === 0"
      class="text-sm text-text-muted py-8 text-center"
    >
      {{ t("common.loading") }}
    </div>
    <div
      v-else-if="error && entries.length === 0"
      class="text-sm text-red-500 py-8 text-center"
    >
      {{ error }}
    </div>
    <div
      v-else-if="entries.length === 0"
      class="text-sm text-text-muted py-8 text-center"
    >
      {{ t("timeline.empty") }}
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="item in entries"
        :key="`${item.item_type}-${item.id}`"
        class="p-4 rounded-xl bg-card-bg border border-surface-3 hover:border-primary/30 transition-colors"
      >
        <a class="block" :href="item.url" target="_blank" rel="noopener">
          <div class="flex items-center gap-2 text-xs text-text-muted mb-1">
            <span class="px-1.5 py-0.5 rounded bg-surface-3 text-text-muted">
              {{ t(`timeline.type.${item.item_type}`) }}
            </span>
            <span class="truncate">{{ item.author_name }}</span>
            <span class="shrink-0">{{ item.created_at.slice(0, 10) }}</span>
          </div>
          <h3 class="text-base font-semibold text-deep-text line-clamp-2">
            {{ item.title }}
          </h3>
          <p
            v-if="item.content_preview"
            class="text-sm text-text-muted mt-1 line-clamp-2"
          >
            {{ item.content_preview }}
          </p>
        </a>
      </li>
    </ul>

    <div class="mt-6 text-center">
      <button
        v-if="entries.length > 0"
        type="button"
        class="px-4 py-2 rounded-lg text-sm bg-surface-3 text-deep-text hover:bg-surface-3/70 disabled:opacity-40"
        :disabled="loading"
        @click="loadMore"
      >
        {{ loading ? t("common.loading") : t("timeline.loadMore") }}
      </button>
    </div>
  </div>
</template>
