<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { t } from "~/lib/i18n";
import { fetchWithCache } from "~/lib/cache-client";
import { NEWS_CATEGORY_SLUGS } from "~/lib/api/modules/official-articles";

/**
 * 首页「最新新闻」卡片。
 * 服务端（index.astro 首页）已按三大新闻分类（官方公告/科技新闻/科普相关）过滤，
 * 客户端兜底 fetch 时也按同一分类过滤，保证行为一致。
 */
interface ServerArticle {
  slug: string;
  title: string;
  description: string | null;
  cover: string | null;
  publishedText: string;
}

const props = defineProps<{
  /** 服务端 SSR 传入的数据；不传则退回浏览器 fetch */
  articles?: ServerArticle[];
}>();

const fetchedArticles = ref<ServerArticle[]>([]);
// 服务端已传入数据时不应先进 loading：否则首帧渲染占位、onMounted 才切到正文，白白丢掉 SSR 内容并闪一下
const loading = ref(!props.articles);
// fetchWithCache 从不 reject（失败以 error 字段返回、data 为 null），只靠 finally 收尾会把
// 失败吞成「一片空白」，与「确实没有新闻」无法区分
const errorMessage = ref("");

// 受控：有 props 直接渲染；无 props 走本地 fetch
const articles = computed<ServerArticle[]>(
  () => props.articles ?? fetchedArticles.value,
);

// baseUrl 与封面默认路径同源：只写一次，避免 BASE_URL 表达式在文件里重复漂移
const baseUrl = import.meta.env.BASE_URL || "/";
const DEFAULT_COVER = `${baseUrl}images/article-default.png`;
const CACHE_KEY = "articles:latest";
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

onMounted(async () => {
  // 受控模式（已有服务端数据）无需再 fetch
  if (props.articles) {
    loading.value = false;
    return;
  }
  try {
    // 响应条目含 published 原始日期字段（与 ServerArticle 渲染形状不同）
    const { data, error } = await fetchWithCache<{
      items: Array<
        Omit<ServerArticle, "publishedText"> & {
          published: string;
          category: string;
        }
      >;
      total: number;
    }>("/api/v1/articles?page=1&page_size=30", CACHE_KEY, CACHE_TTL);
    if (data?.items) {
      fetchedArticles.value = data.items
        .filter((a) => NEWS_CATEGORY_SLUGS.includes(a.category))
        .slice(0, 6)
        .map((a) => ({
          slug: a.slug,
          title: a.title,
          description: a.description ?? null,
          cover: a.cover ?? null,
          publishedText: new Date(a.published).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        }));
    } else if (error) {
      errorMessage.value = error;
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div v-if="loading" class="text-center py-4 text-text-muted">
    <!-- 插槽兜底：消费方 BlogLatestPosts.astro 传了自定义 loading 文案，原先模板没有 slot
         会被静默丢弃（不传时才用 common.loading） -->
    <slot>{{ t("common.loading") }}</slot>
  </div>
  <div v-else-if="errorMessage" class="text-center py-4 text-text-muted">
    {{ errorMessage }}
  </div>
  <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <a
      v-for="article in articles"
      :key="article.slug"
      :href="`${baseUrl}articles/${encodeURIComponent(article.slug)}`"
      class="profile-card group flex flex-col"
    >
      <div class="profile-inner h-full flex flex-col">
        <img
          :src="article.cover || DEFAULT_COVER"
          :alt="article.title"
          class="w-full h-20 object-cover"
        />
        <div class="flex flex-col flex-1 p-5">
          <h3
            class="font-semibold text-deep-text mb-2 line-clamp-2 group-hover:text-primary transition-colors"
          >
            {{ article.title }}
          </h3>
          <p
            v-if="article.description"
            class="text-sm text-text-muted line-clamp-2"
          >
            {{ article.description }}
          </p>
          <span class="text-xs text-text-muted mt-auto pt-4 block">{{
            article.publishedText
          }}</span>
        </div>
      </div>
    </a>
  </div>
</template>
