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
    // 题目通过 folderId 引用文件夹：只导题目会留下一堆指向不存在文件夹的数据，
    // 故连同 folders 一起导出；version 记下 Dexie schema 版本，便于将来的导入端做兼容判断
    const folders = await db.folders.toArray();
    const json = JSON.stringify(
      {
        version: db.verno,
        questions,
        folders,
        exportedAt: new Date().toISOString(),
      },
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
    // 必须先挂进文档再 click：Firefox/Safari 对游离的 <a> 不触发下载
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 立刻 revoke 会在浏览器真正读完 blob 之前就释放它（下载被中断/文件损坏），让出一轮任务再回收
    setTimeout(() => URL.revokeObjectURL(url), 0);
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
