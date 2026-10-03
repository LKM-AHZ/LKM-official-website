<template>
  <div v-if="canUpload" class="flex flex-wrap items-center gap-2">
    <label class="text-sm text-deep-text">
      {{ t("community.fileLibrary.newVersion") }}
      <input
        type="file"
        class="block mt-1 text-sm"
        :disabled="uploading"
        @change="selectFile"
      />
    </label>
    <button
      class="btn-primary px-3 py-2 rounded-lg text-sm disabled:opacity-50"
      :disabled="!selected || uploading"
      @click="upload"
    >
      {{
        uploading
          ? t("common.loading")
          : t("community.fileLibrary.submitVersion")
      }}
    </button>
    <span v-if="error" role="alert" class="text-sm text-red-600">{{
      error
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "~/stores/auth";
import { fileLibraryApi } from "~/lib/api/modules/file-library";
import { t } from "~/lib/i18n";
import { buildUrl } from "~/lib/utils/paths";

const props = defineProps<{ fileId: string; uploaderId: string }>();
const auth = useAuthStore();
const selected = ref<File | null>(null);
const uploading = ref(false);
const error = ref("");
const canUpload = computed(() => auth.user?.id === props.uploaderId);

onMounted(() => auth.restoreFromStorage());

function selectFile(event: Event) {
  selected.value = (event.target as HTMLInputElement).files?.[0] ?? null;
}

async function upload() {
  if (!selected.value || uploading.value) return;
  uploading.value = true;
  error.value = "";
  try {
    const version = await fileLibraryApi.uploadVersion(
      props.fileId,
      selected.value,
    );
    window.location.href = buildUrl(`/files/${version.id}`);
  } catch {
    error.value = t("community.fileLibrary.versionUploadFailed");
  } finally {
    uploading.value = false;
  }
}
</script>
