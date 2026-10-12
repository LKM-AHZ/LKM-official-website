<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
    <!-- 左：竞赛信息 + 报名 -->
    <div class="lg:col-span-2 space-y-5">
      <!-- 信息卡片 -->
      <div class="rounded-[18px] border border-surface-3 bg-card-bg p-6">
        <div class="flex items-start justify-between gap-3">
          <h2 class="text-xl font-bold text-deep-text">{{ t(comp.title) }}</h2>
          <span
            class="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
            :class="statusBadgeClass"
          >
            {{ statusLabel }}
          </span>
        </div>
        <p class="mt-3 text-sm leading-6 text-text-muted">
          {{ t(comp.description) }}
        </p>

        <!-- 时间安排 -->
        <h3 class="mt-6 text-sm font-semibold text-deep-text">
          {{ t("community.competition.currentStage") }}
        </h3>
        <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            v-for="stage in comp.stages"
            :key="stage.key"
            class="rounded-xl border p-3"
            :class="
              activeStageKey === stage.key
                ? 'border-primary bg-[var(--btn-regular-bg)]'
                : 'border-surface-3'
            "
          >
            <p class="text-xs font-medium text-deep-text">
              {{ stageLabel(stage.key) }}
            </p>
            <p class="mt-1 text-[11px] text-text-muted">
              {{ stage.start }} ~ {{ stage.end }}
            </p>
          </div>
        </div>

        <!-- 奖励规则 -->
        <h3 class="mt-6 text-sm font-semibold text-deep-text">
          {{ t("community.competition.rewardRule") }}
        </h3>
        <p class="mt-2 text-sm leading-6 text-text-muted">
          {{ t(comp.reward) }}
        </p>
      </div>

      <!-- 报名卡片 -->
      <div class="rounded-[18px] border border-surface-3 bg-card-bg p-6">
        <h3 class="text-sm font-semibold text-deep-text">
          {{ t("community.competition.participateMode") }}
        </h3>

        <!-- 参赛方式选择 -->
        <div class="mt-3 grid grid-cols-2 gap-3">
          <button
            class="rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
            :class="
              mode === 'individual'
                ? 'border-primary bg-[var(--btn-regular-bg)] text-primary'
                : 'border-surface-3 text-text-muted hover:border-primary/40'
            "
            @click="mode = 'individual'"
          >
            {{ t("community.competition.modeIndividual") }}
          </button>
          <button
            class="rounded-xl border px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              mode === 'team'
                ? 'border-primary bg-[var(--btn-regular-bg)] text-primary'
                : 'border-surface-3 text-text-muted hover:border-primary/40'
            "
            :disabled="!comp.teamMode"
            @click="mode = 'team'"
          >
            {{ t("community.competition.modeTeam") }}
          </button>
        </div>
        <p v-if="!comp.teamMode" class="mt-2 text-xs text-text-muted/70">
          {{ t("community.competition.individualOnly") }}
        </p>

        <!-- 团队赛：邀请码输入 -->
        <div v-if="mode === 'team' && comp.teamMode" class="mt-4">
          <label class="block text-xs text-text-muted mb-1">
            {{ t("community.competition.inviteCode") }}
          </label>
          <input
            v-model="inviteCode"
            type="text"
            :placeholder="t('community.competition.invitePlaceholder')"
            class="w-full px-3 py-2 rounded-lg border border-surface-3 bg-card-bg text-sm text-deep-text focus:border-primary outline-none"
          />
        </div>

        <!-- 报名按钮 -->
        <div class="mt-5 flex items-center gap-3">
          <button
            class="px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
            :class="
              registered
                ? 'bg-[var(--surface-3)] text-text-muted cursor-default'
                : 'btn-primary'
            "
            :disabled="comp.status === 'ended'"
            @click="registered = true"
          >
            {{
              registered
                ? t("community.competition.registered")
                : t("community.competition.signUp")
            }}
          </button>
          <a
            v-if="comp.status === 'ongoing'"
            :href="`/competition/${comp.id}/exam`"
            class="btn-primary px-6 py-2.5 rounded-full text-sm font-semibold"
          >
            {{ t("community.competition.enterExam") }}
          </a>
          <span v-if="comp.status === 'ended'" class="text-sm text-text-muted">
            {{ t("community.competition.ended") }}
          </span>
        </div>
      </div>
    </div>

    <!-- 右：排行榜预览 -->
    <aside
      class="rounded-[18px] border border-surface-3 bg-card-bg p-5 h-fit lg:sticky lg:top-6"
    >
      <h3 class="text-sm font-semibold text-deep-text mb-3">
        {{ t("community.competition.leaderboard") }}
      </h3>
      <ol class="space-y-1.5">
        <li
          v-for="row in leaderboard"
          :key="row.rank"
          class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
          :class="row.isSelf ? 'bg-[var(--btn-regular-bg)]' : ''"
        >
          <span
            class="w-6 text-center font-mono text-xs font-bold"
            :class="row.rank <= 3 ? 'text-warning' : 'text-text-muted/60'"
            >{{ row.rank }}</span
          >
          <span class="flex-1 truncate text-deep-text">{{ row.name }}</span>
          <span v-if="row.isSelf" class="text-[10px] text-primary">{{
            t("community.competition.you")
          }}</span>
          <span class="font-mono text-xs text-text-muted">{{ row.score }}</span>
        </li>
      </ol>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  mockLeaderboards,
  type MockCompetition,
  type StageKey,
} from "../data/mock-competitions";
import { t } from "~/lib/i18n";

const props = defineProps<{ comp: MockCompetition }>();

const registered = ref(false);
const mode = ref<"individual" | "team">(
  props.comp.teamMode ? "team" : "individual",
);
const inviteCode = ref("");

const leaderboard = computed(() => mockLeaderboards[props.comp.id] ?? []);

const activeStageKey = computed<StageKey | null>(() => {
  const t0 = Date.now();
  for (const s of props.comp.stages) {
    const start = Date.parse(`${s.start}T00:00:00`);
    const end = Date.parse(`${s.end}T23:59:59`);
    if (t0 >= start && t0 <= end) return s.key;
  }
  return null;
});

const statusLabel = computed(() => {
  if (props.comp.status === "ongoing")
    return t("community.competition.filterOngoing");
  if (props.comp.status === "upcoming")
    return t("community.competition.filterSignup");
  return t("community.competition.filterEnded");
});

const statusBadgeClass = computed(() => {
  if (props.comp.status === "ongoing")
    return "bg-[var(--success)] text-[var(--on-success)]";
  if (props.comp.status === "upcoming")
    return "bg-[var(--warning)] text-[var(--on-warning)]";
  return "bg-[var(--surface-3)] text-text-muted";
});

function stageLabel(k: StageKey): string {
  const map: Record<StageKey, string> = {
    signup: "community.competition.stageSignup",
    warmup: "community.competition.stageWarmup",
    official: "community.competition.stageOfficial",
    review: "community.competition.stageReview",
  };
  return t(map[k]);
}
</script>
