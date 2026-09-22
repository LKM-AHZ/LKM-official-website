<!-- src/features/file-library/components/FolderGrid.vue -->
<!-- 当前层的文件夹卡片网格；点卡片下钻 -->
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <button
      v-for="folder in folders"
      :key="folder.id"
      type="button"
      class="bg-card-bg border border-surface-3 rounded-xl p-5 hover:border-primary/40 hover:bg-page-bg transition-colors group text-left flex flex-col gap-3"
      @click="emit('open', folder.id)"
    >
      <div class="flex items-center gap-3">
        <span
          aria-hidden="true"
          class="text-3xl shrink-0 text-primary/70 group-hover:text-primary transition-colors"
        >
          <Icon icon="material-symbols:folder" />
        </span>
        <!-- button 只允许 phrasing content，且卡片可访问名本就来自文本，故用 span 而非 h3 -->
        <span
          class="font-semibold text-deep-text group-hover:text-primary transition-colors line-clamp-1 text-sm"
        >
          {{ t(folder.name) }}
        </span>
      </div>
      <div class="text-xs text-text-muted/60">
        {{
          t("community.fileLibrary.fileCount", {
            count: fileCounts[folder.id] ?? 0,
          })
        }}
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import type { FileCategory } from "../data/category-tree";
import { t } from "~/lib/i18n";

defineProps<{ folders: FileCategory[]; fileCounts: Record<string, number> }>();
const emit = defineEmits<{ open: [categoryId: string] }>();
</script>
