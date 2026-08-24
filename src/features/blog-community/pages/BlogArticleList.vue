<script setup lang="ts">
import { computed } from "vue";
import { blogApi } from "~/lib/api";
import type { BlogArticleInfo } from "../types/blog";
import { usePagination } from "~/lib/http/usePagination";
import type { PaginatedResponse } from "~/lib/api/types";
import { t } from "~/lib/i18n";

// blogApi.listArticles 返回 blog 的 PaginatedData（total_pages），统一重塑为
// usePagination 期望的 PaginatedResponse（pages）后无感接入。
const {
  items: articles,
  page,
  totalPages,
  total,
  loading,
  error,
  goPage,
} = usePagination<BlogArticleInfo>({
  loader: async (p) => {
    const result = await blogApi.listArticles(p);
    return result.map(
      (d) =>
        ({
          items: d.items,
          total: d.total,
          page: d.page,
          pages: d.total_pages,
        }) as PaginatedResponse<BlogArticleInfo>,
    );
  },
});

const hasPrev = computed(() => page.value > 1);
const hasNext = computed(
  () => page.value < totalPages.value && totalPages.value > 0,
);
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">{{ t("blog.title") }}</h1>
    <p v-if="total" class="text-gray-500 mb-6">
      {{ t("blog.articleCount", { count: total }) }}
    </p>
    <div v-if="loading" class="text-center py-12 text-gray-500">
      {{ t("common.loading") }}
    </div>
    <div v-else-if="error" class="text-red-500 py-12 text-center">
      {{ error }}
    </div>
    <div
      v-else-if="articles.length === 0"
      class="text-center py-12 text-gray-500"
    >
      {{ t("blog.noArticles") }}
    </div>
    <div v-else class="grid gap-6">
      <article
        v-for="article in articles"
        :key="article.slug"
        class="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        @click="$router.push(`/blog/posts/${article.slug}`)"
      >
        <img
          v-if="article.cover_url"
          :src="article.cover_url"
          :alt="article.title"
          class="w-full h-48 object-cover rounded mb-4"
        />
        <h2 class="text-xl font-semibold mb-2">{{ article.title }}</h2>
        <p v-if="article.description" class="text-gray-600 mb-3">
          {{ article.description }}
        </p>
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <span>{{
            new Date(article.published).toLocaleDateString("zh-CN")
          }}</span>
          <span
            v-if="article.category"
            class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
            >{{ article.category }}</span
          >
          <span>{{ t("blog.wordsValue", { count: article.word_count }) }}</span>
          <span>{{
            t("blog.minutesValue", { count: article.reading_time })
          }}</span>
        </div>
      </article>
    </div>
    <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-8">
      <button
        :disabled="!hasPrev"
        @click="goPage(page - 1)"
        class="px-4 py-2 border rounded disabled:opacity-30"
      >
        {{ t("blog.prevPage") }}
      </button>
      <span v-for="p in totalPages" :key="p">
        <button
          @click="goPage(p)"
          :class="p === page ? 'bg-blue-600 text-white' : 'border'"
          class="px-3 py-2 rounded"
        >
          {{ p }}
        </button>
      </span>
      <button
        :disabled="!hasNext"
        @click="goPage(page + 1)"
        class="px-4 py-2 border rounded disabled:opacity-30"
      >
        {{ t("blog.nextPage") }}
      </button>
    </div>
  </div>
</template>
