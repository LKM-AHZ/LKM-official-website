<!--
  ProjectHall.vue
  项目大厅主组件（含全部子组件和工具模块）

  代码要点：
  1. TypeScript 类型定义
  2. 通用表单校验逻辑封装
  3. HTTP 请求统一用 apiFetch（禁止裸 fetch）
  4. toast 替代原生 alert
  5. 增强可访问性（焦点管理 / Esc / 点击遮罩关闭 / focus trap 简易版）
  6. 发言/报名表单含项目组选择
-->
<template>
  <div class="space-y-6">
    <!-- 头部：标签切换 + 操作按钮 -->
    <div
      class="flex flex-col gap-3 border-b border-surface-3 pb-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div
        class="flex min-w-0 gap-1 rounded-full bg-btn-plain-bg-hover p-1"
        role="group"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
          :class="
            activeTab === tab.key
              ? 'bg-card-bg text-primary-readable shadow-sm'
              : 'text-text-muted hover:text-deep-text'
          "
          :aria-pressed="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          {{ t(tab.label) }}
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors"
          :class="
            onlyRecruiting
              ? 'border-green-500/40 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
              : 'border-surface-3 bg-card-bg text-deep-text hover:bg-btn-regular-bg'
          "
          :aria-pressed="onlyRecruiting"
          @click="onlyRecruiting = !onlyRecruiting"
        >
          <span
            class="inline-block h-1.5 w-1.5 rounded-full"
            :class="onlyRecruiting ? 'bg-green-500' : 'bg-text-muted/40'"
          />
          仅看招募中
        </button>
        <button
          :aria-label="t('projectHub.applyAria')"
          class="rounded-full border border-surface-3 bg-card-bg px-4 py-2 text-sm font-medium text-deep-text transition-colors hover:bg-btn-regular-bg"
          @click="openApplyModal"
        >
          {{ t("projectHub.apply") }}
        </button>
        <button
          :aria-label="t('projectHub.createAria')"
          class="rounded-full bg-primary-action px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          @click="openProjectModal"
        >
          {{ t("projectHub.create") }}
        </button>
      </div>
    </div>

    <!-- 项目卡片列表 -->
    <div v-if="loading" class="text-sm text-text-muted py-12 text-center">
      {{ t("common.loading") }}
    </div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <a
        v-for="proj in filteredProjects"
        :key="proj.id"
        :href="buildUrl(`/projects/${proj.id}`)"
        class="profile-card group block"
      >
        <div class="profile-inner p-5 flex flex-col gap-2.5 h-full">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              v-if="proj.isPinned"
              class="text-xs px-1.5 py-0.5 rounded font-medium bg-red-100 dark:bg-red-950/30 text-red-600"
            >
              {{ t("projectHub.pinned") }}
            </span>
            <span
              v-if="proj.isIncubated"
              class="text-xs px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-950/30 text-amber-600"
            >
              {{ t("projectHub.incubated") }}
            </span>
            <span
              v-if="proj.isRecruiting"
              class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-green-500" />
              {{ t("projectHub.recruiting") }}
            </span>
          </div>
          <h3
            class="font-bold text-deep-text group-hover:text-primary transition-colors"
          >
            {{ proj.title }}
          </h3>
          <p class="text-xs text-text-muted">
            {{ t("projectHub.initiatedBy", { name: proj.applicantName }) }}
          </p>
          <!-- 进度条缩略图（含里程碑节点） -->
          <ProjectProgressBar :progress="proj.progress" compact />
          <div class="flex items-center justify-between text-xs">
            <span
              :class="
                proj.isRecruiting ? 'text-green-500' : 'text-text-muted/60'
              "
            >
              {{
                proj.isRecruiting
                  ? t("projectHub.recruiting")
                  : t("projectHub.showcase")
              }}
            </span>
            <span class="text-text-muted/60">{{
              t("projectHub.progressValue", { progress: proj.progress })
            }}</span>
          </div>
          <div v-if="proj.recruitingRoles.length" class="flex flex-wrap gap-1">
            <span
              v-for="r in proj.recruitingRoles"
              :key="r"
              class="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
            >
              {{ t("projectHub.roleMissing", { role: r }) }}
            </span>
          </div>
        </div>
      </a>
    </div>

    <div
      v-if="filteredProjects.length === 0"
      class="text-center py-12 text-sm text-text-muted"
    >
      {{ t("projectHub.noProjects") }}
    </div>

    <!-- ==================== 模态框1：发言 / 报名 ==================== -->
    <div
      v-if="showApplyModal"
      ref="applyModalRootRef"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="closeApplyModal"
      @keydown.escape="closeApplyModal"
      tabindex="-1"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
        @click.stop
      >
        <div class="flex justify-between items-center mb-4">
          <h2
            id="apply-modal-title"
            class="text-xl font-bold text-deep-text dark:text-white"
          >
            {{ t("projectHub.apply") }}
          </h2>
          <button
            :aria-label="t('projectHub.closeDialogAria')"
            class="text-text-muted hover:text-deep-text text-2xl leading-none"
            @click="closeApplyModal"
          >
            &times;
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="handleApplySubmit">
          <div>
            <label
              class="block text-sm font-medium text-deep-text dark:text-white mb-1"
              for="apply-nickname"
            >
              {{ t("projectHub.nickname") }} <span class="text-red-500">*</span>
            </label>
            <input
              id="apply-nickname"
              v-model="applyForm.nickname"
              type="text"
              maxlength="20"
              class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              :placeholder="t('projectHub.nicknamePlaceholder')"
              @blur="validateApplyField('nickname')"
            />
            <p v-if="applyErrors.nickname" class="mt-1 text-xs text-red-500">
              {{ applyErrors.nickname }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-deep-text dark:text-white mb-1"
              for="apply-progress"
            >
              {{ t("projectHub.currentProgress") }}
              <span class="text-red-500">*</span>
            </label>
            <select
              id="apply-progress"
              v-model="applyForm.progress"
              class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              @change="validateApplyField('progress')"
            >
              <option value="">{{ t("projectHub.selectPlaceholder") }}</option>
              <option value="idea">{{ t("projectHub.progressIdea") }}</option>
              <option value="planning">
                {{ t("projectHub.progressPlanning") }}
              </option>
              <option value="prototype">
                {{ t("projectHub.progressPrototype") }}
              </option>
              <option value="developing">
                {{ t("projectHub.progressDeveloping") }}
              </option>
              <option value="testing">
                {{ t("projectHub.progressTesting") }}
              </option>
              <option value="launched">
                {{ t("projectHub.progressLaunched") }}
              </option>
            </select>
            <p v-if="applyErrors.progress" class="mt-1 text-xs text-red-500">
              {{ applyErrors.progress }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-deep-text dark:text-white mb-1"
              for="apply-group"
            >
              {{ t("projectHub.joinGroup") }}
              <span class="text-red-500">*</span>
            </label>
            <select
              id="apply-group"
              v-model="applyForm.group"
              class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              @change="validateApplyField('group')"
            >
              <option value="">{{ t("projectHub.selectPlaceholder") }}</option>
              <option value="quantum">
                {{ t("projectHub.groupQuantum") }}
              </option>
              <option value="knowledge-graph">
                {{ t("projectHub.groupKnowledgeGraph") }}
              </option>
              <option value="astronomy">
                {{ t("projectHub.groupAstronomy") }}
              </option>
              <option value="science-video">
                {{ t("projectHub.groupScienceVideo") }}
              </option>
            </select>
            <p v-if="applyErrors.group" class="mt-1 text-xs text-red-500">
              {{ applyErrors.group }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <input
              id="apply-incubator"
              v-model="applyForm.applyIncubator"
              type="checkbox"
              class="w-4 h-4 text-primary rounded border-surface-3 focus:ring-primary"
            />
            <label
              for="apply-incubator"
              class="text-sm font-medium text-deep-text dark:text-white"
            >
              {{ t("projectHub.applyIncubator") }}
            </label>
          </div>

          <div v-if="applyForm.applyIncubator">
            <label
              class="block text-sm font-medium text-deep-text dark:text-white mb-1"
              for="apply-contact"
            >
              {{ t("projectHub.contact") }} <span class="text-red-500">*</span>
            </label>
            <input
              id="apply-contact"
              v-model="applyForm.contact"
              type="text"
              maxlength="50"
              class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              :placeholder="t('projectHub.contactPlaceholder')"
              @blur="validateApplyField('contact')"
            />
            <p v-if="applyErrors.contact" class="mt-1 text-xs text-red-500">
              {{ applyErrors.contact }}
            </p>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-surface-3 text-deep-text hover:bg-surface-4 transition-colors"
              @click="closeApplyModal"
            >
              {{ t("common.cancel") }}
            </button>
            <button
              type="submit"
              :disabled="isSubmittingApply"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {{
                isSubmittingApply
                  ? t("projectHub.submitting")
                  : t("projectHub.submitApply")
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== 模态框2：发起项目 ==================== -->
    <div
      v-if="showProjectModal"
      ref="projectModalRootRef"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="closeProjectModal"
      @keydown.escape="closeProjectModal"
      tabindex="-1"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        @click.stop
      >
        <div class="flex justify-between items-center mb-4">
          <h2
            id="project-modal-title"
            class="text-xl font-bold text-deep-text dark:text-white"
          >
            {{ t("projectHub.createTitle") }}
          </h2>
          <button
            :aria-label="t('projectHub.closeDialogAria')"
            class="text-text-muted hover:text-deep-text text-2xl leading-none"
            @click="closeProjectModal"
          >
            &times;
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="handleProjectSubmit">
          <div>
            <label
              class="block text-sm font-medium text-deep-text dark:text-white mb-1"
              for="project-name"
            >
              {{ t("projectHub.projectName") }}
              <span class="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              v-model="projectForm.name"
              type="text"
              maxlength="50"
              class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              :placeholder="t('projectHub.projectNamePlaceholder')"
              @blur="validateProjectField('name')"
            />
            <p v-if="projectErrors.name" class="mt-1 text-xs text-red-500">
              {{ projectErrors.name }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-deep-text dark:text-white mb-1"
              for="project-description"
            >
              {{ t("projectHub.projectDescription") }}
              <span class="text-red-500">*</span>
            </label>
            <textarea
              id="project-description"
              v-model="projectForm.description"
              rows="3"
              maxlength="200"
              class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              :placeholder="t('projectHub.projectDescriptionPlaceholder')"
              @blur="validateProjectField('description')"
            />
            <p
              v-if="projectErrors.description"
              class="mt-1 text-xs text-red-500"
            >
              {{ projectErrors.description }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-deep-text dark:text-white mb-1"
              for="project-roles"
            >
              {{ t("projectHub.recruitingRoles") }}
            </label>
            <input
              id="project-roles"
              v-model="projectForm.roles"
              type="text"
              maxlength="100"
              class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              :placeholder="t('projectHub.rolesPlaceholder')"
            />
          </div>

          <!-- 招募开关（P0）：勾选后展开结构化招募表单 -->
          <div
            class="flex items-center gap-2 rounded-lg border border-surface-3 bg-surface-3/30 px-3 py-2.5"
          >
            <input
              id="project-recruit-toggle"
              v-model="projectForm.recruitEnabled"
              type="checkbox"
              class="w-4 h-4 text-primary rounded border-surface-3 focus:ring-primary"
            />
            <label
              for="project-recruit-toggle"
              class="text-sm font-medium text-deep-text dark:text-white"
            >
              招募项目成员
            </label>
          </div>

          <div v-if="projectForm.recruitEnabled" class="space-y-4 rounded-lg border border-dashed border-primary/30 p-4">
            <!-- 招募岗位/角色（多选 chip） -->
            <div>
              <label class="block text-sm font-medium text-deep-text dark:text-white mb-1.5">
                招募岗位 / 角色
              </label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="role in RECRUIT_ROLE_OPTIONS"
                  :key="role"
                  type="button"
                  class="text-xs px-2.5 py-1 rounded-full border transition-colors"
                  :class="
                    projectForm.selectedRoles.includes(role)
                      ? 'bg-primary text-on-primary border-primary'
                      : 'border-surface-3 text-text-muted hover:border-primary/40 hover:text-primary'
                  "
                  @click="toggleRoleChip(role)"
                >
                  {{ role }}
                </button>
              </div>
            </div>

            <!-- 能力要求（文本域） -->
            <div>
              <label
                for="project-req"
                class="block text-sm font-medium text-deep-text dark:text-white mb-1"
              >
                能力要求
              </label>
              <textarea
                id="project-req"
                v-model="projectForm.requirements"
                rows="2"
                maxlength="200"
                class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                placeholder="例如：熟悉 Python，有机器学习项目经验优先"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- 招募人数（数字输入） -->
              <div>
                <label
                  for="project-headcount"
                  class="block text-sm font-medium text-deep-text dark:text-white mb-1"
                >
                  招募人数
                </label>
                <input
                  id="project-headcount"
                  v-model.number="projectForm.headcount"
                  type="number"
                  min="1"
                  max="50"
                  class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  placeholder="如 2-3 人"
                />
              </div>
              <!-- 项目周期/截止时间（日期选择器） -->
              <div>
                <label
                  for="project-deadline"
                  class="block text-sm font-medium text-deep-text dark:text-white mb-1"
                >
                  招募截止时间
                </label>
                <input
                  id="project-deadline"
                  v-model="projectForm.deadline"
                  type="date"
                  class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-deep-text dark:text-white mb-1"
              for="project-contact"
            >
              {{ t("projectHub.contact") }} <span class="text-red-500">*</span>
            </label>
            <input
              id="project-contact"
              v-model="projectForm.contact"
              type="text"
              maxlength="50"
              class="w-full px-3 py-2 border border-surface-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              :placeholder="t('projectHub.contactPlaceholder2')"
              @blur="validateProjectField('contact')"
            />
            <p v-if="projectErrors.contact" class="mt-1 text-xs text-red-500">
              {{ projectErrors.contact }}
            </p>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-surface-3 text-deep-text hover:bg-surface-4 transition-colors"
              @click="closeProjectModal"
            >
              {{ t("common.cancel") }}
            </button>
            <button
              type="submit"
              :disabled="isSubmittingProject"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {{
                isSubmittingProject
                  ? t("projectHub.submitting")
                  : t("projectHub.create")
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick, onMounted } from "vue";
import { t } from "~/lib/i18n";
import {
  projectApi,
  type ProjectItem as Project,
} from "~/lib/api/modules/projects";
import { buildUrl } from "~/lib/utils/paths";
import ProjectProgressBar from "./ProjectProgressBar.vue";

// ==================== 类型 ====================
interface ApplyForm {
  nickname: string;
  progress: string;
  group: string;
  applyIncubator: boolean;
  contact: string;
}

interface ProjectForm {
  name: string;
  description: string;
  roles: string;
  contact: string;
  // 招募模块（P0）
  recruitEnabled: boolean;
  selectedRoles: string[];
  requirements: string;
  headcount: number | null;
  deadline: string;
}

// 可选招募岗位（P0 示例 chip）
const RECRUIT_ROLE_OPTIONS = [
  "算法工程师",
  "数据分析师",
  "论文撰写",
  "前端开发",
  "硬件调试",
  "UI 设计",
];

// ==================== 校验工具 ====================
const isValidPhone = (v: string): boolean => /^1[3-9]\d{9}$/.test(v);
const isValidEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidContact = (v: string): boolean =>
  isValidPhone(v) || isValidEmail(v);
const sanitizeInput = (v: string): string => v.replace(/<[^>]*>/g, "").trim();

// ==================== Toast（无 alert / any） ====================
const toast = {
  success: (m: string) => {
    const el = document.createElement("div");
    el.textContent = m;
    Object.assign(el.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "#16a34a",
      color: "white",
      padding: "8px 14px",
      borderRadius: "8px",
      zIndex: "9999",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  },
  error: (m: string) => {
    const el = document.createElement("div");
    el.textContent = m;
    Object.assign(el.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "#dc2626",
      color: "white",
      padding: "8px 14px",
      borderRadius: "8px",
      zIndex: "9999",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  },
};

// ==================== Tab & 列表 ====================
const tabs = [
  { key: "recruiting" as const, label: "projectHub.tabRecruiting" },
  { key: "showcase" as const, label: "projectHub.tabShowcase" },
];

const activeTab = ref<"recruiting" | "showcase">("recruiting");
// 「仅看招募中」快捷筛选（P0）：只保留正在招募且未结项的项目
const onlyRecruiting = ref(false);
const allProjects = ref<Project[]>([]);
const loading = ref(true);

onMounted(async () => {
  if (window.location.hash === "#create") openProjectModal();
  allProjects.value = await projectApi.listProjects();
  loading.value = false;
});

const filteredProjects = computed<Project[]>(() =>
  allProjects.value
    .filter((p) => p.type === activeTab.value)
    .filter((p) => (onlyRecruiting.value ? p.isRecruiting : true))
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)),
);

// ==================== 模态框1：发言 / 报名 ====================
const showApplyModal = ref(false);
const isSubmittingApply = ref(false);
const applyModalRootRef = ref<HTMLElement | null>(null);

const applyForm = reactive<ApplyForm>({
  nickname: "",
  progress: "",
  group: "",
  applyIncubator: false,
  contact: "",
});

const applyErrors = reactive<
  Record<keyof Omit<ApplyForm, "applyIncubator">, string>
>({
  nickname: "",
  progress: "",
  group: "",
  contact: "",
});

const validateApplyField = (field: keyof typeof applyErrors): void => {
  if (field === "nickname") {
    const v = applyForm.nickname.trim();
    applyErrors.nickname = !v
      ? t("projectHub.errNicknameRequired")
      : v.length < 2
        ? t("projectHub.errNicknameMinLength")
        : /[<>/]/.test(v)
          ? t("projectHub.errNicknameInvalid")
          : "";
  }
  if (field === "progress")
    applyErrors.progress = applyForm.progress
      ? ""
      : t("projectHub.errProgressRequired");
  if (field === "group")
    applyErrors.group = applyForm.group ? "" : t("projectHub.errGroupRequired");
  if (field === "contact") {
    if (!applyForm.applyIncubator) {
      applyErrors.contact = "";
      return;
    }
    const v = applyForm.contact.trim();
    applyErrors.contact = !v
      ? t("projectHub.errContactRequired")
      : !isValidContact(v)
        ? t("projectHub.errContactInvalid")
        : "";
  }
};

const openApplyModal = () => {
  showApplyModal.value = true;
};

const closeApplyModal = () => {
  // 提交进行中不许关闭：关掉会把标志复位，模态框可再打开并重复提交。
  // 成功路径请先自行置 isSubmittingApply = false 再调用本函数。
  if (isSubmittingApply.value) return;
  showApplyModal.value = false;
  applyForm.nickname =
    applyForm.progress =
    applyForm.group =
    applyForm.contact =
      "";
  applyForm.applyIncubator = false;
  Object.keys(applyErrors).forEach(
    (k) => (applyErrors[k as keyof typeof applyErrors] = ""),
  );
};

const handleApplySubmit = async (): Promise<void> => {
  (["nickname", "progress", "group", "contact"] as const).forEach(
    validateApplyField,
  );
  if (Object.values(applyErrors).some(Boolean)) return;
  isSubmittingApply.value = true;
  try {
    const ok = await projectApi.submitApplication({
      title: `${applyForm.group} 项目组申请`,
      summary: `阶段：${applyForm.progress}`,
      // 联系方式只在「申请孵化」时采集并校验（validateApplyField 在非孵化分支直接跳过校验），
      // 之前无条件写进 description，会把空值/未校验内容带进申请记录
      description: [
        `报名成员：${sanitizeInput(applyForm.nickname)}。`,
        applyForm.applyIncubator && applyForm.contact.trim()
          ? `联系方式：${sanitizeInput(applyForm.contact)}。`
          : "",
        applyForm.applyIncubator ? "申请孵化。" : "",
      ].join(""),
      memberClaims: [
        {
          displayName: sanitizeInput(applyForm.nickname),
          roleInProject: applyForm.progress,
        },
      ],
    });
    if (!ok) throw new Error(t("projectHub.applyFailed"));
    toast.success(t("projectHub.applySuccess"));
    // closeApplyModal 在提交中会拒绝关闭，成功时先落标志再关
    isSubmittingApply.value = false;
    closeApplyModal();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : t("projectHub.applyFailed");
    toast.error(msg);
  } finally {
    isSubmittingApply.value = false;
  }
};

// ==================== 模态框2：发起项目 ====================
const showProjectModal = ref(false);
const isSubmittingProject = ref(false);
const projectModalRootRef = ref<HTMLElement | null>(null);

const projectForm = reactive<ProjectForm>({
  name: "",
  description: "",
  roles: "",
  contact: "",
  recruitEnabled: false,
  selectedRoles: [],
  requirements: "",
  headcount: null,
  deadline: "",
});
const projectErrors = reactive<
  Record<"name" | "description" | "contact", string>
>({
  name: "",
  description: "",
  contact: "",
});

const validateProjectField = (field: keyof typeof projectErrors): void => {
  // 长度上限由输入框的 maxlength（name 20 / description 200）保证，
  // 这里原来的 >50 / >200 分支永远不可达，已删除
  if (field === "name") {
    const v = projectForm.name.trim();
    projectErrors.name = !v
      ? t("projectHub.errNameRequired")
      : /[<>/]/.test(v)
        ? t("projectHub.errNameInvalid")
        : "";
  }
  if (field === "description") {
    const v = projectForm.description.trim();
    projectErrors.description = !v ? t("projectHub.errDescRequired") : "";
  }
  if (field === "contact") {
    const v = projectForm.contact.trim();
    projectErrors.contact = !v
      ? t("projectHub.errContactRequired")
      : !isValidContact(v)
        ? t("projectHub.errContactInvalid")
        : "";
  }
};

const openProjectModal = () => {
  showProjectModal.value = true;
};

// 招募岗位 chip 多选切换（P0）
const toggleRoleChip = (role: string): void => {
  const idx = projectForm.selectedRoles.indexOf(role);
  if (idx >= 0) projectForm.selectedRoles.splice(idx, 1);
  else projectForm.selectedRoles.push(role);
};

const closeProjectModal = () => {
  // 同 closeApplyModal：提交中不许关闭，避免复位标志后重复提交
  if (isSubmittingProject.value) return;
  showProjectModal.value = false;
  projectForm.name =
    projectForm.description =
    projectForm.roles =
    projectForm.contact =
      "";
  projectForm.recruitEnabled = false;
  projectForm.selectedRoles = [];
  projectForm.requirements = "";
  projectForm.headcount = null;
  projectForm.deadline = "";
  Object.keys(projectErrors).forEach(
    (k) => (projectErrors[k as keyof typeof projectErrors] = ""),
  );
};

const handleProjectSubmit = async (): Promise<void> => {
  (["name", "description", "contact"] as const).forEach(validateProjectField);
  if (Object.values(projectErrors).some(Boolean)) return;
  isSubmittingProject.value = true;
  try {
    // contact/roles 是必填/已采集数据，不能丢：接口没有对应字段，
    // 按申请模态框的既有做法把它们并入 description 文本
    const recruitLines: string[] = [];
    if (projectForm.recruitEnabled) {
      if (projectForm.selectedRoles.length)
        recruitLines.push(
          `招募岗位：${projectForm.selectedRoles.join("、")}`,
        );
      if (projectForm.requirements.trim())
        recruitLines.push(
          `能力要求：${sanitizeInput(projectForm.requirements)}`,
        );
      if (projectForm.headcount)
        recruitLines.push(`招募人数：${projectForm.headcount} 人`);
      if (projectForm.deadline)
        recruitLines.push(`截止时间：${projectForm.deadline}`);
    }
    const extras = [
      projectForm.roles.trim()
        ? `需要角色：${sanitizeInput(projectForm.roles)}`
        : "",
      ...recruitLines,
      `联系方式：${sanitizeInput(projectForm.contact)}`,
    ].filter(Boolean);
    const ok = await projectApi.submitApplication({
      title: sanitizeInput(projectForm.name),
      summary: sanitizeInput(projectForm.description),
      description: [sanitizeInput(projectForm.description), ...extras].join(
        "\n",
      ),
      memberClaims: [],
    });
    if (!ok) throw new Error(t("projectHub.createFailed"));
    toast.success(t("projectHub.createSuccess"));
    // closeProjectModal 在提交中会拒绝关闭，成功时先落标志再关
    isSubmittingProject.value = false;
    closeProjectModal();
    // 发起成功后刷新广场列表
    allProjects.value = await projectApi.listProjects();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : t("projectHub.createFailed");
    toast.error(msg);
  } finally {
    isSubmittingProject.value = false;
  }
};

// ============================================================
// 焦点管理：模态框打开时自动聚焦到第一个输入框（喵，用户体验最大喵，所以用户打钱！）
// ============================================================
watch(
  () => applyModalRootRef.value,
  async (el) => {
    if (el) {
      await nextTick();
      const firstInput =
        el.querySelector<HTMLInputElement>('input[type="text"]');
      firstInput?.focus();
    }
  },
  { immediate: true },
);

watch(
  () => projectModalRootRef.value,
  async (el) => {
    if (el) {
      await nextTick();
      const firstInput =
        el.querySelector<HTMLInputElement>('input[type="text"]');
      firstInput?.focus();
    }
  },
  { immediate: true },
);
</script>

<!-- ============================================================
  维护备注（请保持与代码现状一致）：
  - 置顶排序逻辑在 filteredProjects 中
  - 联系方式校验仅在申请孵化时触发
  - 数据已接 projectApi（submitApplication 等），不再是 mock
  - Toast 使用组件内的自定义 toast（非 alert）
-->
