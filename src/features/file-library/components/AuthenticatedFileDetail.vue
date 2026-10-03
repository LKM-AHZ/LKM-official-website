<template>
  <div v-if="loading" class="text-sm text-text-muted">
    {{ t("common.loading") }}
  </div>
  <div v-else-if="!file" class="text-sm text-text-muted">
    {{ t("community.fileLibrary.fileUnavailable") }}
  </div>
  <div v-else class="space-y-4">
    <h1 class="text-xl font-bold text-deep-text">{{ file.originalName }}</h1>
    <div
      class="bg-card-bg border border-surface-3 rounded-2xl p-6 space-y-2 text-sm"
    >
      <p>
        {{ t("community.fileLibrary.documentCode") }}: {{ file.documentCode }}
      </p>
      <p>{{ t("community.fileLibrary.version") }}: v{{ file.version }}</p>
      <p>
        {{ t("community.fileLibrary.classificationLabel") }}:
        {{ t(`community.fileLibrary.${file.classification ?? "public"}`) }}
      </p>
      <p v-if="file.projectId">
        {{ t("community.fileLibrary.projectIdLabel") }}: {{ file.projectId }}
      </p>
      <p>{{ file.description }}</p>
      <div v-if="file.status === 'approved'" class="flex gap-2">
        <FileDownloadButton :file-id="file.id" :file-name="file.originalName" />
        <FilePreviewButton :file-id="file.id" />
      </div>
    </div>
    <div class="bg-card-bg border border-surface-3 rounded-2xl p-6">
      <h2 class="font-semibold">
        {{ t("community.fileLibrary.versionHistory") }}
      </h2>
      <ul class="mt-2 space-y-1 text-sm">
        <li v-for="version in versions" :key="version.id">
          <a
            class="text-primary hover:underline"
            :href="buildUrl(`/files/${version.id}`)"
            >v{{ version.version }} · {{ version.originalName }}</a
          >
        </li>
      </ul>
      <FileVersionUploader
        v-if="file.uploaderId"
        :file-id="file.id"
        :uploader-id="file.uploaderId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { fileLibraryApi } from "~/lib/api/modules/file-library";
import type { FileEntry } from "~/lib/api/modules/file-library";
import { buildUrl } from "~/lib/utils/paths";
import { t } from "~/lib/i18n";
import FileDownloadButton from "./FileDownloadButton.vue";
import FilePreviewButton from "./FilePreviewButton.vue";
import FileVersionUploader from "./FileVersionUploader.vue";

const props = defineProps<{ fileId: string }>();
const file = ref<FileEntry | null>(null);
const versions = ref<FileEntry[]>([]);
const loading = ref(true);

onMounted(async () => {
  file.value = await fileLibraryApi.getFile(props.fileId);
  if (file.value)
    versions.value = await fileLibraryApi.getVersions(props.fileId);
  loading.value = false;
});
</script>
