<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";
import { buildUrl } from "~/lib/utils/paths";

interface SearchResultItem {
  type: "post" | "file" | "user";
  title: string;
  desc: string;
  descParams?: Record<string, string | number>;
  url: string;
  tag?: string;
}

const mockData: SearchResultItem[] = [
  {
    type: "post",
    title: "search.mockQuantumTitle",
    desc: "search.postMeta",
    descParams: { author: t("search.userQiyueOName"), likes: 12, comments: 34 },
    url: buildUrl("/forum/post/post-1"),
    tag: "onboarding.tags.physics",
  },
  {
    type: "post",
    title: "search.mockMathTitle",
    desc: "search.postMeta",
    descParams: {
      author: t("search.userQiyueHuaName"),
      likes: 28,
      comments: 56,
    },
    url: buildUrl("/forum/post/post-3"),
    tag: "onboarding.tags.math",
  },
  {
    type: "post",
    title: "search.mockPythonTitle",
    desc: "search.postMeta",
    descParams: {
      author: t("search.userQiyueMoranName"),
      likes: 45,
      comments: 23,
    },
    url: buildUrl("/forum/post/post-5"),
    tag: "onboarding.tags.cs",
  },
  {
    type: "file",
    title: "search.mockAstroFileTitle",
    desc: "search.fileMeta",
    descParams: {
      author: t("search.userQiyueOName"),
      size: "128",
      downloads: 230,
    },
    url: buildUrl("/files/file-1"),
    tag: "search.tagFile",
  },
  {
    type: "file",
    title: "search.mockLinearFileTitle",
    desc: "search.fileMeta",
    descParams: {
      author: t("search.userQiyueMoranName"),
      size: "5.2",
      downloads: 89,
    },
    url: buildUrl("/files/file-3"),
    tag: "search.tagFile",
  },
  {
    type: "user",
    title: "search.userQiyueOName",
    desc: "search.userQiyueODesc",
    url: buildUrl("/user/qiyue-o"),
    tag: "search.tagUser",
  },
  {
    type: "user",
    title: "search.userQiyueHuaName",
    desc: "search.userQiyueHuaDesc",
    url: buildUrl("/user/qiyue-hua"),
    tag: "search.tagUser",
  },
  {
    type: "user",
    title: "search.userQiyueMoranName",
    desc: "search.userQiyueMoranDesc",
    url: buildUrl("/user/qiyue-moran"),
    tag: "search.tagUser",
  },
];

const keyword = ref("");
const isOpen = ref(false);
const results = ref({
  posts: [] as SearchResultItem[],
  files: [] as SearchResultItem[],
  users: [] as SearchResultItem[],
});

const totalCount = computed(
  () =>
    results.value.posts.length +
    results.value.files.length +
    results.value.users.length,
);

function toggle() {
  // 关闭一律走 close()：否则再次打开时还留着上次的关键词与结果，
  // 与 ESC / 点击外部（都走 close）的行为不一致
  if (isOpen.value) {
    close();
    return;
  }
  isOpen.value = true;
  nextTick(() => {
    const input = document.getElementById("global-search-input");
    input?.focus();
  });
}

function close() {
  isOpen.value = false;
  keyword.value = "";
  results.value = { posts: [], files: [], users: [] };
}

let searchTimer: ReturnType<typeof setTimeout>;

