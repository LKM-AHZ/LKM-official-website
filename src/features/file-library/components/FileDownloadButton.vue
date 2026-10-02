<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";
import { downloadFileContent } from "../utils/download";

const props = defineProps<{ fileId: string; fileName: string }>();
const downloading = ref(false);

async function download() {
  if (downloading.value) return;
  downloading.value = true;
  try {
    await downloadFileContent(props.fileId, props.fileName);
  } catch (error) {
    console.error("文件下载失败", error);
    alert("文件下载失败，请稍后重试");
  } finally {
    downloading.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    class="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
    :disabled="downloading"
    @click="download"
  >
    <Icon
      :icon="
        downloading ? 'material-symbols:progress-activity' : 'tabler:download'
      "
      class="w-4 h-4"
      :class="downloading ? 'animate-spin' : ''"
    />
    {{
      downloading
        ? t("common.loading")
        : t("page.communityDetail.files.download")
    }}
  </button>
</template>
