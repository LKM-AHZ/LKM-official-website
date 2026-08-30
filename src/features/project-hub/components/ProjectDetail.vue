<script setup lang="ts">
// 项目详情（client island）—— 从后端 /api/v1/projects/{id} 拉取并渲染。
import { onMounted, ref } from "vue";
import { t } from "~/lib/i18n";
import { projectApi, type ProjectItem } from "~/lib/api/modules/projects";
import { buildUrl } from "~/lib/utils/paths";

const props = defineProps<{ projectId: string }>();

const loading = ref(true);
const project = ref<ProjectItem | null>(null);

onMounted(async () => {
  const id = Number(props.projectId);
  if (!Number.isFinite(id)) {
    loading.value = false;
    return;
  }
  project.value = await projectApi.getProject(id);
  loading.value = false;
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function revisionLabel(rev: number): string {
  if (rev === 0) return t("page.projects.revisionInitial");
  if (rev === 1) return t("page.projects.revisionOne");
  if (rev === 2) return t("page.projects.revisionTwo");
  return t("page.projects.revisionN", { n: rev });
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="text-sm text-text-muted py-12 text-center">
      {{ t("common.loading") }}
    </div>
    <div v-else-if="!project" class="text-sm text-text-muted py-12 text-center">
      <a class="text-primary underline" :href="buildUrl('/projects')">{{
        t("page.projects.title")
      }}</a>
    </div>
    <template v-else>
      <!-- 头部 -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span
            v-if="project.isPinned"
            class="text-xs px-2 py-1 rounded font-medium bg-red-100 dark:bg-red-950/30 text-red-600"
          >
            {{ t("page.projects.pinned") }}
          </span>
          <span
            v-if="project.isIncubated"
            class="text-xs px-2 py-1 rounded font-medium bg-amber-100 dark:bg-amber-950/30 text-amber-600"
          >
            {{ t("page.projects.incubated") }}
          </span>
          <span
            class="text-xs px-2 py-1 rounded font-medium"
            :class="
              project.isRecruiting
                ? 'bg-green-100 dark:bg-green-950/30 text-green-600'
                : 'bg-blue-100 dark:bg-blue-950/30 text-blue-600'
            "
          >
            {{
              project.type === "recruiting"
                ? project.isRecruiting
                  ? t("page.projects.recruiting")
                  : t("page.projects.recruited")
                : t("page.projects.showcase")
            }}
          </span>
        </div>
        <h1 class="text-3xl font-bold text-deep-text">{{ project.title }}</h1>
        <p class="text-sm text-text-muted mt-2">
          {{
            t("page.projects.initiator", {
              name: project.applicantName,
              date: formatDate(project.createdAt),
            })
          }}
        </p>
      </div>

      <!-- 进度条 -->
      <div class="bg-card-bg border border-surface-3 rounded-xl p-5">
        <div class="flex items-center justify-between mb-2 text-sm">
          <span class="text-deep-text font-medium">{{
            t("page.projects.progress")
          }}</span>
          <span class="text-primary font-bold">{{ project.progress }}%</span>
        </div>
        <div class="h-2.5 rounded-full bg-surface-3 overflow-hidden">
          <div
            class="h-full rounded-full bg-primary transition-all"
            :style="{ width: project.progress + '%' }"
          ></div>
        </div>
      </div>

      <!-- 详情 -->
      <div
        class="bg-card-bg border border-surface-3 rounded-xl p-6 space-y-4 text-sm"
      >
        <div v-if="project.background">
          <h3 class="font-semibold text-deep-text mb-1">
            {{ t("page.projects.background") }}
          </h3>
          <p class="text-text-muted leading-relaxed whitespace-pre-wrap">
            {{ project.background }}
          </p>
        </div>
        <div v-if="project.goals">
          <h3 class="font-semibold text-deep-text mb-1">
            {{ t("page.projects.goals") }}
          </h3>
          <p class="text-text-muted leading-relaxed whitespace-pre-wrap">
            {{ project.goals }}
          </p>
        </div>
        <div v-if="project.requirements">
          <h3 class="font-semibold text-deep-text mb-1">
            {{ t("page.projects.requirements") }}
          </h3>
          <p class="text-text-muted leading-relaxed whitespace-pre-wrap">
            {{ project.requirements }}
          </p>
        </div>
        <div v-if="project.teamIntro">
          <h3 class="font-semibold text-deep-text mb-1">
            {{ t("page.projects.teamIntro") }}
          </h3>
          <p class="text-text-muted leading-relaxed whitespace-pre-wrap">
            {{ project.teamIntro }}
          </p>
        </div>
        <div v-if="project.members.length">
          <h3 class="font-semibold text-deep-text mb-1">
            {{ t("page.projects.teamMembers") }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="m in project.members"
              :key="m.id"
              class="text-xs px-2 py-1 rounded-full bg-surface-3 text-text-muted"
            >
              {{ m.displayName }} · {{ m.roleInProject }}
            </span>
          </div>
        </div>
        <div v-if="project.recruitingRoles.length">
          <h3 class="font-semibold text-deep-text mb-1">
            {{ t("page.projects.recruitingRoles") }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="r in project.recruitingRoles"
              :key="r"
              class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
            >
              {{ t("page.projects.roleMissing", { name: r }) }}
            </span>
          </div>
        </div>
        <div v-if="project.tags.length" class="flex flex-wrap gap-1">
          <span
            v-for="tag in project.tags"
            :key="tag"
            class="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-text-muted"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 汇报历史 -->
      <div
        v-if="project.reports.length"
        class="bg-card-bg border border-surface-3 rounded-xl p-6"
      >
        <h3 class="font-semibold text-deep-text mb-4">
          {{ t("page.projects.reports") }}
        </h3>
        <div class="space-y-4">
          <div
            v-for="(r, i) in project.reports"
            :key="i"
            class="border-l-2 border-primary pl-4"
          >
            <div class="flex items-center gap-2 mb-1">
              <span
                class="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium"
              >
                {{ revisionLabel(r.revision) }}
              </span>
              <span class="text-xs text-text-muted/60">{{ r.date }}</span>
            </div>
            <h4 class="font-medium text-deep-text">{{ r.title }}</h4>
            <p class="text-sm text-text-muted mt-1 leading-relaxed">
              {{ r.content }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
