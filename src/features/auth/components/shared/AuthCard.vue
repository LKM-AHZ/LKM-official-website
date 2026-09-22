<template>
  <!-- mode 目前只影响圆角：page 用 rounded-2xl 覆盖 card-base 的 --radius-large 令牌，
       modal 沿用令牌（弹窗容器已有自己的圆角层级）。mode 不含内边距/关闭按钮等弹窗行为 -->
  <section
    class="card-base relative w-full p-6 sm:p-8"
    :class="{ 'rounded-2xl': mode === 'page' }"
    :role="title ? 'group' : undefined"
    :aria-labelledby="title ? titleId : undefined"
  >
    <!-- 标题区 -->
    <header v-if="title || subtitle" class="mb-6">
      <component
        :is="`h${headingLevel}`"
        v-if="title"
        :id="titleId"
        class="text-xl font-semibold text-deep-text leading-tight"
      >
        {{ title }}
      </component>
      <p v-if="subtitle" class="mt-1 text-sm text-text-muted">{{ subtitle }}</p>
    </header>

    <!-- 内容区（右上角 modal 关闭按钮由 AuthModal 负责，本组件不渲染） -->
    <div class="w-full">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useId } from "vue";

withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    mode?: "page" | "modal";
    /** 标题层级：页面里嵌在其它章节下、或放进弹窗时由调用方降/升一级，避免标题层级跳级 */
    headingLevel?: number;
  }>(),
  { mode: "page", headingLevel: 2 },
);

// 无标题时不声明 role="group"：带 role 却无可访问名称的无名 landmark 对读屏是噪音
const titleId = `auth-card-title-${useId()}`;
</script>
