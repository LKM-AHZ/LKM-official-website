<template>
  <div class="space-y-6">
    <div v-if="loading" class="text-center py-8 text-text-muted">
      {{ t("common.loading") }}
    </div>

    <template v-else-if="user">
      <!-- 头部 -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div
          class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-2xl overflow-hidden"
        >
          <img
            v-if="user.avatar"
            :src="user.avatar"
            :alt="displayName"
            class="w-full h-full object-cover"
          />
          <span v-else>{{ avatarLetter }}</span>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-2xl font-bold text-deep-text">{{ displayName }}</h1>
            <span
              class="text-sm px-2 py-0.5 rounded-full font-medium"
              :style="{
                color: titleInfo.color,
                background: `color-mix(in srgb, ${titleInfo.color} 15%, transparent)`,
              }"
            >
              {{ t(titleInfo.name) }}
            </span>
          </div>
          <p class="text-sm text-text-muted mt-1">@{{ user.username }}</p>
          <div class="flex items-center gap-4 mt-2 text-sm text-text-muted/60">
            <span>{{
              t("profile.followers", { count: user.follower_count ?? 0 })
            }}</span>
            <span>{{
              t("profile.following", { count: user.following_count ?? 0 })
            }}</span>
            <span class="text-primary font-semibold">{{
              t("profile.points", {
                points: (user.points ?? 0).toLocaleString(),
              })
            }}</span>
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button
            class="btn-primary px-5 py-2 rounded-lg text-sm font-semibold"
          >
            {{ t("profile.follow") }}
          </button>
          <button class="btn-ghost px-4 py-2 rounded-lg text-sm">
            {{ t("profile.message") }}
          </button>
        </div>
      </div>

      <!-- 个人资料 -->
      <div class="border-t border-surface-3 pt-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-text-muted/60">{{ t("profile.motto") }}</span>
            <p class="text-deep-text mt-0.5">
              {{ user.bio || t("profile.notFilled") }}
            </p>
          </div>
          <div>
            <span class="text-text-muted/60">{{ t("profile.major") }}</span>
            <p class="text-deep-text mt-0.5">
              {{ user.major || t("profile.notFilled") }}
            </p>
          </div>
          <div>
            <span class="text-text-muted/60">{{ t("profile.grade") }}</span>
            <p class="text-deep-text mt-0.5">
              {{ user.grade || t("profile.notFilled") }}
            </p>
          </div>
          <div>
            <span class="text-text-muted/60">{{ t("profile.interests") }}</span>
            <div
              v-if="user.interests && user.interests.length"
              class="flex flex-wrap gap-1 mt-1"
            >
              <span
                v-for="i in user.interests"
                :key="i"
                class="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-text-muted"
                >{{ i }}</span
              >
            </div>
            <p v-else class="text-deep-text mt-0.5 text-text-muted">
              {{ t("profile.notFilled") }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <span class="text-text-muted/60">{{ t("profile.ideals") }}</span>
            <p class="text-deep-text mt-0.5">
              {{ user.ideals || t("profile.notFilled") }}
            </p>
          </div>
        </div>
      </div>

      <!-- Tab 区域 -->
      <div class="border-t border-surface-3 pt-4">
        <div class="flex border-b border-surface-3">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors relative"
            :class="
              activeTab === tab.key
                ? 'text-primary'
                : 'text-text-muted hover:text-deep-text'
            "
            @click="activeTab = tab.key"
          >
            {{ tab.label }} ({{ tab.count }})
            <div
              v-if="activeTab === tab.key"
              class="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
            ></div>
          </button>
        </div>
        <div class="pt-4">
          <template v-if="activeTab === 'posts'">
            <a
              v-for="post in posts"
              :key="post.id"
              :href="buildUrl(`/forum/post/${post.id}`)"
              class="block border-b border-surface-3 px-2 py-3 text-deep-text hover:text-primary"
              >{{ post.title }}</a
            >
            <p
              v-if="!posts.length"
              class="text-center py-8 text-sm text-text-muted"
            >
              {{ t("profile.noPosts") }}
            </p>
          </template>
          <template v-if="activeTab === 'projects'">
            <a
              v-for="project in projects"
              :key="project.id"
              :href="buildUrl(`/projects/${project.id}`)"
              class="block border-b border-surface-3 px-2 py-3 text-deep-text hover:text-primary"
              >{{ project.title }}</a
            >
            <div
              v-for="application in applications"
              :key="application.id"
              class="border-b border-surface-3 px-2 py-3 text-deep-text"
            >
              {{ application.title }} ·
              {{
                application.status === "pending"
                  ? t("profile.applicationPending")
                  : t("profile.applicationRejected")
              }}
            </div>
            <p
              v-if="!projects.length && !applications.length"
              class="text-center py-8 text-sm text-text-muted"
            >
              {{ t("profile.noProjects") }}
            </p>
          </template>
          <template v-if="activeTab === 'questions'">
            <a
              v-for="question in questions"
              :key="question.id"
              :href="buildUrl(`/qa/${question.id}`)"
              class="block border-b border-surface-3 px-2 py-3 text-deep-text hover:text-primary"
              >{{ question.title }}</a
            >
            <p
              v-if="!questions.length"
              class="text-center py-8 text-sm text-text-muted"
            >
              {{ t("page.qa.empty") }}
            </p>
          </template>
          <div v-if="activeTab === 'columns'" class="text-center py-8">
            <p
              v-if="!user.has_column_access"
              class="text-sm text-text-muted mb-2"
            >
              {{ t("profile.columnNotEnabled") }}
            </p>
            <a
              v-if="!user.has_column_access"
              :href="buildUrl('/register/onboarding')"
              class="text-primary text-sm font-medium hover:underline"
              >{{ t("profile.unlockColumn") }}</a
            >
            <p v-else class="text-sm text-text-muted">
              {{ t("profile.noColumnArticles") }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-12 space-y-3">
      <div
        class="w-16 h-16 mx-auto rounded-full bg-surface-2 flex items-center justify-center text-2xl text-text-muted"
      >
        {{ props.username?.charAt(0).toUpperCase() || "?" }}
      </div>
      <div class="text-lg font-semibold text-text-muted">
        @{{ props.username }}
      </div>
      <div class="text-sm text-text-muted">{{ t("profile.notFound") }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { ProfileInfo } from "~/lib/api/modules/auth";
import { authApi } from "~/lib/api";
import { contentApi, type ContentItem } from "~/lib/api/modules/content";
import {
  projectApi,
  type ProjectItem,
  type ProjectApplicationItem,
} from "~/lib/api/modules/projects";
import { qaApi, type QuestionSummary } from "~/lib/api/modules/qa";
import { buildUrl } from "~/lib/utils/paths";
import { titleInfoOf, type TitleInfo } from "../titles";
import { t } from "~/lib/i18n";
import { useAuthStore } from "~/stores/auth";

const props = defineProps<{ username: string }>();

const user = ref<(ProfileInfo & { username: string }) | null>(null);
const loading = ref(true);
const activeTab = ref("posts");
const posts = ref<ContentItem[]>([]);
const projects = ref<ProjectItem[]>([]);
const applications = ref<ProjectApplicationItem[]>([]);
const questions = ref<QuestionSummary[]>([]);
const auth = useAuthStore();

const displayName = computed(
  () => user.value?.nickname || user.value?.username || props.username,
);
const avatarLetter = computed(() => displayName.value.charAt(0).toUpperCase());
const titleInfo = computed<TitleInfo>(() => titleInfoOf(user.value?.title));

const tabs = computed(() => [
  {
    key: "posts",
    label: t("profile.tabPosts"),
    count: posts.value.length,
  },
  {
    key: "projects",
    label: t("profile.tabProjects"),
    count: projects.value.length + applications.value.length,
  },
  {
    key: "questions",
    label: t("page.qa.title"),
    count: questions.value.length,
  },
  {
    key: "columns",
    label: t("profile.tabColumns"),
    count: user.value?.column_article_count ?? 0,
  },
]);

onMounted(async () => {
  auth.restoreFromStorage();
  const result = await authApi.getUserByUsername(props.username);
  if (result.isOk()) {
    user.value = { ...result.value, username: props.username };
    const userId = result.value.user_id;
    if (userId) {
      const [postResult, projectRows, questionRows, applicationRows] =
        await Promise.all([
          contentApi.listItems({
            author_id: userId,
            content_type: "discussion",
            limit: 50,
          }),
          projectApi.listProjects(),
          qaApi.listQuestions(undefined, 1, 50, "newest", userId),
          auth.user?.id === userId
            ? projectApi.listMyApplications()
            : Promise.resolve([]),
        ]);
      posts.value = postResult.isOk() ? postResult.value.items : [];
      projects.value = projectRows.filter(
        (project) => project.applicantId === userId,
      );
      questions.value = questionRows;
      applications.value = applicationRows.filter(
        (application) => application.status !== "approved",
      );
    }
  }
  loading.value = false;
});
</script>
