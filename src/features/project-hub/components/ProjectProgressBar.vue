<!--
  ProjectProgressBar.vue
  可视化进度条 + 里程碑节点标记（P0）

  - 0%~100% 横向进度条
  - 里程碑节点：默认 0%需求确认 → 30%核心跑通 → 70%初稿完成 → 100%结题
  - 进度条与里程碑联动：已完成节点高亮，未到达节点空心
  - compact 模式用于列表卡片（不显示节点文字），详情页用完整模式
-->
<template>
  <div
    class="project-progress"
    :class="{ 'project-progress--compact': compact }"
  >
    <!-- 进度轨道 -->
    <div class="relative h-2.5 rounded-full bg-surface-3">
      <!-- 已填充部分 -->
      <div
        class="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
        :style="{ width: clamped + '%' }"
      />
      <!-- 里程碑节点 -->
      <div
        v-for="m in normalizedMilestones"
        :key="m.percent"
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center"
        :style="{ left: m.percent + '%' }"
      >
        <span
          class="block rounded-full border-2 transition-colors"
          :class="
            clamped >= m.percent
              ? 'bg-on-primary border-on-primary'
              : 'bg-card-bg border-surface-3'
          "
          :style="{
            width: compact ? '8px' : '12px',
            height: compact ? '8px' : '12px',
          }"
        />
      </div>
    </div>
    <!-- 里程碑文字标签（非 compact） -->
    <div v-if="!compact" class="relative mt-2 text-[11px] leading-tight">
      <div
        v-for="m in normalizedMilestones"
        :key="m.percent"
        class="absolute -translate-x-1/2 whitespace-nowrap transition-colors"
        :class="
          clamped >= m.percent
            ? 'text-primary font-medium'
            : 'text-text-muted/60'
        "
        :style="{ left: m.percent + '%' }"
      >
        <span class="block">{{ m.percent }}%</span>
        <span class="block">{{ m.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface ProgressMilestone {
  percent: number;
  label: string;
}

const props = withDefaults(
  defineProps<{
    /** 当前进度 0-100 */
    progress: number;
    /** 自定义里程碑；缺省使用 P0 默认四段 */
    milestones?: ProgressMilestone[];
    /** 紧凑模式（列表卡片）：不渲染节点文字 */
    compact?: boolean;
  }>(),
  {
    milestones: () => [
      { percent: 0, label: "需求确认" },
      { percent: 30, label: "核心跑通" },
      { percent: 70, label: "初稿完成" },
      { percent: 100, label: "结题" },
    ],
    compact: false,
  },
);

const clamped = computed(() =>
  Math.max(0, Math.min(100, Math.round(props.progress))),
);

const normalizedMilestones = computed<ProgressMilestone[]>(() =>
  [...props.milestones].sort((a, b) => a.percent - b.percent),
);
</script>

<style scoped>
/* 紧凑模式下为节点标签预留一点高度，避免压住轨道 */
.project-progress--compact {
  padding: 2px 0;
}
</style>
