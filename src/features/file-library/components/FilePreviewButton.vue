<template>
  <button
    class="btn-ghost px-4 py-2 rounded-lg text-sm"
    :disabled="loading"
    @click="openPreview"
  >
    {{ loading ? t("common.loading") : t("community.fileLibrary.preview") }}
  </button>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { fileLibraryApi } from "~/lib/api/modules/file-library";
import { t } from "~/lib/i18n";

const props = defineProps<{ fileId: string }>();
const loading = ref(false);

async function openPreview() {
  const win = window.open("", "_blank");
  loading.value = true;
  try {
    const blob = await fileLibraryApi.getPreviewBlob(props.fileId);
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url;
    else URL.revokeObjectURL(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    win?.close();
    alert(t("community.fileLibrary.previewFailed"));
  } finally {
    loading.value = false;
  }
}
</script>
