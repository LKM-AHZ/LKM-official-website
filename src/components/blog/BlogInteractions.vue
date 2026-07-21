<template>
  <div class="blog-interactions">
    <!-- 互动按钮栏 -->
    <div class="flex items-center gap-3 py-3 border-y border-base-300 my-8">
      <!-- 点赞 -->
      <BlogLike :count="0" />

      <span class="w-px h-5 bg-base-300" />

      <!-- 评论跳转按钮 -->
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors hover:bg-base-200 text-base-content/60 group"
        @click="scrollToComments"
        aria-label="查看评论"
        title="查看评论"
      >
        <svg
          class="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span class="text-sm font-medium">评论</span>
      </button>

      <span class="w-px h-5 bg-base-300" />

      <!-- 转发 -->
      <BlogShare :url="url" :title="title" :description="excerpt" />
    </div>

    <!-- 评论区 -->
    <div ref="commentsSection">
      <BlogComments
        v-if="showComments"
        :repo="giscusRepo"
        :repo-id="giscusRepoId"
        :category="giscusCategory"
        :category-id="giscusCategoryId"
        :term="term"
        :mapping="mapping"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BlogLike from './BlogLike.vue';
import BlogShare from './BlogShare.vue';
import BlogComments from './BlogComments.vue';

export interface BlogInteractionsProps {
  /** 文章完整 URL */
  url: string;
  /** 文章标题 */
  title: string;
  /** 文章摘要 */
  excerpt?: string;
  /** 文章标识（用于 Giscus term，如 slug） */
  term?: string;
  /** Giscus 配置 */
  giscusRepo?: string;
  giscusRepoId?: string;
  giscusCategory?: string;
  giscusCategoryId?: string;
  /** Giscus 映射方式 */
  mapping?: 'pathname' | 'url' | 'title' | 'og:title' | 'specific';
}

const props = withDefaults(defineProps<BlogInteractionsProps>(), {
  excerpt: '',
  term: '',
  giscusRepo: '',
  giscusRepoId: '',
  giscusCategory: 'Announcements',
  giscusCategoryId: '',
  mapping: 'pathname',
});

const showComments = ref(false);
const commentsSection = ref<HTMLElement | null>(null);

function scrollToComments() {
  if (!showComments.value) {
    showComments.value = true;
  }
  // 等待 DOM 更新后滚动到评论区
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      commentsSection.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });
}
</script>
