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
    <div class="flex items-center gap-2 border-b border-surface-3">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-4 py-3 text-sm font-medium transition-colors relative"
        :class="
          activeTab === tab.key
            ? 'text-primary'
            : 'text-text-muted hover:text-deep-text'
        "
        @click="activeTab = tab.key"
      >
        {{ t(tab.label) }}
        <div
          v-if="activeTab === tab.key"
          class="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
        />
      </button>

      <div class="ml-auto flex gap-2">
        <button
          :aria-label="t('projectHub.applyAria')"
          class="px-4 py-2 text-sm font-medium rounded-xl backdrop-blur-md bg-white/30 border border-white/40 text-black shadow-md hover:bg-white/50 hover:border-amber-400/70 hover:scale-105 hover:shadow-lg transition-all duration-300"
          @click="openApplyModal"
        >
          {{ t("projectHub.apply") }}
        </button>
        <button
          :aria-label="t('projectHub.createAria')"
          class="px-4 py-2 text-sm font-medium rounded-xl backdrop-blur-md bg-white/30 border border-white/40 text-black shadow-md hover:bg-white/50 hover:border-amber-400/70 hover:scale-105 hover:shadow-lg transition-all duration-300"
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
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <a
        v-for="proj in filteredProjects"
        :key="proj.id"
        :href="buildUrl(`/projects/${proj.id}`)"
        class="profile-card group block"
      >
        <div class="profile-inner p-5 flex flex-col gap-2.5 h-full">
          <div class="flex items-center gap-2">
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
          </div>
          <h3
            class="font-bold text-deep-text group-hover:text-primary transition-colors"
          >
            {{ proj.title }}
          </h3>
          <p class="text-xs text-text-muted">
            {{ t("projectHub.initiatedBy", { name: proj.applicantName }) }}
          </p>
          <div class="mt-1">
            <div class="h-1.5 rounded-full bg-surface-3">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: proj.progress + '%' }"
              />
            </div>
          </div>
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
}

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
const allProjects = ref<Project[]>([]);
const loading = ref(true);

onMounted(async () => {
  allProjects.value = await projectApi.listProjects();
  loading.value = false;
});

const filteredProjects = computed<Project[]>(() =>
  allProjects.value
    .filter((p) => p.type === activeTab.value)
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
  showApplyModal.value = false;
  isSubmittingApply.value = false;
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
      description: `报名成员：${sanitizeInput(applyForm.nickname)}。联系方式：${sanitizeInput(applyForm.contact)}${applyForm.applyIncubator ? "。申请孵化。" : ""}`,
      memberClaims: [
        {
          displayName: sanitizeInput(applyForm.nickname),
          roleInProject: applyForm.progress,
        },
      ],
    });
    if (!ok) throw new Error(t("projectHub.applyFailed"));
    toast.success(t("projectHub.applySuccess"));
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
});
const projectErrors = reactive<
  Record<"name" | "description" | "contact", string>
>({
  name: "",
  description: "",
  contact: "",
});

const validateProjectField = (field: keyof typeof projectErrors): void => {
  if (field === "name") {
    const v = projectForm.name.trim();
    projectErrors.name = !v
      ? t("projectHub.errNameRequired")
      : v.length > 50
        ? t("projectHub.errNameTooLong")
        : /[<>/]/.test(v)
          ? t("projectHub.errNameInvalid")
          : "";
  }
  if (field === "description") {
    const v = projectForm.description.trim();
    projectErrors.description = !v
      ? t("projectHub.errDescRequired")
      : v.length > 200
        ? t("projectHub.errDescTooLong")
        : "";
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

const closeProjectModal = () => {
  showProjectModal.value = false;
  isSubmittingProject.value = false;
  projectForm.name =
    projectForm.description =
    projectForm.roles =
    projectForm.contact =
      "";
  Object.keys(projectErrors).forEach(
    (k) => (projectErrors[k as keyof typeof projectErrors] = ""),
  );
};

const handleProjectSubmit = async (): Promise<void> => {
  (["name", "description", "contact"] as const).forEach(validateProjectField);
  if (Object.values(projectErrors).some(Boolean)) return;
  isSubmittingProject.value = true;
  try {
    const ok = await projectApi.submitApplication({
      title: sanitizeInput(projectForm.name),
      summary: sanitizeInput(projectForm.description),
      description: sanitizeInput(projectForm.description),
      memberClaims: [],
    });
    if (!ok) throw new Error(t("projectHub.createFailed"));
    toast.success(t("projectHub.createSuccess"));
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
  维护喵：比卡(月见八千代) (1175142856@qq.com)
  最后更新：2026-08-11凌晨四点....请项目组一定不要因为我实在是太菜了而开除我，球球了TAT
  有问题欢迎随时联系我～ 喵！这是我在本项目组的第一份独立完成工作，
  尤其感谢deepseek同志kimi同志通义千问同志对我的代码进行的深刻的改正
  虽然真的是非常小的功能但是考虑到了一些复杂的东西，如果有前端的大活随时找我，后端难之，但也可以）
  
  备注：
  - 置顶排序逻辑在 filteredProjects 中
  - 联系方式校验仅在申请孵化时触发
  - 当前使用 mock 数据，接入 API 后替换！辛苦后端同志了。在这里感谢一下
  - Toast 用 alert 临时替代，后续劳烦统一替换？
-->
