<script setup lang="ts">
import { ref, watchEffect, onMounted } from "vue";
import { t } from "~/lib/i18n";
import { Icon } from "@iconify/vue";
import { url } from "~/lib/utils/url-utils";

interface SearchResult {
  url: string;
  meta: { title: string };
  excerpt: string;
}

const keywordDesktop = ref("");
const keywordMobile = ref("");
const result = ref<SearchResult[]>([]);
const isSearching = ref(false);
const pagefindLoaded = ref(false);
const initialized = ref(false);

const fakeResult: SearchResult[] = [
  {
    url: url("/"),
    meta: { title: "This Is a Fake Search Result" },
    excerpt:
      "Because the search cannot work in the <mark>dev</mark> environment.",
  },
  {
    url: url("/"),
    meta: { title: "If You Want to Test the Search" },
    excerpt: "Try running <mark>npm build && npm preview</mark> instead.",
  },
];

const sanitizeHtmlExcerpt = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/<link[\s\S]*?>/gi, "")
    .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "");
};

const togglePanel = () => {
  const panel = document.getElementById("search-panel");
  panel?.classList.toggle("float-panel-closed");
};

// autoManaged = 由本次搜索自动推导面板开合。只有桌面端成立：桌面输入框在面板外，
// 可以按结果有无开合面板；移动端输入框就在面板内部，自动收起会把用户正在输入的表单一起关掉，
// 因此移动端面板开合一律交给用户（搜索按钮/点击外部），这里直接返回。
const setPanelVisibility = (show: boolean, autoManaged: boolean): void => {
  const panel = document.getElementById("search-panel");
  if (!panel || !autoManaged) return;
  if (show) {
    panel.classList.remove("float-panel-closed");
  } else {
    panel.classList.add("float-panel-closed");
  }
};

const search = async (keyword: string, autoManaged: boolean): Promise<void> => {
  if (!keyword) {
    setPanelVisibility(false, autoManaged);
    result.value = [];
    return;
  }

  if (!initialized.value) return;

  isSearching.value = true;

  try {
    let searchResults: SearchResult[] = [];

    if (import.meta.env.PROD && pagefindLoaded.value && window.pagefind) {
      const response = await window.pagefind.search(keyword);
      // item.data() 的形状由 env.d.ts 的 Window.pagefind 声明，无需再断言
      searchResults = await Promise.all(
        response.results.map((item) => item.data()),
      );
    } else if (import.meta.env.DEV) {
      searchResults = fakeResult;
    } else {
      searchResults = [];
      console.error("Pagefind is not available in production environment.");
    }

    result.value = searchResults;
    setPanelVisibility(result.value.length > 0, autoManaged);
  } catch (error) {
    console.error("Search error:", error);
    result.value = [];
    setPanelVisibility(false, autoManaged);
  } finally {
    isSearching.value = false;
  }
};

function initPagefind() {
  // 不能用 initialized 早退：pagefind 脚本可能晚于 2s 兜底定时器才就绪，
  // 一旦提前置位、后面的 pagefindready 被早退挡掉，pagefindLoaded 就永远是 false，
  // 之后每次输入都走空分支并刷 console.error（搜索永久失效且无用户可见反馈）。
  // 本函数会被 pagefindready/pagefindloaderror/兜底定时器多次调用，只重算这两个状态即可
  initialized.value = true;
  pagefindLoaded.value = typeof window.pagefind?.search === "function";
}

onMounted(() => {
  if (import.meta.env.DEV) {
    initPagefind();
  } else {
    document.addEventListener("pagefindready", initPagefind);
    document.addEventListener("pagefindloaderror", initPagefind);
    setTimeout(() => {
      if (!initialized.value) initPagefind();
    }, 2000);
  }
});

let desktopTimer: ReturnType<typeof setTimeout>;
let mobileTimer: ReturnType<typeof setTimeout>;

watchEffect(() => {
  const kw = keywordDesktop.value;
  if (!initialized.value) return;
  clearTimeout(desktopTimer);
  desktopTimer = setTimeout(() => search(kw, true), 300);
});

watchEffect(() => {
  const kw = keywordMobile.value;
  if (!initialized.value) return;
  clearTimeout(mobileTimer);
  mobileTimer = setTimeout(() => search(kw, false), 300);
});
</script>

<template>
  <!-- search bar for desktop view -->
  <div
    id="search-bar"
    class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06] dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10"
  >
    <Icon
      icon="material-symbols:search"
      class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"
    />
    <input
      :placeholder="t('search.placeholder')"
      v-model="keywordDesktop"
      @focus="
        () => {
          search(keywordDesktop, true);
          document
            .getElementById('navbar')
            ?.setAttribute('data-search-expanded', '');
        }
      "
      @blur="
        () => {
          document
            .getElementById('navbar')
            ?.removeAttribute('data-search-expanded');
        }
      "
      class="transition-all pl-10 text-sm bg-transparent outline-0 h-full w-40 focus:w-80 text-black/50 dark:text-white/50"
    />
  </div>

  <!-- toggle btn for phone/tablet view -->
  <button
    @click="togglePanel"
    aria-label="Search Panel"
    id="search-switch"
    class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90"
  >
    <Icon icon="material-symbols:search" class="text-[1.25rem]" />
  </button>

  <!-- search panel -->
  <div
    id="search-panel"
    class="float-panel float-panel-closed search-panel absolute md:w-[30rem] top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2"
  >
    <!-- search bar inside panel for phone/tablet -->
    <div
      id="search-bar-inside"
      class="flex relative lg:hidden transition-all items-center h-11 rounded-xl bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06] dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10"
    >
      <Icon
        icon="material-symbols:search"
        class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"
      />
      <input
        :placeholder="t('search.placeholder')"
        v-model="keywordMobile"
        class="pl-10 absolute inset-0 text-sm bg-transparent outline-0 focus:w-60 text-black/50 dark:text-white/50"
      />
    </div>

    <!-- search results -->
    <a
      v-for="item in result"
      :key="item.url"
      :href="item.url"
      class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]"
    >
      <div
        class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]"
      >
        {{ item.meta.title }}
        <Icon
          icon="fa6-solid:chevron-right"
          class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"
        />
      </div>
      <div
        class="transition text-sm text-50"
        v-html="sanitizeHtmlExcerpt(item.excerpt)"
      />
    </a>
  </div>
</template>

<style scoped>
input:focus {
  outline: 0;
}
.search-panel {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
</style>
