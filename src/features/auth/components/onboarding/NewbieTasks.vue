<template>
  <div class="space-y-6">
    <div class="text-center">
      <h3 class="text-xl font-semibold text-deep-text">
        {{ t("onboarding.tasks.completeProfile") }}
      </h3>
      <p class="text-sm text-text-muted mt-1">
        {{ t("onboarding.tasks.rewardHint", { points: REWARD_POINTS }) }}
      </p>
    </div>

    <div class="max-w-sm mx-auto space-y-4">
      <!-- 显示名称 -->
      <div>
        <label class="block text-sm font-medium text-deep-text mb-1.5">{{
          t("onboarding.tasks.displayName")
        }}</label>
        <input
          v-model="displayName"
          type="text"
          class="input input-bordered w-full"
          :placeholder="t('onboarding.tasks.displayNamePlaceholder')"
        />
      </div>

      <!-- 座右铭 -->
      <div>
        <label class="block text-sm font-medium text-deep-text mb-1.5">{{
          t("onboarding.tasks.motto")
        }}</label>
        <input
          v-model="bio"
          type="text"
          class="input input-bordered w-full"
          :placeholder="t('onboarding.tasks.mottoPlaceholder')"
        />
      </div>

      <!-- 简介 -->
      <div>
        <label class="block text-sm font-medium text-deep-text mb-1.5">{{
          t("onboarding.tasks.intro")
        }}</label>
        <textarea
          v-model="intro"
          rows="3"
          class="w-full px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-deep-text text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
          :placeholder="t('onboarding.tasks.introPlaceholder')"
        ></textarea>
      </div>
    </div>

    <div
      class="bg-primary/5 border border-primary/20 rounded-xl p-4 max-w-sm mx-auto"
    >
      <div class="flex items-center gap-3">
        <Icon
          icon="material-symbols:stars-outline"
          class="w-6 h-6 text-primary shrink-0"
        />
        <div class="text-sm">
          <p class="font-medium text-deep-text">
            {{ t("onboarding.tasks.rewardTitle") }}
          </p>
          <p class="text-text-muted">
            {{ t("onboarding.tasks.rewardDetail") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import { t } from "~/lib/i18n";

/** 完成新手任务的奖励积分；与 i18n 文案里的「+100 points」需人工保持一致（词条在 languages/*.ts，不在本单元可改范围） */
const REWARD_POINTS = 100;

const props = defineProps<{ initial?: Record<string, unknown> | null }>();

/** 只接受字符串初值：分步数据来自后端/草稿，形状不可信 */
function initialText(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// 步骤组件每次切步都会被重建（父级用 flow.step 作 key），必须从 initial 恢复已提交内容，
// 否则来回切步或刷新续做会把用户填过的资料清空
const displayName = ref(initialText(props.initial?.displayName));
const bio = ref(initialText(props.initial?.bio));
const intro = ref(initialText(props.initial?.intro));

defineExpose({
  getData: () => {
    // 提交前归一：纯空白的名字会被原样存成展示名；而空串在 PUT 语义下会把已保存的资料清空，
    // 所以只回传真正填了内容的字段（未触碰的字段不参与覆盖）
    const data: Record<string, string> = {};
    const name = displayName.value.trim();
    const motto = bio.value.trim();
    const description = intro.value.trim();
    if (name) data.displayName = name;
    if (motto) data.bio = motto;
    if (description) data.intro = description;
    return data;
  },
});
</script>
