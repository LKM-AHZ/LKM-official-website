<script setup lang="ts">
// 项目详情（client island）—— 从后端 /api/v1/projects/{id} 拉取并渲染。
import { computed, onMounted, ref } from "vue";
import { getLocale, t } from "~/lib/i18n";
import { projectApi, type ProjectItem } from "~/lib/api/modules/projects";
import { buildUrl } from "~/lib/utils/paths";
import ProjectProgressBar from "./ProjectProgressBar.vue";

const props = defineProps<{ projectId: string }>();

const loading = ref(true);
const project = ref<ProjectItem | null>(null);

onMounted(async () => {
  project.value = await projectApi.getProject(props.projectId);
  loading.value = false;
});

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  // 后端字段缺失/非法时 toLocaleDateString 会把 "Invalid Date" 直接渲染给用户
  if (Number.isNaN(d.getTime())) return "";
  // 硬编码 zh-CN 会让英文站也显示中文日期，改从 i18n 取当前 Locale
  return d.toLocaleDateString(getLocale(), {
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

interface TimelineNode {
  date: string;
  progress: number;
  title: string;
  summary: string;
  badge?: string;
  done: boolean;
}

// 时间轴节点：固定「项目立项」起始节点 + 后端 reports（二编追加）。
// reports 不带进度字段，按 revision 顺序在 0~当前进度间均匀分配一个进度百分比，
// 用于在时间轴上直观展示每次追加时所处的阶段。
const timelineNodes = computed<TimelineNode[]>(() => {
  const p = project.value;
  if (!p) return [];
  const current = Math.max(0, Math.min(100, Math.round(p.progress)));
  const nodes: TimelineNode[] = [
    {
      date: formatDate(p.createdAt) || "—",
      progress: 0,
      title: "项目立项",
      summary: `${p.applicantName} 发起项目「${p.title}」，进入需求确认阶段。`,
      badge: "立项",
      done: true,
    },
  ];
  const reports = p.reports ?? [];
  const total = Math.max(reports.length, 1);
  reports.forEach((r, i) => {
    // 从 0 到 current 均匀递增，最后一条对齐当前进度
    const frac =
      total === 1 ? current : Math.round(((i + 1) / total) * current);
    nodes.push({
      date: r.date || "—",
      progress: frac,
      title: r.title,
      summary: r.content,
      badge: revisionLabel(r.revision),
      done: frac <= current,
    });
  });
  return nodes;
});
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
      <header class="page-intro">
        <div class="page-intro-copy">
          <div class="flex flex-wrap items-center gap-2 mb-3">
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
          <h1 class="font-semibold text-deep-text">{{ project.title }}</h1>
          <p class="page-intro-description text-sm">
            {{
              t("page.projects.initiator", {
                name: project.applicantName,
                date: formatDate(project.createdAt),
              })
            }}
          </p>
        </div>
      </header>

      <!-- 进度条（含里程碑节点） -->
      <div
        id="progress"
        class="bg-card-bg border border-surface-3 rounded-xl p-5"
      >
        <div class="flex items-center justify-between mb-3 text-sm">
          <span class="text-deep-text font-medium">{{
            t("page.projects.progress")
          }}</span>
          <span class="text-primary font-bold">{{ project.progress }}%</span>
        </div>
        <ProjectProgressBar :progress="project.progress" />
      </div>

      <!-- 详情 -->
      <div
        id="details"
        class="bg-card-bg border border-surface-3 rounded-[18px] p-5 sm:p-6 space-y-6 text-sm"
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

      <!-- 项目进展时间轴（二编追加模式） -->
      <div
        id="timeline"
        class="bg-card-bg border border-surface-3 rounded-xl p-5 sm:p-6"
      >
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-semibold text-deep-text">
            {{ t("page.projects.reports") }}
          </h3>
          <span class="text-xs text-text-muted/60">
            {{ timelineNodes.length }} 个节点
          </span>
        </div>

        <ol
          v-if="timelineNodes.length"
          class="relative ml-2 space-y-6 border-l-2 border-surface-3 pl-6"
        >
          <li v-for="(node, i) in timelineNodes" :key="i" class="relative">
            <!-- 时间轴节点圆点 -->
            <span
              class="absolute -left-[31px] top-1.5 block h-3 w-3 rounded-full border-2 border-primary bg-card-bg"
              :class="{ 'bg-primary': node.done }"
            />
            <!-- 时间戳 + 进度百分比 -->
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="text-xs text-text-muted/60">{{ node.date }}</span>
              <span
                class="text-xs px-1.5 py-0.5 rounded font-medium bg-primary/10 text-primary"
              >
                {{ node.progress }}%
              </span>
              <span
                v-if="node.badge"
                class="text-xs px-1.5 py-0.5 rounded bg-surface-3 text-text-muted"
              >
                {{ node.badge }}
              </span>
            </div>
            <h4 class="font-medium text-deep-text">{{ node.title }}</h4>
            <p
              v-if="node.summary"
              class="text-sm text-text-muted mt-1 leading-relaxed"
            >
              {{ node.summary }}
            </p>
          </li>
        </ol>
        <p v-else class="text-sm text-text-muted">
          暂无进展记录，发起人可通过「追加进展」更新项目状态。
        </p>
      </div>
    </template>
  </div>
</template>
