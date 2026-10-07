<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { contentApi, type ContentItem } from "~/lib/api/modules/content";
import {
  projectApi,
  type ProjectItem,
  type ProjectApplicationItem,
} from "~/lib/api/modules/projects";
import { qaApi, type QuestionSummary } from "~/lib/api/modules/qa";
import { buildUrl } from "~/lib/utils/paths";

const props = defineProps<{
  section: "all" | "questions" | "posts" | "projects";
}>();
const auth = useAuthStore();
const ready = ref(false);
const loadingMore = ref(false);
const questions = ref<QuestionSummary[]>([]);
const posts = ref<ContentItem[]>([]);
const projects = ref<ProjectItem[]>([]);
const applications = ref<ProjectApplicationItem[]>([]);
const questionPage = ref(0);
const postPage = ref(0);
const moreQuestions = ref(false);
const morePosts = ref(false);
const pageSize = 20;

async function loadQuestions() {
  const userId = auth.user?.id;
  if (!userId) return;
  const rows = await qaApi.listQuestions(
    undefined,
    questionPage.value + 1,
    pageSize,
    "newest",
    userId,
  );
  questions.value.push(...rows);
  questionPage.value++;
  moreQuestions.value = rows.length === pageSize;
}

async function loadPosts() {
  const userId = auth.user?.id;
  if (!userId) return;
  const result = await contentApi.listItems({
    author_id: userId,
    content_type: "discussion",
    page: postPage.value + 1,
    limit: pageSize,
  });
  if (result.isErr()) return;
  posts.value.push(...result.value.items);
  postPage.value++;
  morePosts.value = postPage.value < result.value.pages;
}

async function loadMore(type: "questions" | "posts") {
  loadingMore.value = true;
  try {
    if (type === "questions") await loadQuestions();
    else await loadPosts();
  } finally {
    loadingMore.value = false;
  }
}

onMounted(async () => {
  await auth.restoreAndValidate();
  const userId = auth.user?.id;
  if (userId) {
    const jobs: Promise<unknown>[] = [];
    if (props.section === "all" || props.section === "questions")
      jobs.push(loadQuestions());
    if (props.section === "all" || props.section === "posts")
      jobs.push(loadPosts());
    if (props.section === "all" || props.section === "projects") {
      jobs.push(
        Promise.all([
          projectApi.listProjects(),
          projectApi.listMyApplications(),
        ]).then(([rows, own]) => {
          projects.value = rows.filter(
            (project) => project.applicantId === userId,
          );
          applications.value = own.filter(
            (application) => application.status !== "approved",
          );
        }),
      );
    }
    await Promise.all(jobs);
  }
  ready.value = true;
});
</script>

<template>
  <div class="space-y-8">
    <nav class="flex flex-wrap gap-2" aria-label="我的内容分类">
      <a
        v-for="item in [
          { key: 'all', title: '全部' },
          { key: 'questions', title: '我的提问' },
          { key: 'posts', title: '我的帖子' },
          { key: 'projects', title: '我的项目' },
          { key: 'favorites', title: '我的收藏' },
          { key: 'history', title: '浏览历史' },
        ]"
        :key="item.key"
        :href="buildUrl(item.key === 'all' ? '/my' : `/my/${item.key}`)"
        class="rounded-full px-4 py-2 text-sm font-medium"
        :class="
          section === item.key
            ? 'bg-primary text-on-primary'
            : 'bg-surface-2 text-deep-text hover:bg-surface-3'
        "
      >
        {{ item.title }}
      </a>
    </nav>
    <p v-if="!ready" class="py-8 text-center text-text-muted">正在加载…</p>
    <p v-else-if="!auth.isLoggedIn" class="py-8 text-center text-text-muted">
      请先<a :href="buildUrl('/login')" class="text-primary hover:underline"
        >登录</a
      >查看我的内容。
    </p>
    <template v-else>
      <section
        v-if="section === 'all' || section === 'questions'"
        class="space-y-3"
      >
        <h2 class="text-xl font-semibold text-deep-text">我的提问</h2>
        <a
          v-for="question in questions"
          :key="question.id"
          :href="buildUrl(`/qa/${question.id}`)"
          class="block rounded-xl border border-surface-3 p-4 text-deep-text hover:text-primary"
          >{{ question.title }}</a
        >
        <p v-if="!questions.length" class="text-sm text-text-muted">
          还没有提问。
        </p>
        <a
          v-if="section === 'all'"
          :href="buildUrl('/my/questions')"
          class="inline-block text-sm text-primary"
          >查看全部提问 →</a
        >
        <button
          v-else-if="moreQuestions"
          type="button"
          :disabled="loadingMore"
          class="text-sm text-primary disabled:opacity-50"
          @click="loadMore('questions')"
        >
          加载更多
        </button>
      </section>
      <section
        v-if="section === 'all' || section === 'posts'"
        class="space-y-3"
      >
        <h2 class="text-xl font-semibold text-deep-text">我的帖子</h2>
        <a
          v-for="post in posts"
          :key="post.id"
          :href="buildUrl(`/forum/post/${post.id}`)"
          class="block rounded-xl border border-surface-3 p-4 text-deep-text hover:text-primary"
          >{{ post.title }}</a
        >
        <p v-if="!posts.length" class="text-sm text-text-muted">还没有发帖。</p>
        <a
          v-if="section === 'all'"
          :href="buildUrl('/my/posts')"
          class="inline-block text-sm text-primary"
          >查看全部帖子 →</a
        >
        <button
          v-else-if="morePosts"
          type="button"
          :disabled="loadingMore"
          class="text-sm text-primary disabled:opacity-50"
          @click="loadMore('posts')"
        >
          加载更多
        </button>
      </section>
      <section
        v-if="section === 'all' || section === 'projects'"
        class="space-y-3"
      >
        <h2 class="text-xl font-semibold text-deep-text">我的项目</h2>
        <a
          v-for="project in projects"
          :key="project.id"
          :href="buildUrl(`/projects/${project.id}`)"
          class="block rounded-xl border border-surface-3 p-4 text-deep-text hover:text-primary"
          >{{ project.title }}</a
        >
        <div
          v-for="application in applications"
          :key="application.id"
          class="rounded-xl border border-surface-3 p-4 text-deep-text"
        >
          {{ application.title }} ·
          {{ application.status === "pending" ? "审核中" : "未通过" }}
        </div>
        <p
          v-if="!projects.length && !applications.length"
          class="text-sm text-text-muted"
        >
          还没有发起项目。
        </p>
        <a
          v-if="section === 'all'"
          :href="buildUrl('/my/projects')"
          class="inline-block text-sm text-primary"
          >查看全部项目 →</a
        >
      </section>
    </template>
  </div>
</template>
