<template>
  <div class="space-y-6">
    <!-- 顶部常驻搜索栏 -->
    <div class="relative">
      <Icon
        icon="material-symbols:search"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none"
      />
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="t('community.fileLibrary.searchPlaceholder')"
        class="w-full pl-10 pr-9 py-2.5 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text placeholder:text-text-muted/60 focus:border-primary outline-none"
      />
      <button
        v-if="isSearching"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-deep-text hover:bg-surface-3 transition-colors"
        @click="searchQuery = ''"
        :title="t('community.fileLibrary.clearSearch')"
      >
        <Icon icon="material-symbols:close" class="w-4 h-4" />
      </button>
    </div>

    <!-- 面包屑 -->
    <FolderBreadcrumb :path="currentPath" @navigate="navigateBreadcrumb" />

    <!-- 文件夹层（根或非叶子，且非搜索态）：逐级下钻 -->
    <template v-if="isFolderLayer && !isSearching">
      <div v-if="childFolders.length > 0">
        <FolderGrid
          :folders="childFolders"
          :file-counts="folderFileCounts"
          @open="openFolder"
        />
      </div>
      <div v-else class="text-center py-12 text-sm text-text-muted">
        {{ t("community.fileLibrary.noSubcategories") }}
      </div>
    </template>

    <!-- 文件层（叶子，或全局搜索态）：筛选 + 列表/卡片；数据经 filteredFiles 已切到 searchResults -->
    <template v-else>
      <!-- 搜索态头标题（仅搜索时显示） -->
      <div v-if="isSearching" class="text-sm text-text-muted">
        {{
          t("community.fileLibrary.searchResults", {
            query: searchQuery,
            count: searchResults.length,
          })
        }}
      </div>
      <!-- 筛选器 -->
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="filterType"
          class="px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary outline-none"
        >
          <option value="">{{ t("community.fileLibrary.allTypes") }}</option>
          <option value="pdf">PDF</option>
          <option value="zip">{{ t("community.fileLibrary.zipType") }}</option>
          <option value="other">
            {{ t("community.fileLibrary.otherType") }}
          </option>
        </select>
        <select
          v-model="filterStatus"
          class="px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary outline-none"
        >
          <option value="">{{ t("community.fileLibrary.allStatuses") }}</option>
          <option value="approved">
            {{ t("community.fileLibrary.statusApproved") }}
          </option>
          <option value="pending">
            {{ t("community.fileLibrary.statusPending") }}
          </option>
          <option value="rejected">
            {{ t("community.fileLibrary.statusRejected") }}
          </option>
        </select>
        <select
          v-model="sortBy"
          class="px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary outline-none"
        >
          <option value="newest">
            {{ t("community.fileLibrary.sortNewest") }}
          </option>
          <option value="downloads">
            {{ t("community.fileLibrary.sortMostDownloaded") }}
          </option>
        </select>
        <div class="flex gap-1 ml-auto">
          <button
            class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            :class="
              viewMode === 'list'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-3 text-text-muted'
            "
            @click="viewMode = 'list'"
            :title="t('community.fileLibrary.listView')"
          >
            <Icon icon="material-symbols:list" class="w-5 h-5" />
          </button>
          <button
            class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            :class="
              viewMode === 'grid'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-3 text-text-muted'
            "
            @click="viewMode = 'grid'"
            :title="t('community.fileLibrary.cardView')"
          >
            <Icon icon="material-symbols:grid-view" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- 列表视图 -->
      <div
        v-if="viewMode === 'list'"
        class="bg-card-bg border border-surface-3 rounded-2xl overflow-hidden"
      >
        <div class="divide-y divide-surface-3">
          <div
            v-for="file in filteredFiles"
            :key="file.id"
            class="flex items-center gap-4 px-5 py-4 hover:bg-page-bg transition-colors"
          >
            <span class="text-2xl shrink-0">{{ fileIcon(file.mimeType) }}</span>
            <div class="flex-1 min-w-0">
              <a
                :href="buildUrl(`/files/${file.id}`)"
                class="font-medium text-deep-text hover:text-primary transition-colors line-clamp-1"
              >
                {{ file.originalName }}
              </a>
              <div
                class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-text-muted/60"
              >
                <span>{{ file.uploaderName }}</span>
                <span>{{ formatSize(file.size) }}</span>
                <span>{{
                  t("community.fileLibrary.downloadCount", {
                    count: file.downloadCount,
                  })
                }}</span>
                <span class="text-text-muted">{{ file.createdAt }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="statusClass(file.status)"
              >
                {{ statusLabel(file.status) }}
              </span>
              <!-- 仅 approved 文件提供预览/下载 -->
              <template v-if="file.status === 'approved'">
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-surface-3 text-deep-text hover:text-primary hover:border-primary/30 transition-colors"
                  @click="previewFile(file)"
                >
                  <Icon
                    icon="material-symbols:visibility-outline"
                    class="w-3.5 h-3.5 inline -mt-0.5 mr-1"
                  />
                  {{ t("community.fileLibrary.preview") }}
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-surface-3 text-deep-text hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="downloading.has(file.id)"
                  @click="downloadFile(file)"
                >
                  <Icon
                    :icon="
                      downloading.has(file.id)
                        ? 'material-symbols:progress-activity'
                        : 'material-symbols:download'
                    "
                    class="w-3.5 h-3.5 inline -mt-0.5 mr-1"
                    :class="downloading.has(file.id) ? 'animate-spin' : ''"
                  />
                  {{
                    downloading.has(file.id)
                      ? t("common.loading")
                      : t("community.fileLibrary.download")
                  }}
                </button>
              </template>
              <a
                :href="buildUrl(`/files/${file.id}`)"
                class="btn-primary px-3 py-1.5 rounded-lg text-xs font-medium"
                >{{ t("community.fileLibrary.viewDetails") }}</a
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a
          v-for="file in filteredFiles"
          :key="file.id"
          :href="buildUrl(`/files/${file.id}`)"
          class="bg-card-bg border border-surface-3 rounded-xl p-5 hover:border-primary/30 transition-colors group flex flex-col"
        >
          <div class="flex items-start gap-3 mb-3">
            <span class="text-3xl shrink-0">{{ fileIcon(file.mimeType) }}</span>
            <div class="flex-1 min-w-0">
              <h3
                class="font-semibold text-deep-text group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug"
              >
                {{ file.originalName }}
              </h3>
            </div>
          </div>
          <div class="text-xs text-text-muted/60 space-y-1 flex-1">
            <div>{{ file.uploaderName }} · {{ formatSize(file.size) }}</div>
            <div>
              {{
                t("community.fileLibrary.downloadCount", {
                  count: file.downloadCount,
                })
              }}
              · {{ file.createdAt }}
            </div>
          </div>
          <div
            class="flex items-center justify-between mt-3 pt-3 border-t border-surface-3"
          >
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :class="statusClass(file.status)"
            >
              {{ statusLabel(file.status) }}
            </span>
            <span class="text-xs text-primary font-medium">{{
              t("community.fileLibrary.viewDetails")
            }}</span>
          </div>
        </a>
      </div>

      <!-- 空状态 -->
      <div
        v-if="filteredFiles.length === 0"
        class="text-center py-12 text-sm text-text-muted"
      >
        {{ t("community.fileLibrary.noMatchingFiles") }}
      </div>
    </template>

    <!-- 上传按钮 -->
    <button
      class="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-on-primary shadow-xl hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center z-40"
      @click="showUpload = true"
    >
      <Icon icon="material-symbols:add" class="w-7 h-7" />
    </button>

    <!-- 上传弹窗 -->
    <Teleport v-if="mounted" to="body">
      <div
        v-if="showUpload"
        class="fixed inset-0 bg-black/40 dark:bg-black/70 z-[150] flex items-center justify-center"
        @click.self="closeUpload"
      >
        <div class="bg-card-bg rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-semibold text-deep-text mb-4">
            {{ t("community.fileLibrary.uploadTitle") }}
          </h3>
          <div class="space-y-4">
            <!-- 真文件选择：隐藏 input + 点击拖放区触发 -->
            <label
              class="border-2 border-dashed border-surface-3 rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer block"
            >
              <input
                ref="fileInputEl"
                type="file"
                class="hidden"
                :disabled="uploading"
                @change="onFileChange"
              />
              <Icon
                icon="material-symbols:cloud-upload-outline"
                class="w-10 h-10 text-text-muted/40 mx-auto mb-2"
              />
              <p class="text-sm text-text-muted">
                {{ t("community.fileLibrary.uploadDropHint") }}
              </p>
              <p class="text-xs text-text-muted/50 mt-1">
                {{ t("community.fileLibrary.uploadFormats") }}
              </p>
            </label>
            <p v-if="selectedFile" class="text-sm text-deep-text text-center">
              {{
                t("community.fileLibrary.selectedFile", {
                  name: selectedFile.name,
                  size: formatSize(selectedFile.size),
                })
              }}
            </p>
            <div>
              <label class="block text-sm font-medium text-deep-text mb-1">{{
                t("community.fileLibrary.categoryLabel")
              }}</label>
              <select
                v-model="uploadCategory"
                class="w-full px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary outline-none"
              >
                <option value="">
                  {{ t("community.fileLibrary.selectCategory") }}
                </option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ t(cat.name) }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-deep-text mb-1">{{
                t("community.fileLibrary.descriptionLabel")
              }}</label>
              <textarea
                v-model="uploadDesc"
                rows="2"
                class="w-full px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary outline-none resize-none"
                :placeholder="t('community.fileLibrary.descriptionPlaceholder')"
              ></textarea>
            </div>
          </div>
          <div class="flex gap-2 justify-end mt-4">
            <button
              class="btn-ghost px-4 py-2 rounded-lg text-sm"
              @click="closeUpload"
            >
              {{ t("community.fileLibrary.cancel") }}
            </button>
            <button
              class="btn-primary px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="uploading"
              @click="doUpload"
            >
              {{
                uploading
                  ? t("community.fileLibrary.statusPending")
                  : t("community.fileLibrary.submitUpload")
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import { fileLibraryApi } from "~/lib/api";
import type { FileEntry } from "~/lib/api/modules/file-library";
import { waitForUploadRegistration } from "~/lib/ws/upload-events";
import { forumCategories } from "../../forum/data/categories";
import {
  getChildren,
  getCategoryPath,
  isLeaf,
  countFilesInCategory,
} from "../data/category-tree";
import type { FileCategory } from "../data/category-tree";
import { searchFiles } from "../data/search";
import FolderBreadcrumb from "./FolderBreadcrumb.vue";
import FolderGrid from "./FolderGrid.vue";
import { buildUrl } from "~/lib/utils/paths";
import { t } from "~/lib/i18n";

const viewMode = ref<"list" | "grid">("list");
const filterType = ref("");
const filterStatus = ref("");
const sortBy = ref("newest");
const showUpload = ref(false);
// Teleport 在 SSR 水合时会产生节点结构 mismatch（注释 vs 文本）。
// mounted 前不渲染 Teleport，客户端水合一致，onMounted 后再挂载。
const mounted = ref(false);
const uploadCategory = ref("");
const uploadDesc = ref("");
// 上传态：所选文件 + 上传中标志（用于禁用/提示）
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
// 文件 input 的模板引用：关闭弹窗时要把 DOM 里的选择也清掉，否则再选同一个文件不会触发 change
const fileInputEl = ref<HTMLInputElement | null>(null);

// 文件全量数据：由后端 API 拉取（mock 已移入后端 seed）
const files = ref<FileEntry[]>([]);

// 拉取列表（上传成功后也走它刷新）
//
// getFiles 默认只取第 1 页 20 条，而本页的搜索、筛选、文件夹计数都对 files 全量在
// 前端计算，只取首屏会让超过 20 个文件后的统计与搜索结果静默缺失。
// 后端 PaginateDep 的 limit 上限是 100（Query(le=100)），传更大值会被拒，故按 100 翻页取全。
const FILE_PAGE_SIZE = 100;
const MAX_FILE_PAGES = 50; // 兜底上限，避免后端异常时无限翻页

async function loadFiles() {
  const all: FileEntry[] = [];
  for (let page = 1; page <= MAX_FILE_PAGES; page++) {
    const batch = await fileLibraryApi.getFiles(page, FILE_PAGE_SIZE);
    all.push(...batch);
    if (batch.length < FILE_PAGE_SIZE) break;
  }
  files.value = all;
}

onMounted(async () => {
  mounted.value = true;
  await loadFiles();
});

onBeforeUnmount(() => {
  // 卸载后定时器再动 blob URL 已无意义，清掉避免悬空回调
  if (previewRevokeTimer !== null) window.clearTimeout(previewRevokeTimer);
});

// 顶部常驻搜索栏
const searchQuery = ref("");
const isSearching = computed(() => searchQuery.value.trim() !== "");
const searchResults = computed(() =>
  searchFiles(files.value, searchQuery.value),
);

const categories = forumCategories.filter((c) => !c.parentId);

// 三级树状下钻状态：null 表示根（全部学科）
const currentId = ref<string | null>(null);

const currentPath = computed<FileCategory[]>(() =>
  currentId.value ? getCategoryPath(currentId.value) : [],
);
const childFolders = computed(() => getChildren(currentId.value ?? null));
const isFolderLayer = computed(
  () =>
    currentId.value === null ||
    (!isLeaf(currentId.value) && childFolders.value.length > 0),
);
const currentFiles = computed(() =>
  currentId.value
    ? files.value.filter((f) => f.categoryId === currentId.value)
    : [],
);
const folderFileCounts = computed<Record<string, number>>(() => {
  const m: Record<string, number> = {};
  for (const folder of childFolders.value)
    m[folder.id] = countFilesInCategory(folder.id, files.value);
  return m;
});

function openFolder(id: string) {
  currentId.value = id;
}

function navigateBreadcrumb(id: string | null) {
  currentId.value = id;
}

const filteredFiles = computed(() => {
  let files = isSearching.value
    ? [...searchResults.value]
    : [...currentFiles.value];
  if (filterType.value === "pdf")
    files = files.filter((f) => f.mimeType === "application/pdf");
  if (filterType.value === "zip")
    files = files.filter((f) => f.mimeType === "application/zip");
  if (filterType.value === "other")
    files = files.filter(
      (f) => !["application/pdf", "application/zip"].includes(f.mimeType),
    );
  if (filterStatus.value)
    files = files.filter((f) => f.status === filterStatus.value);
  if (sortBy.value === "downloads")
    files.sort((a, b) => b.downloadCount - a.downloadCount);
  return files;
});

function fileIcon(mime: string): string {
  if (mime === "application/pdf") return "📄";
  if (mime === "application/zip") return "📦";
  return "📁";
}

function formatSize(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function statusLabel(status: string): string {
  switch (status) {
    case "approved":
      return t("community.fileLibrary.statusApproved");
    case "pending":
      return t("community.fileLibrary.statusPending");
    case "rejected":
      return t("community.fileLibrary.statusRejected");
    default:
      return status;
  }
}

function statusClass(status: string): string {
  switch (status) {
    case "approved":
      return "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400";
    case "rejected":
      return "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400";
    default:
      return "";
  }
}

// 文件选择：读 input.files[0]，同时记录文件名/大小供弹窗展示
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
}

// 关闭上传弹窗：连同捕获的表单状态（所选文件 / 说明 / input 里的选择）一起清掉。
// 原来只把 showUpload 置 false，重开弹窗会带着上次的文件与说明，存在误提交。
function closeUpload() {
  showUpload.value = false;
  selectedFile.value = null;
  uploadDesc.value = "";
  if (fileInputEl.value) fileInputEl.value.value = "";
}

// 真提交：uploadInit 判定 direct（S3 预签名直传，登记改由事件通知驱动 → 轮询确认）
// 或 sync（Local multipart 回退），成功后关弹窗并刷新列表。错误沿用组件现有 alert/console 风格。
async function doUpload() {
  if (!selectedFile.value) {
    // 提示选文件
    alert(t("community.fileLibrary.uploadDropHint"));
    return;
  }
  uploading.value = true;
  try {
    const init = await fileLibraryApi.uploadInit({
      originalName: selectedFile.value.name,
      mimeType: selectedFile.value.type,
      categoryId: uploadCategory.value,
      description: uploadDesc.value,
      tags: [],
    });
    if (init.mode === "sync") {
      // Local：无预签名，直接 multipart 同步上传
      await fileLibraryApi.uploadSyncFromFile(selectedFile.value, {
        categoryId: uploadCategory.value,
        description: uploadDesc.value,
        tags: [],
      });
    } else {
      // S3：先 PUT 字节到预签名 URL。Phase 2-C 起**不再调 confirmUpload** —— 登记改由
      // MinIO 事件通知驱动（对象落桶 → webhook → 后端登记），后端经 WebSocket 推送
      // 「upload_registered」。这里等待该推送（实时，替代轮询）。
      // eslint-disable-next-line no-restricted-globals -- 预签名直传必须直接 PUT 字节到 S3 URL(同域 /api fetch 不适用于对象存储)
      const put = await fetch(init.presignedUrl!, {
        method: "PUT",
        body: selectedFile.value,
      });
      if (!put.ok) throw new Error(`直传失败 ${put.status}`);
      const confirm = await waitForUploadRegistration(init.uploadId!);
      if (confirm !== "registered") {
        // 超时/WS 不可用：直传已成功、但实时确认没等到。不报错卡死——
        // 关弹窗、刷新列表，提示用户稍后在列表确认状态即可。
        alert("文件已上传，正在确认中，请稍后在列表确认状态");
      }
    }
    closeUpload();
    await loadFiles();
  } catch (e) {
    console.error("上传失败", e);
    alert("上传失败，请稍后重试");
  } finally {
    uploading.value = false;
  }
}

// 下载中文件 id 集合（防重复触发 + 按钮 loading 态）
const downloading = ref<Set<string>>(new Set());
// 预览中文件 id 集合（防重复触发）
const previewing = ref<Set<string>>(new Set());
// 预览标签的 blob 清理定时器句柄（卸载时统一清掉）
let previewRevokeTimer: number | null = null;

// 下载：approved 文件按后端给出的 kind 分叉。
// presigned → S3 直连跳转；backend → 鉴权拉 blob 后走合成 <a download>。
async function downloadFile(file: FileEntry) {
  if (downloading.value.has(file.id)) return;
  downloading.value.add(file.id);
  try {
    const info = await fileLibraryApi.getDownloadUrl(file.id);
    if (info.kind === "presigned") {
      // S3 预签名直连
      window.location.href = info.url;
    } else {
      const blob = await fileLibraryApi.getContentBlob(file.id); // backend: fetch+blob+鉴权
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // 点击后立即 revoke 会让 Firefox/Safari 尚未开始读取 blob 的下载被中断（静默失败），
      // 故延后释放
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (e) {
    // 失败提示：组件无 toast 体系，沿用 alert 原语 + console
    console.error("文件下载失败", e);
    alert("文件下载失败，请稍后重试");
  } finally {
    downloading.value.delete(file.id);
  }
}

// 预览：带 Bearer 鉴权拉取内容为 blob，再在新标签打开 blob URL。
// 不能再用裸导航 window.open(previewUrl)，浏览器导航无法携带自定义头，
// 后端 /preview 由 get_current_user 保护会 401。
async function previewFile(file: FileEntry) {
  if (previewing.has(file.id)) return;
  previewing.add(file.id);
  // 必须在 await 之前**同步**开窗：await 之后不再算用户手势，弹窗拦截器会直接拦掉，
  // 原实现表现为「点了预览没反应」
  const win = window.open("", "_blank");
  try {
    const blob = await fileLibraryApi.getContentBlob(file.id);
    const blobUrl = URL.createObjectURL(blob);
    if (!win) {
      // 被拦截/弹窗被禁用：释放 blob 并留日志（本文件暂缺对应 i18n key，故不弹提示）
      URL.revokeObjectURL(blobUrl);
      console.error("预览被浏览器弹窗拦截器阻止，请允许本站弹窗后重试");
      return;
    }
    win.location.href = blobUrl;
    // 新标签加载是异步的，立即 revoke 可能使部分浏览器加载中断；用延时兜底清理，
    // 并记录句柄以便卸载时清掉
    if (previewRevokeTimer !== null) window.clearTimeout(previewRevokeTimer);
    previewRevokeTimer = window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      previewRevokeTimer = null;
    }, 60000);
  } catch (e) {
    if (win) win.close();
    console.error("文件预览失败", e);
    alert("文件预览失败，请稍后重试");
  } finally {
    previewing.delete(file.id);
  }
}
</script>
