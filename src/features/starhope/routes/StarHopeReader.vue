<script setup lang="ts">
import { ref } from "vue";
import { t } from "~/lib/i18n";
// TODO: 阅读器尚未接线（模板只有空态、没有上传入口）：以下三个 ref 是 PDF 上传/解析状态的占位，
// 实现上传流程时启用；在此之前刻意保留，标明设计意图（删除属产品决定）
const _uploadedFile = ref<File | null>(null);
const _fileText = ref("");
const _fileName = ref("");
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-deep-text mb-6">
      {{ t("starhope.reader.title") }}
    </h1>
    <div class="card-base p-8 text-center text-text-muted">
      <div class="text-5xl mb-4">📖</div>
      <p>{{ t("starhope.reader.emptyHint") }}</p>
    </div>
  </div>
</template>
