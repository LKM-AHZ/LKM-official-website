<!--
  CategoryTreeNav.vue
  文件库左侧分类目录树（P0）

  - 一级学科 → 二级学科 → 资料类型（三级可折叠）
  - 节点可折叠展开，当前选中高亮
  - 桌面端左侧边栏，移动端折叠到顶部
-->
<template>
  <nav class="space-y-1" aria-label="分类目录">
    <!-- 全部资料 -->
    <button
      type="button"
      class="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
      :class="
        currentId === null
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-deep-text hover:bg-surface-3'
      "
      @click="emit('select', null)"
    >
      <Icon icon="material-symbols:folder-special" class="w-4 h-4 shrink-0" />
      <span class="truncate">全部资料</span>
    </button>

    <CategoryTreeBranch
      v-for="root in roots"
      :key="root.id"
      :node="root"
      :current-id="currentId"
      :expanded-ids="expandedIds"
      :file-counts="fileCounts"
      @select="(id) => emit('select', id)"
      @toggle="(id) => emit('toggle', id)"
    />
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import {
  fileCategories,
  getChildren,
  isLeaf,
  type FileCategory,
} from "../data/category-tree";
import CategoryTreeBranch from "./CategoryTreeBranch.vue";

const props = defineProps<{
  currentId: string | null;
  expandedIds: Set<string>;
  fileCounts: Record<string, number>;
}>();

const emit = defineEmits<{
  select: [id: string | null];
  toggle: [id: string];
}>();

const roots = computed<FileCategory[]>(() => getChildren(null));
</script>
