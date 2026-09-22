<template>
  <div class="space-y-6">
    <div class="text-center">
      <h3 class="text-xl font-semibold text-deep-text">
        {{ t("onboarding.tags.title") }}
      </h3>
      <p class="text-sm text-text-muted mt-1">
        {{ t("onboarding.tags.subtitle") }}
      </p>
    </div>

    <!-- 年级 -->
    <div>
      <label class="block text-sm font-medium text-deep-text mb-2">{{
        t("onboarding.tags.grade")
      }}</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="g in gradeOptions"
          :key="g.value"
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          :class="
            selectedGrade === g.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-surface-3 bg-card-bg text-text-muted hover:border-primary/40'
          "
          @click="selectedGrade = selectedGrade === g.value ? '' : g.value"
        >
          {{ t(g.labelKey) }}
        </button>
      </div>
    </div>

    <!-- 专业方向 -->
    <div>
      <label class="block text-sm font-medium text-deep-text mb-2">{{
        t("onboarding.tags.major")
      }}</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="m in majorOptions"
          :key="m.value"
          type="button"
          class="px-3 py-1.5 rounded-lg text-sm border transition-colors flex items-center gap-1.5"
          :class="
            selectedMajors.includes(m.value)
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-surface-3 bg-card-bg text-text-muted hover:border-primary/40'
          "
          @click="toggleMajor(m.value)"
        >
          <Icon v-if="m.icon" :icon="m.icon" class="w-4 h-4" />
          {{ t(m.labelKey) }}
        </button>
      </div>
    </div>

    <!-- 兴趣领域 -->
    <div>
      <label class="block text-sm font-medium text-deep-text mb-2">{{
        t("onboarding.tags.interests")
      }}</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in interestOptions"
          :key="item.value"
          type="button"
          class="px-3 py-1.5 rounded-full text-sm border transition-colors"
          :class="
            selectedInterests.includes(item.value)
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-surface-3 bg-card-bg text-text-muted hover:border-primary/40'
          "
          @click="toggleInterest(item.value)"
        >
          {{ t(item.labelKey) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import { t, type TranslationKey } from "~/lib/i18n";

interface TagOption {
  value: string;
  labelKey: TranslationKey;
  icon?: string;
}

interface IdentityInitial {
  grade?: string;
  majors?: string[];
  interests?: string[];
}

// 回填已提交的选择：步骤组件在每次切换时都会被重新挂载（key=flow.step），
// 若不从父级传入上次的数据，用户点「上一步」回来时选择会被清空，
// 再点「下一步」就会用空数组覆盖后端已保存的内容。
const props = defineProps<{ initial?: IdentityInitial | null }>();

const gradeOptions: TagOption[] = [
  { value: "junior_high", labelKey: "onboarding.tags.juniorHigh" },
  { value: "senior_high", labelKey: "onboarding.tags.seniorHigh" },
  { value: "university", labelKey: "onboarding.tags.university" },
  { value: "graduate", labelKey: "onboarding.tags.graduate" },
  { value: "working", labelKey: "onboarding.tags.working" },
];

const majorOptions: TagOption[] = [
  { value: "math", labelKey: "onboarding.tags.math", icon: "tabler:math" },
  {
    value: "physics",
    labelKey: "onboarding.tags.physics",
    icon: "tabler:atom",
  },
  {
    value: "chemistry",
    labelKey: "onboarding.tags.chemistry",
    icon: "tabler:flask",
  },
  {
    value: "biology",
    labelKey: "onboarding.tags.biology",
    icon: "tabler:microscope",
  },
  {
    value: "astronomy",
    labelKey: "onboarding.tags.astronomy",
    icon: "tabler:telescope",
  },
  {
    value: "earth_science",
    labelKey: "onboarding.tags.earthScience",
    icon: "tabler:globe",
  },
  { value: "cs", labelKey: "onboarding.tags.cs", icon: "tabler:code" },
  { value: "ee", labelKey: "onboarding.tags.ee", icon: "tabler:bolt" },
  {
    value: "engineering",
    labelKey: "onboarding.tags.engineering",
    icon: "tabler:tools",
  },
  {
    value: "medicine",
    labelKey: "onboarding.tags.medicine",
    icon: "tabler:heartbeat",
  },
  {
    value: "social_science",
    labelKey: "onboarding.tags.socialScience",
    icon: "tabler:users",
  },
  {
    value: "literature",
    labelKey: "onboarding.tags.literature",
    icon: "tabler:book",
  },
];

const interestOptions: TagOption[] = [
  { value: "research", labelKey: "onboarding.tags.research" },
  { value: "programming", labelKey: "onboarding.tags.programming" },
  { value: "reading", labelKey: "onboarding.tags.reading" },
  { value: "writing", labelKey: "onboarding.tags.writing" },
  { value: "experiment", labelKey: "onboarding.tags.experiment" },
  { value: "teaching", labelKey: "onboarding.tags.teaching" },
  { value: "debate", labelKey: "onboarding.tags.debate" },
  { value: "competition", labelKey: "onboarding.tags.competition" },
  { value: "astronomy_hobby", labelKey: "onboarding.tags.astronomyHobby" },
  { value: "model", labelKey: "onboarding.tags.model" },
  { value: "game", labelKey: "onboarding.tags.game" },
  { value: "music", labelKey: "onboarding.tags.music" },
  { value: "sci_fi", labelKey: "onboarding.tags.sciFi" },
  { value: "cooking", labelKey: "onboarding.tags.cooking" },
  { value: "chess", labelKey: "onboarding.tags.chess" },
];

const selectedGrade = ref(props.initial?.grade ?? "");
const selectedMajors = ref<string[]>(
  Array.isArray(props.initial?.majors) ? [...props.initial.majors] : [],
);
const selectedInterests = ref<string[]>(
  Array.isArray(props.initial?.interests) ? [...props.initial.interests] : [],
);

function toggleMajor(value: string) {
  const idx = selectedMajors.value.indexOf(value);
  if (idx >= 0) {
    selectedMajors.value.splice(idx, 1);
  } else {
    selectedMajors.value.push(value);
  }
}

function toggleInterest(value: string) {
  const idx = selectedInterests.value.indexOf(value);
  if (idx >= 0) {
    selectedInterests.value.splice(idx, 1);
  } else {
    selectedInterests.value.push(value);
  }
}

defineExpose({
  getData: () => ({
    // 未选年级时给 null 而不是空串：空串与「显式清空」无法区分，父级/后端就分不出
    // 「跳过」和「选了又取消」（第 1 步是 optional，空值会被直接 saveStep 上报）
    grade: selectedGrade.value || null,
    majors: [...selectedMajors.value],
    interests: [...selectedInterests.value],
  }),
});
</script>
