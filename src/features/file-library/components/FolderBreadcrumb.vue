<!-- src/features/file-library/components/FolderBreadcrumb.vue -->
<!-- 面包屑导航：全部学科 / 基础学科 / 数学 / 线性代数；末尾当前层不可点 -->
<template>
  <nav
    class="flex flex-wrap items-center gap-1 text-sm"
    :aria-label="t('community.fileLibrary.breadcrumbAria')"
  >
    <button
      class="px-1.5 py-0.5 rounded-md text-deep-text hover:text-primary hover:bg-surface-3 transition-colors"
      :class="{
        '!text-text-muted !cursor-default !hover:bg-transparent':
          path.length === 0,
      }"
      :disabled="path.length === 0"
      :aria-current="path.length === 0 ? 'page' : undefined"
      @click="emit('navigate', null)"
    >
      {{ t("community.fileLibrary.allCategories") }}
    </button>
    <span v-for="node in path" :key="node.id" class="flex items-center gap-1">
      <span class="text-text-muted/60 select-none">/</span>
      <button
        class="px-1.5 py-0.5 rounded-md transition-colors"
        :class="
          node.id === path[path.length - 1].id
            ? 'text-primary font-medium cursor-default'
            : 'text-deep-text hover:text-primary hover:bg-surface-3'
        "
        :disabled="node.id === path[path.length - 1].id"
        :aria-current="
          node.id === path[path.length - 1].id ? 'page' : undefined
        "
        @click="emit('navigate', node.id)"
      >
        {{ t(node.name) }}
      </button>
    </span>
  </nav>
</template>

<script setup lang="ts">
// withDefaults 是 <script setup> 的编译宏（同 defineProps），不从 vue 运行时导入 ——
// vue 的运行时入口并不导出它，保留该 import 会让构建报 "does not provide an export named 'withDefaults'"
import type { FileCategory } from "../data/category-tree";
import { t } from "~/lib/i18n";

withDefaults(defineProps<{ path: FileCategory[] }>(), { path: () => [] });
const emit = defineEmits<{ navigate: [categoryId: string | null] }>();
</script>
