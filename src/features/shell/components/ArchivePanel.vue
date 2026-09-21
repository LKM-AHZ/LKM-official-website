<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { t } from "~/lib/i18n";
import { getPostUrlBySlug } from "~/lib/utils/url-utils";

const props = withDefaults(
  defineProps<{
    tags?: string[];
    categories?: string[];
    sortedPosts?: Post[];
  }>(),
  {
    tags: () => [],
    categories: () => [],
    sortedPosts: () => [],
  },
);

interface Post {
  slug: string;
  data: {
    title: string;
    tags: string[];
    category?: string;
    published: Date;
  };
}

interface Group {
  year: number;
  posts: Post[];
}

// SSR/预渲染时没有 window：组件 setup 期直接读会在服务端抛 "window is not defined"
const params = new URLSearchParams(
  typeof window === "undefined" ? "" : window.location.search,
);
const tags = params.has("tag") ? params.getAll("tag") : props.tags;
const categories = params.has("category")
  ? params.getAll("category")
  : props.categories;
const uncategorized = params.get("uncategorized");

const groups = ref<Group[]>([]);

function formatDate(date: Date) {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}-${day}`;
}

function formatTag(tagList: string[]) {
  return tagList.map((t) => `#${t}`).join(" ");
}

watchEffect(() => {
  let filteredPosts: Post[] = props.sortedPosts;

  if (tags.length > 0) {
    filteredPosts = filteredPosts.filter(
      (post) =>
        Array.isArray(post.data.tags) &&
        post.data.tags.some((tag) => tags.includes(tag)),
    );
  }

  if (categories.length > 0) {
    filteredPosts = filteredPosts.filter(
      (post) => post.data.category && categories.includes(post.data.category),
    );
  }

  if (uncategorized) {
    filteredPosts = filteredPosts.filter((post) => !post.data.category);
  }

  const grouped = filteredPosts.reduce(
    (acc, post) => {
      const year = post.data.published.getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(post);
      return acc;
    },
    {} as Record<number, Post[]>,
  );

  const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
    year: Number.parseInt(yearStr, 10),
    posts: grouped[Number.parseInt(yearStr, 10)],
  }));

  groupedPostsArray.sort((a, b) => b.year - a.year);

  groups.value = groupedPostsArray;
});
</script>

<template>
  <div
    class="bg-white dark:bg-[oklch(0.23_0.015_var(--hue))] rounded-[var(--radius-large)] overflow-hidden shadow-sm dark:shadow-none px-8 py-6"
  >
    <div v-for="group in groups" :key="group.year">
      <div class="flex flex-row w-full items-center h-[3.75rem]">
        <div
          class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75"
        >
          {{ group.year }}
        </div>
        <div class="w-[15%] md:w-[10%]">
          <div
            class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto -outline-offset-[2px] z-50 outline-3"
          ></div>
        </div>
        <div class="w-[70%] md:w-[80%] transition text-left text-50">
          {{ group.posts.length }}
          {{
            t(group.posts.length === 1 ? "blog.postCount" : "blog.postsCount")
          }}
        </div>
      </div>

      <a
        v-for="post in group.posts"
        :key="post.slug"
        :href="getPostUrlBySlug(post.slug)"
        :aria-label="post.data.title"
        class="group btn-plain !block h-10 w-full rounded-lg hover:text-[initial]"
      >
        <div class="flex flex-row justify-start items-center h-full">
          <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
            {{ formatDate(post.data.published) }}
          </div>

          <div
            class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center"
          >
            <div
              class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5 bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)] outline outline-4 z-50 outline-[var(--card-bg)] group-hover:outline-[var(--btn-plain-bg-hover)] group-active:outline-[var(--btn-plain-bg-active)]"
            ></div>
          </div>

          <div
            class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-bold group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)] text-75 pr-8 whitespace-nowrap overflow-ellipsis overflow-hidden"
          >
            {{ post.data.title }}
          </div>

          <div
            class="hidden md:block md:w-[15%] text-left text-sm transition whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
          >
            {{ formatTag(post.data.tags) }}
          </div>
        </div>
      </a>
    </div>
  </div>
</template>
