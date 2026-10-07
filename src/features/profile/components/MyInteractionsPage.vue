<template>
  <div class="space-y-6">
    <nav class="flex flex-wrap gap-2" aria-label="我的内容分类">
      <a
        v-for="item in tabs"
        :key="item.key"
        :href="item.href"
        class="rounded-full px-4 py-2 text-sm font-medium"
        :class="
          item.key === kind
            ? 'bg-primary text-on-primary'
            : 'bg-surface-2 text-deep-text hover:bg-surface-3'
        "
      >
        {{ item.title }}
      </a>
    </nav>

    <p v-if="!ready" class="py-8 text-center text-text-muted">
      {{ t("common.loading") }}
    </p>
    <p v-else-if="!auth.isLoggedIn" class="py-8 text-center text-text-muted">
      {{ t("myContent.loginRequired") }}
    </p>
    <p v-else-if="loadError" class="py-8 text-center text-text-muted">
      {{ t("common.loadError") }}
    </p>
    <p v-else-if="items.length === 0" class="py-8 text-center text-text-muted">
      {{
        t(
          kind === "favorites"
            ? "myContent.noFavorites"
            : "myContent.noHistory",
        )
      }}
    </p>

    <ul v-else class="space-y-3">
      <li v-for="item in items" :key="item.content_id">
        <a
          :href="getPermalink(`/forum/post/${item.content_id}`)"
          class="block rounded-xl border border-surface-3 bg-card-bg p-4 hover:border-primary/40 transition-colors"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
            >
              {{ t(typeLabelKey(item.content_type)) }}
            </span>
            <span class="text-xs text-text-muted/60">
              {{ formatTime(item) }}
            </span>
          </div>
          <p class="mt-2 font-medium text-deep-text line-clamp-2">
            {{ item.title }}
          </p>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// 「我的收藏」与「浏览历史」共用一份实现：两者只有取数端点、时间字段与文案不同，
// 各写一个页面等于把列表渲染/空态/登录门槛抄两遍。
import { computed, onMounted, ref } from "vue";
import { t } from "~/lib/i18n";
import {
  interactionApi,
  type FavoriteItem,
  type HistoryItem,
} from "~/lib/api/modules/interaction";
import { useAuthStore } from "~/stores/auth";
import { getPermalink } from "~/lib/utils/permalinks";

const props = defineProps<{ kind: "favorites" | "history" }>();

const auth = useAuthStore();
const ready = ref(false);
const loadError = ref(false);
const items = ref<(FavoriteItem | HistoryItem)[]>([]);

const tabs = computed(() => [
  { key: "all", title: t("myContent.tabAll"), href: getPermalink("/my") },
  {
    key: "questions",
    title: t("myContent.tabQuestions"),
    href: getPermalink("/my/questions"),
  },
  {
    key: "posts",
    title: t("myContent.tabPosts"),
    href: getPermalink("/my/posts"),
  },
  {
    key: "projects",
    title: t("myContent.tabProjects"),
    href: getPermalink("/my/projects"),
  },
  {
    key: "favorites",
    title: t("myContent.tabFavorites"),
    href: getPermalink("/my/favorites"),
  },
  {
    key: "history",
    title: t("myContent.tabHistory"),
    href: getPermalink("/my/history"),
  },
]);

const TYPE_LABEL_KEYS: Record<string, string> = {
  discussion: "community.forum.typeDiscussion",
  article: "community.forum.typeArticle",
  column_post: "community.forum.typeColumnPost",
  blog_post: "community.forum.typeBlogPost",
  qa: "community.forum.typeQuestion",
};

/** 后端枚举属外部输入：未知体裁回退成讨论帖文案，不把原始字符串直接渲染出去 */
function typeLabelKey(contentType: string): string {
  return TYPE_LABEL_KEYS[contentType] ?? "community.forum.typeDiscussion";
}

function formatTime(item: FavoriteItem | HistoryItem): string {
  const iso = "viewed_at" in item ? item.viewed_at : item.created_at;
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

onMounted(async () => {
  auth.restoreFromStorage();
  ready.value = true;
  if (!auth.isLoggedIn) return;
  const res =
    props.kind === "favorites"
      ? await interactionApi.myFavorites()
      : await interactionApi.myHistory();
  if (res.isErr()) {
    loadError.value = true;
    return;
  }
  items.value = res.value.items;
});
</script>