function doSearch(kw: string) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (!kw.trim()) {
      results.value = { posts: [], files: [], users: [] };
      return;
    }
    const lower = kw.toLowerCase();
    const filtered = mockData.filter(
      (item) =>
        t(item.title).toLowerCase().includes(lower) ||
        t(item.desc, item.descParams).toLowerCase().includes(lower),
    );
    results.value = {
      posts: filtered.filter((r) => r.type === "post"),
      files: filtered.filter((r) => r.type === "file"),
      users: filtered.filter((r) => r.type === "user"),
    };
  }, 200);
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const panel = document.getElementById("global-search-panel");
  const btn = document.getElementById("global-search-btn");
  const mobileBtn = document.getElementById("global-search-mobile-btn");
  // 移动端触发按钮同样要白名单：Vue 的异步 flush 会在按钮自身的 click 监听器与
  // 本 document 监听器之间把面板插入文档，不排除就会被这里立刻 close()，面板永远打不开。
  if (
    panel &&
    !panel.contains(target) &&
    btn &&
    !btn.contains(target) &&
    mobileBtn &&
    !mobileBtn.contains(target)
  ) {
    close();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    close();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <!-- 桌面端搜索框 -->
  <div
    id="global-search-btn"
    class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06] dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10 cursor-pointer"
    @click="toggle"
    @keydown.enter="toggle"
    role="button"
    tabindex="0"
  >
    <Icon
      icon="material-symbols:search"
      class="text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"
    />
    <span
      class="text-sm text-black/30 dark:text-white/30 px-3 w-40 select-none"
      >{{ t("common.search") }}</span
    >
  </div>

  <!-- 移动端搜索按钮 -->
  <button
    :aria-label="t('common.search')"
    class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90"
    id="global-search-mobile-btn"
    @click="toggle"
  >
    <Icon icon="material-symbols:search" class="text-[1.25rem]" />
  </button>

  <!-- 搜索面板 -->
  <div
    v-if="isOpen"
    class="fixed inset-0 top-[72px] z-[100] flex items-start justify-center"
    @click="close"
  >
    <div
      id="global-search-panel"
      class="w-full max-w-xl max-h-[80vh] overflow-y-auto bg-white dark:bg-[oklch(0.23_0.015_var(--hue))] rounded-2xl shadow-2xl p-3 mx-4"
      @click.stop
    >
      <div class="flex items-center gap-3 px-2 pb-3 border-b border-surface-3">
        <Icon
          icon="material-symbols:search"
          class="w-5 h-5 text-text-muted shrink-0"
        />
        <input
          id="global-search-input"
          type="text"
          v-model="keyword"
          @input="doSearch(keyword)"
          :placeholder="t('search.placeholderExtended')"
          class="flex-1 bg-transparent text-sm text-deep-text outline-none placeholder:text-text-muted/50"
        />
        <button
          class="text-xs text-text-muted hover:text-deep-text px-2"
          @click="close"
        >
          ESC
        </button>
      </div>

      <div
        v-if="keyword.trim() === ''"
        class="px-3 py-8 text-center text-sm text-text-muted"
      >
        {{ t("search.inputHint") }}
      </div>
      <div
        v-else-if="totalCount === 0"
        class="px-3 py-8 text-center text-sm text-text-muted"
      >
        {{ t("search.noResultsPrefix") }} "<span class="text-deep-text">{{
          keyword
        }}</span
        >" {{ t("search.noResultsSuffix") }}
      </div>
      <div v-else class="space-y-4 pt-2">
        <div v-if="results.posts.length > 0">
          <div
            class="text-xs text-text-muted/60 font-medium px-2 mb-1 uppercase"
          >
            {{ t("search.posts") }}
          </div>
          <a
            v-for="item in results.posts"
            :key="item.url"
            :href="item.url"
            @click="close"
            class="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-page-bg transition-colors group"
          >
            <Icon
              icon="material-symbols:article-outline"
              class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
            />
            <div class="flex-1 min-w-0">
              <div
                class="text-sm font-medium text-deep-text group-hover:text-primary truncate"
              >
                {{ t(item.title) }}
              </div>
              <div class="text-xs text-text-muted mt-0.5">
                {{ t(item.desc, item.descParams) }}
              </div>
            </div>
            <span class="text-xs text-text-muted/50 shrink-0">{{
              t(item.tag)
            }}</span>
          </a>
        </div>

        <div v-if="results.files.length > 0">
          <div
            class="text-xs text-text-muted/60 font-medium px-2 mb-1 uppercase"
          >
            {{ t("search.files") }}
          </div>
          <a
            v-for="item in results.files"
            :key="item.url"
            :href="item.url"
            @click="close"
            class="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-page-bg transition-colors group"
          >
            <Icon
              icon="material-symbols:folder-outline"
              class="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
            />
            <div class="flex-1 min-w-0">
              <div
                class="text-sm font-medium text-deep-text group-hover:text-primary truncate"
              >
                {{ t(item.title) }}
              </div>
              <div class="text-xs text-text-muted mt-0.5">
                {{ t(item.desc, item.descParams) }}
              </div>
            </div>
            <span class="text-xs text-text-muted/50 shrink-0">{{
              t(item.tag)
            }}</span>
          </a>
        </div>

        <div v-if="results.users.length > 0">
          <div
            class="text-xs text-text-muted/60 font-medium px-2 mb-1 uppercase"
          >
            {{ t("search.users") }}
          </div>
          <a
            v-for="item in results.users"
            :key="item.url"
            :href="item.url"
            @click="close"
            class="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-page-bg transition-colors group"
          >
            <Icon
              icon="material-symbols:person-outline"
              class="w-5 h-5 text-green-500 shrink-0 mt-0.5"
            />
            <div class="flex-1 min-w-0">
              <div
                class="text-sm font-medium text-deep-text group-hover:text-primary truncate"
              >
                {{ t(item.title) }}
              </div>
              <div class="text-xs text-text-muted mt-0.5">
                {{ t(item.desc, item.descParams) }}
              </div>
            </div>
            <span class="text-xs text-text-muted/50 shrink-0">{{
              t(item.tag)
            }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
