<template>
  <!-- Teleport + Transition 在 SSR 水合时会产生节点结构 mismatch（注释 vs 文本）。
       mounted 前不渲染 Teleport，客户端水合一致，onMounted 后再挂载。 -->
  <Teleport v-if="mounted" to="body">
    <!-- 提问弹窗 -->
    <Transition name="qa-modal">
      <div
        v-if="show"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="t('page.qa.askAria')"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="requestClose"
        ></div>

        <div
          class="qa-card relative z-10 w-full max-w-lg flex flex-col max-h-[85vh] bg-card-bg rounded-[var(--radius-large)] border border-surface-3 shadow-xl dark:shadow-none"
        >
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-surface-3 shrink-0"
          >
            <h3 class="text-lg font-semibold text-deep-text">
              {{ t("page.qa.ask") }}
            </h3>
            <button
              type="button"
              class="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-deep-text hover:bg-surface-3 transition-colors"
              :aria-label="t('page.qa.closeAria')"
              @click="requestClose"
            >
              ✕
            </button>
          </div>

          <div class="px-6 py-5 space-y-4 overflow-y-auto">
            <p v-if="createdQuestionId" class="text-sm text-primary">
              {{ t("page.qa.imagesPending") }}
              <a
                :href="buildUrl(`/qa/${createdQuestionId}`)"
                class="underline"
                >{{ t("page.qa.viewQuestion") }}</a
              >
            </p>
            <div>
              <label class="block text-sm font-medium text-deep-text mb-1.5">{{
                t("page.qa.titleLabel")
              }}</label>
              <input
                v-model="formModel.title"
                :disabled="!!createdQuestionId"
                class="qa-input"
                :placeholder="t('page.qa.titlePlaceholder')"
                @input="clearError('title')"
              />
              <p v-if="errors.title" class="mt-1 text-xs text-error">
                {{ errors.title }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-deep-text mb-1.5">{{
                t("page.qa.situationLabel")
              }}</label>
              <textarea
                v-model="formModel.situation"
                :disabled="!!createdQuestionId"
                rows="3"
                class="qa-input resize-none"
                :placeholder="t('page.qa.situationPlaceholder')"
                @input="clearError('situation')"
              ></textarea>
              <p v-if="errors.situation" class="mt-1 text-xs text-error">
                {{ errors.situation }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-deep-text mb-1.5">{{
                t("page.qa.detailLabel")
              }}</label>
              <textarea
                v-model="formModel.detail"
                :disabled="!!createdQuestionId"
                rows="5"
                class="qa-input resize-none"
                :placeholder="t('page.qa.detailPlaceholder')"
                @input="clearError('detail')"
                @paste="onPaste"
                @dragover.prevent
                @drop.prevent="onDrop"
              ></textarea>
              <p v-if="errors.detail" class="mt-1 text-xs text-error">
                {{ errors.detail }}
              </p>

              <button
                type="button"
                :disabled="!!createdQuestionId"
                class="btn btn-ghost btn-sm mt-2"
                @click="triggerFilePicker"
              >
                {{ t("page.qa.insertImage") }}
              </button>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="onFileChange"
              />

              <div
                v-if="formModel.images.length"
                class="grid grid-cols-3 gap-2 mt-2"
              >
                <div
                  v-for="ref in formModel.images"
                  :key="ref"
                  class="group relative aspect-square rounded-[var(--radius-md)] overflow-hidden border border-surface-3 bg-base-200"
                >
                  <img
                    :src="imageUrls[ref] ?? ''"
                    class="w-full h-full object-cover"
                    :alt="t('page.qa.imageAlt')"
                  />
                  <button
                    type="button"
                    class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    :aria-label="t('page.qa.removeImage')"
                    @click="removeImage(ref)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <label
              v-if="!createdQuestionId"
              class="flex items-center gap-2 text-sm font-medium text-deep-text"
            >
              <input v-model="formModel.bountyEnabled" type="checkbox" />
              {{ t("page.qa.bountyEnableLabel") }}
            </label>

            <div
              v-if="formModel.bountyEnabled && !createdQuestionId"
              class="grid grid-cols-2 gap-4"
            >
              <div>
                <label
                  class="block text-sm font-medium text-deep-text mb-1.5"
                  >{{ t("page.qa.bountyPeopleLabel") }}</label
                >
                <input
                  :value="formModel.bountyPeople ?? ''"
                  type="number"
                  min="1"
                  step="1"
                  class="qa-input"
                  :placeholder="t('page.qa.bountyMinPlaceholder')"
                  @input="onBountyPeopleInput"
                />
                <p v-if="errors.bountyPeople" class="mt-1 text-xs text-error">
                  {{ errors.bountyPeople }}
                </p>
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-deep-text mb-1.5"
                  >{{ t("page.qa.bountyPerPersonLabel") }}</label
                >
                <input
                  :value="formModel.bountyPerPerson ?? ''"
                  type="number"
                  min="1"
                  step="1"
                  class="qa-input"
                  :placeholder="t('page.qa.bountyMinPlaceholder')"
                  @input="onBountyPerPersonInput"
                />
                <p
                  v-if="errors.bountyPerPerson"
                  class="mt-1 text-xs text-error"
                >
                  {{ errors.bountyPerPerson }}
                </p>
              </div>
            </div>

            <div
              v-if="formModel.bountyEnabled && !createdQuestionId"
              class="space-y-3"
            >
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="amount in [10, 50, 100]"
                  :key="amount"
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="formModel.bountyPerPerson = amount"
                >
                  {{ amount }} {{ t("page.qa.points") }}
                </button>
              </div>
              <label class="block text-sm text-deep-text">
                {{ t("page.qa.bountyDaysLabel") }}
                <select
                  v-model.number="formModel.bountyDays"
                  class="qa-input mt-1"
                >
                  <option :value="7">7</option>
                  <option :value="14">14</option>
                  <option :value="30">30</option>
                  <option :value="90">90</option>
                </select>
              </label>
              <label
                v-if="formModel.bountyDays === 7"
                class="flex items-center gap-2 text-sm text-deep-text"
              >
                <input v-model="formModel.urgent" type="checkbox" />
                {{ t("page.qa.urgentLabel") }}
              </label>
              <p class="text-xs text-text-muted">
                {{ t("page.qa.bountyMaxHint") }}
              </p>
            </div>

            <div
              v-if="formModel.bountyEnabled && !createdQuestionId"
              class="flex items-center justify-between text-sm pt-1"
            >
              <span class="text-text-muted">{{
                t("page.qa.totalBountyLabel")
              }}</span>
              <span class="font-semibold text-amber-500"
                >{{ totalBounty }} {{ t("page.qa.points") }}</span
              >
            </div>
            <p
              v-if="
                formModel.bountyEnabled &&
                !createdQuestionId &&
                balance !== null
              "
              class="text-xs text-text-muted"
            >
              {{ t("page.qa.availablePoints", { count: balance }) }}
            </p>
            <p v-if="bountyError" class="text-xs text-error" role="alert">
              {{ bountyError }}
            </p>
          </div>

          <div
            class="flex justify-end gap-3 px-6 py-4 border-t border-surface-3 shrink-0"
          >
            <button
              v-if="!createdQuestionId"
              type="button"
              class="btn btn-ghost"
              @click="handleSaveDraft"
            >
              {{ t("page.qa.saveDraft") }}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="publishing || !!bountyError"
              @click="handlePublish"
            >
              {{
                createdQuestionId
                  ? t("page.qa.finishImages")
                  : t("common.publish")
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="qa-fade">
      <div
        v-if="confirmOpen"
        class="fixed inset-0 z-[110] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="t('page.qa.exitConfirmAria')"
      >
        <div
          class="absolute inset-0 bg-black/50"
          @click="confirmOpen = false"
        ></div>
        <div
          class="relative z-10 w-full max-w-sm bg-card-bg rounded-[var(--radius-large)] border border-surface-3 shadow-xl dark:shadow-none p-6"
        >
          <p class="text-deep-text font-medium leading-relaxed">
            {{ t("page.qa.exitConfirmMessage") }}
          </p>
          <div class="flex justify-end gap-3 mt-5">
            <button
              type="button"
              class="btn btn-ghost"
              @click="confirmOpen = false"
            >
              {{ t("page.qa.exitConfirmKeep") }}
            </button>
            <button type="button" class="btn btn-primary" @click="confirmExit">
              {{ t("page.qa.exitConfirmExit") }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="qa-toast">
      <div
        v-if="toast"
        class="fixed top-6 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-[var(--radius-md)] text-sm text-card-bg bg-deep-text shadow-lg"
      >
        {{ toast }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { t } from "~/lib/i18n";
import { qaApi } from "~/lib/api/modules/qa";
import { pointsApi } from "~/lib/api/modules/points";
import { buildUrl } from "~/lib/utils/paths";
import {
  QA_DRAFT_STORAGE_KEY,
  computeTotalBounty,
  parseDraft,
  serializeDraft,
} from "../lib/draft";
import type { QaDraft } from "../lib/draft";
import {
  deleteImageBlobs,
  getImageBlob,
  resolveImageSrc,
  saveImageBlob,
} from "../../editor/persistence/image-store";

const props = defineProps<{
  show: boolean;
  category?: "help" | "volunteer";
}>();
const emit = defineEmits<{
  "update:show": [value: boolean];
  published: [];
}>();

type FieldKey = keyof QaDraft;

const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const QA_PENDING_QUESTION_KEY = "lkm-qa-pending-question";

const formModel = reactive<QaDraft>({
  title: "",
  situation: "",
  detail: "",
  bountyEnabled: false,
  bountyPeople: null,
  bountyPerPerson: null,
  bountyDays: 7,
  urgent: false,
  images: [],
});

const errors = reactive<Record<FieldKey, string>>({
  title: "",
  situation: "",
  detail: "",
  bountyEnabled: "",
  bountyPeople: "",
  bountyPerPerson: "",
  bountyDays: "",
  urgent: "",
  images: "",
});

const imageUrls = reactive<Record<string, string>>({});
// IndexedDB 读取是异步的：中途若发生重置/重新打开，本轮结果必须丢弃，
// 否则会把已清空的条目又写回 imageUrls。声明须在下面的 immediate watch 之前（会被 resetForm 用到）
let refreshToken = 0;
const fileInputRef = ref<HTMLInputElement | null>(null);

const confirmOpen = ref(false);
const toast = ref<string | null>(null);
const mounted = ref(false);
const publishing = ref(false);
const createdQuestionId = ref<string | null>(null);
const balance = ref<number | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const totalBounty = computed<number>(() =>
  formModel.bountyEnabled
    ? computeTotalBounty(formModel.bountyPeople, formModel.bountyPerPerson)
    : 0,
);
const bountyError = computed(() => {
  if (!formModel.bountyEnabled || createdQuestionId.value) return "";
  if (totalBounty.value > 1000) return t("page.qa.bountyTooHigh");
  if (balance.value !== null && totalBounty.value > balance.value)
    return t("page.qa.insufficientPoints");
  return "";
});
watch(
  () => formModel.bountyDays,
  (days) => {
    if (days !== 7) formModel.urgent = false;
  },
);

// 打开前的 body overflow 先存下来：直接置 "" 会连带解掉同页其它浮层的滚动锁
let prevBodyOverflow = "";
let bodyLocked = false;

function unlockBody(): void {
  if (!bodyLocked) return;
  document.body.style.overflow = prevBodyOverflow;
  bodyLocked = false;
}

watch(
  () => props.show,
  (open) => {
    if (open) {
      void loadBalance();
      clearErrors();
      if (!createdQuestionId.value) {
        const draft = loadDraft();
        if (draft) {
          const pending = localStorage.getItem(QA_PENDING_QUESTION_KEY);
          if (pending && /^[0-9a-f-]{36}$/i.test(pending))
            createdQuestionId.value = pending;
          Object.assign(formModel, draft);
          void refreshImageUrls();
        } else {
          resetForm();
        }
      }
      if (!bodyLocked) {
        prevBodyOverflow = document.body.style.overflow;
        bodyLocked = true;
      }
      document.body.style.overflow = "hidden";
    } else {
      unlockBody();
      confirmOpen.value = false;
    }
  },
  // immediate：mounted 时 props.show 已经是 true 的情况（Teleport 只由 mounted 控制），
  // 不加就永远不会加载草稿、也不会锁 body 滚动
  { immediate: true },
);

onMounted(() => {
  mounted.value = true;
  document.addEventListener("keydown", onKeydown);
});
onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown);
  unlockBody();
  if (toastTimer) clearTimeout(toastTimer);
});

function onKeydown(e: KeyboardEvent): void {
  if (e.key !== "Escape") return;
  if (confirmOpen.value) {
    confirmOpen.value = false;
  } else if (props.show) {
    requestClose();
  }
}

async function loadBalance(): Promise<void> {
  const result = await pointsApi.getBalance();
  balance.value = result.isOk() ? result.value.balance : null;
}

function resetForm(): void {
  // 让进行中的 refreshImageUrls 作废，避免它把旧条目写回已清空的表单
  refreshToken++;
  formModel.title = "";
  formModel.situation = "";
  formModel.detail = "";
  formModel.bountyEnabled = false;
  formModel.bountyPeople = null;
  formModel.bountyPerPerson = null;
  formModel.bountyDays = 7;
  formModel.urgent = false;
  formModel.images = [];
  Object.keys(imageUrls).forEach((key) => delete imageUrls[key]);
  clearErrors();
}

function clearErrors(): void {
  (Object.keys(errors) as FieldKey[]).forEach((key) => {
    errors[key] = "";
  });
}

function clearError(key: FieldKey): void {
  errors[key] = "";
}

function loadDraft(): QaDraft | null {
  return parseDraft(localStorage.getItem(QA_DRAFT_STORAGE_KEY));
}

function saveDraft(): void {
  localStorage.setItem(QA_DRAFT_STORAGE_KEY, serializeDraft(formModel));
}

function clearDraft(): void {
  localStorage.removeItem(QA_DRAFT_STORAGE_KEY);
}

function parseNumber(e: Event): number | null {
  const value = (e.target as HTMLInputElement).value;
  if (value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function onBountyPeopleInput(e: Event): void {
  formModel.bountyPeople = parseNumber(e);
  clearError("bountyPeople");
}

function onBountyPerPersonInput(e: Event): void {
  formModel.bountyPerPerson = parseNumber(e);
  clearError("bountyPerPerson");
}

function isPositiveInt(value: number | null): boolean {
  return value !== null && Number.isInteger(value) && value >= 1;
}

function validate(): boolean {
  clearErrors();
  if (!createdQuestionId.value) {
    if (!formModel.title.trim()) errors.title = t("page.qa.titleRequired");
    if (!formModel.situation.trim())
      errors.situation = t("page.qa.situationRequired");
    if (!formModel.detail.trim()) errors.detail = t("page.qa.detailRequired");
  }
  if (formModel.bountyEnabled && !createdQuestionId.value) {
    if (!isPositiveInt(formModel.bountyPeople) || formModel.bountyPeople! > 10)
      errors.bountyPeople = t("page.qa.bountyPeopleInvalid");
    if (!isPositiveInt(formModel.bountyPerPerson))
      errors.bountyPerPerson = t("page.qa.bountyPerPersonInvalid");
    if (bountyError.value) errors.bountyPerPerson = bountyError.value;
  }
  return Object.values(errors).every((message) => message === "");
}

function triggerFilePicker(): void {
  fileInputRef.value?.click();
}

function onFileChange(e: Event): void {
  const input = e.target as HTMLInputElement;
  if (input.files) void addFiles(Array.from(input.files));
  input.value = "";
}

function onPaste(e: ClipboardEvent): void {
  const files = Array.from(e.clipboardData?.files ?? []).filter((file) =>
    file.type.startsWith("image/"),
  );
  if (files.length) {
    e.preventDefault();
    void addFiles(files);
  }
}

function onDrop(e: DragEvent): void {
  const files = Array.from(e.dataTransfer?.files ?? []).filter((file) =>
    file.type.startsWith("image/"),
  );
  if (files.length) void addFiles(files);
}

async function addFiles(files: File[]): Promise<void> {
  for (const file of files) {
    if (formModel.images.length >= MAX_IMAGES) {
      showToast(t("page.qa.maxImagesToast", { count: MAX_IMAGES }));
      break;
    }
    const error = validateImageFile(file);
    if (error) {
      showToast(error);
      continue;
    }
    await addImageFile(file);
    // await 期间可能有并发的 addFiles（粘贴 + 拖拽）已经加过图，必须复查上限
    if (formModel.images.length >= MAX_IMAGES) {
      showToast(t("page.qa.maxImagesToast", { count: MAX_IMAGES }));
      break;
    }
  }
}

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return t("page.qa.imageOnlyToast");
  if (file.size > MAX_IMAGE_SIZE_BYTES) return t("page.qa.imageTooLargeToast");
  return null;
}

async function addImageFile(file: File): Promise<void> {
  if (createdQuestionId.value) return;
  try {
    const ref = await saveImageBlob(file);
    const url = await resolveImageSrc(ref);
    if (!url) {
      // blob 已不存在（被清理或并发删除）：不入列表，避免渲染出一个空图框
      await deleteImageBlobs([ref]).catch(() => {});
      showToast(t("common.loadFailed"));
      return;
    }
    imageUrls[ref] = url;
    formModel.images.push(ref);
  } catch (e) {
    console.warn("[AskQuestionModal] 保存图片失败:", e);
    showToast(t("common.loadFailed"));
  }
}

async function removeImage(ref: string): Promise<void> {
  formModel.images = formModel.images.filter((item) => item !== ref);
  delete imageUrls[ref];
  try {
    await deleteImageBlobs([ref]);
  } catch (e) {
    console.warn("[AskQuestionModal] 删除图片失败:", e);
  }
}

async function refreshImageUrls(): Promise<void> {
  const token = ++refreshToken;
  Object.keys(imageUrls).forEach((key) => delete imageUrls[key]);
  for (const ref of formModel.images) {
    let url = "";
    try {
      url = await resolveImageSrc(ref);
    } catch (e) {
      console.warn("[AskQuestionModal] 读取图片失败:", e);
    }
    if (token !== refreshToken) return;
    if (url) imageUrls[ref] = url;
  }
}

function handleSaveDraft(): void {
  saveDraft();
  showToast(t("page.qa.draftSavedToast"));
}

async function handlePublish(): Promise<void> {
  if (publishing.value || !validate()) return;
  publishing.value = true;
  const refs = [...formModel.images];
  try {
    if (!createdQuestionId.value) {
      const created = await qaApi.createQuestion({
        title: formModel.title,
        situation: formModel.situation,
        content: formModel.detail,
        category: props.category ?? "help",
        bountyPeople: formModel.bountyEnabled
          ? (formModel.bountyPeople ?? 1)
          : 1,
        bountyPerPerson: formModel.bountyEnabled
          ? (formModel.bountyPerPerson ?? 0)
          : 0,
        bountyDays: formModel.bountyDays,
        urgent: formModel.bountyEnabled && formModel.urgent,
      });
      if (!created) throw new Error("question creation failed");
      createdQuestionId.value = created.id;
      localStorage.setItem(QA_PENDING_QUESTION_KEY, created.id);
      saveDraft();
    }
    const uploaded: string[] = [];
    for (const ref of refs) {
      try {
        const blob = await getImageBlob(ref);
        if (
          blob &&
          (await qaApi.uploadImage(createdQuestionId.value, ref.slice(4), blob))
        )
          uploaded.push(ref);
      } catch {
        // Keep the local image for a retry; the question itself is already published.
      }
    }
    formModel.images = refs.filter((ref) => !uploaded.includes(ref));
    await deleteImageBlobs(uploaded).catch(() => {});
    if (formModel.images.length) {
      saveDraft();
      emit("published");
      showToast(t("page.qa.imageUploadFailed"));
      return;
    }
  } catch (e) {
    console.warn("[AskQuestionModal] 发布失败:", e);
    showToast(t("page.qa.actionFailed"));
    return;
  } finally {
    publishing.value = false;
  }
  createdQuestionId.value = null;
  localStorage.removeItem(QA_PENDING_QUESTION_KEY);
  clearDraft();
  resetForm();
  showToast(t("page.qa.publishedToast"));
  emit("published");
  emit("update:show", false);
}

function requestClose(): void {
  if (createdQuestionId.value) {
    emit("update:show", false);
    return;
  }
  confirmOpen.value = true;
}

function confirmExit(): void {
  confirmOpen.value = false;
  emit("update:show", false);
}

function showToast(message: string): void {
  toast.value = message;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 2000);
}
</script>

<style scoped>
.qa-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-3);
  background: var(--card-bg);
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--deep-text);
  outline: none;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.qa-input::placeholder {
  color: var(--text-muted);
}

.qa-input:focus {
  border-color: var(--primary);
}

.qa-modal-enter-active,
.qa-modal-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}

.qa-modal-enter-active .qa-card {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.qa-modal-leave-active .qa-card {
  transition:
    opacity var(--duration-fast) var(--ease-in-out),
    transform var(--duration-fast) var(--ease-in-out);
}

.qa-modal-enter-from,
.qa-modal-leave-to {
  opacity: 0;
}

.qa-modal-enter-from .qa-card {
  opacity: 0;
  transform: scale(0.96) translateY(10px);
}

.qa-modal-leave-to .qa-card {
  opacity: 0;
  transform: scale(0.98);
}

.qa-fade-enter-active,
.qa-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.qa-fade-enter-from,
.qa-fade-leave-to {
  opacity: 0;
}

.qa-toast-enter-active,
.qa-toast-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.qa-toast-enter-from,
.qa-toast-leave-to {
  opacity: 0;
}
</style>
