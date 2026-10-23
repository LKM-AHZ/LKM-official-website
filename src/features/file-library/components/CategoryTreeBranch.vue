<!--
  CategoryTreeBranch.vue
  分类树递归分支（P0）
  - 有子节点时显示折叠箭头；叶子节点显示文件数
  - 缩进表示层级
-->
<template>
  <div>
    <div
      class="flex items-center gap-1 rounded-lg pr-2 text-sm transition-colors"
      :class="currentId === node.id ? 'bg-primary/10 text-primary' : ''"
    >
      <!-- 折叠箭头（仅非叶子） -->
      <button
        v-if="!isLeaf(node.id)"
        type="button"
        class="flex items-center justify-center w-6 h-6 shrink-0 rounded hover:bg-surface-3 text-text-muted"
        :aria-label="expanded ? '折叠' : '展开'"
        @click="emit('toggle', node.id)"
      >
        <Icon
          icon="material-symbols:chevron-right"
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-90': expanded }"
        />
      </button>
      <span v-else class="w-6 h-6 shrink-0" />

      <button
        type="button"
        class="flex flex-1 items-center gap-2 px-1.5 py-2 rounded-lg text-left truncate transition-colors"
        :class="
          currentId === node.id
            ? 'text-primary font-medium'
            : 'text-deep-text hover:bg-surface-3'
        "
        @click="emit('select', node.id)"
      >
        <Icon
          :icon="
            isLeaf(node.id)
              ? 'material-symbols:description'
              : 'material-symbols:folder'
          "
          class="w-4 h-4 shrink-0"
          :class="isLeaf(node.id) ? 'text-text-muted/60' : 'text-amber-500/80'"
        />
        <span class="truncate">{{ t(node.name) }}</span>
        <span
          v-if="isLeaf(node.id)"
          class="ml-auto text-xs text-text-muted/60 shrink-0"
        >
          {{ fileCounts[node.id] ?? 0 }}
        </span>
      </button>
    </div>

    <!-- 子节点 -->
    <div
      v-if="!isLeaf(node.id) && expanded"
      class="ml-3 border-l border-surface-3 pl-2"
    >
      <CategoryTreeBranch
        v-for="child in children"
        :key="child.id"
        :node="child"
        :current-id="currentId"
        :expanded-ids="expandedIds"
        :file-counts="fileCounts"
        @select="(id) => emit('select', id)"
        @toggle="(id) => emit('toggle', id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { getChildren, isLeaf, type FileCategory } from "../data/category-tree";
import { t } from "~/lib/i18n";

const props = defineProps<{
  node: FileCategory;
  currentId: string | null;
  expandedIds: Set<string>;
  fileCounts: Record<string, number>;
}>();

const emit = defineEmits<{
  select: [id: string | null];
  toggle: [id: string];
}>();

const children = computed<FileCategory[]>(() => getChildren(props.node.id));
const expanded = computed(() => props.expandedIds.has(props.node.id));
</script>
