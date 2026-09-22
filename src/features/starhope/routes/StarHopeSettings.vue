<script setup lang="ts">
import { ref } from "vue";
import { db } from "../stores/db";
import type { Question } from "~/features/starhope/types";
import { t } from "~/lib/i18n";
const exportStatus = ref("");
// 导出期间置位：await 期间按钮仍可点，会并发起多次导出、让状态文案相互覆盖（失败盖掉成功）
const isExporting = ref(false);

async function exportData() {
  if (isExporting.value) return;
  isExporting.value = true;
  exportStatus.value = "";
  try {
    const questions = (await db.questions.toArray()) as Question[];
    const json = JSON.stringify(
      { questions, exportedAt: new Date().toISOString() },
      null,
      2,
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // 用本地日期做文件名：toISOString 是 UTC，Asia 时区的晚间会得到「前一天」的备份名
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    a.download = `starhope-backup-${localDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    exportStatus.value = t("starhope.settings.exportSuccess");
  } catch (error) {
    // 静默吞掉时 IndexedDB/Blob 的失败没有任何线索（配额超限、库已关闭、结构化克隆失败等）
    console.error("[StarHope] 导出失败", error);
    exportStatus.value = t("starhope.settings.exportFailed");
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-deep-text mb-6">
      {{ t("starhope.settings.title") }}
    </h1>
    <div class="card-base p-6">
      <h3 class="text-sm font-semibold text-deep-text mb-3">
        {{ t("starhope.settings.dataManagement") }}
      </h3>
      <button
        @click="exportData"
        :disabled="isExporting"
        class="btn-primary rounded-lg px-4 py-2 text-sm"
      >
        {{ t("starhope.settings.exportBank") }}
      </button>
      <p v-if="exportStatus" class="text-sm text-text-muted mt-2">
        {{ exportStatus }}
      </p>
    </div>
  </div>
</template>
