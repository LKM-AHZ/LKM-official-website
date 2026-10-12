<template>
  <div class="space-y-6">
    <!-- 状态筛选 -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in filterTabs"
        :key="tab.value"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
        :class="
          activeFilter === tab.value
            ? 'bg-[var(--primary)] text-[var(--on-primary)]'
            : 'bg-[var(--btn-regular-bg)] text-[var(--text-muted)] hover:bg-[var(--btn-regular-bg-hover)]'
        "
        @click="activeFilter = tab.value"
      >
        {{ t(tab.label) }}
        <span class="ml-1 opacity-70">{{ countByStatus(tab.value) }}</span>
      </button>
    </div>

    <p
      v-if="filteredCompetitions.length === 0"
      class="text-center py-12 text-sm text-text-muted"
    >
      {{ t("community.competition.noCompetitions") }}
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="comp in filteredCompetitions"
        :key="comp.id"
        class="flex h-full flex-col rounded-[18px] border border-surface-3 bg-card-bg p-5"
      >
        <!-- 头部：标题 + 状态徽章 -->
        <div class="flex items-start justify-between gap-3">
          <a
            :href="buildUrl(`/competition/${comp.id}`)"
            class="font-bold text-lg text-deep-text hover:text-primary transition-colors"
          >
            {{ t(comp.title) }}
          </a>
          <span
            class="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
            :class="statusBadgeClass(comp.status)"
          >
            {{ statusLabel(comp.status) }}
          </span>
        </div>
        <p class="mt-2 text-sm leading-6 text-text-muted line-clamp-2">
          {{ t(comp.description) }}
        </p>

        <!-- 阶段时间轴 -->
        <div class="mt-4">
          <div class="grid grid-cols-4 gap-1">
            <div
              v-for="stage in comp.stages"
              :key="stage.key"
              class="flex flex-col items-center text-center"
            >
              <span
                class="w-2.5 h-2.5 rounded-full mb-1"
                :class="stageDotClass(comp, stage.key)"
              ></span>
              <span
                class="text-[11px] leading-tight"
                :class="
                  activeStageKey(comp) === stage.key
                    ? 'text-primary font-semibold'
                    : 'text-text-muted/70'
                "
                >{{ stageLabel(stage.key) }}</span
              >
              <span class="text-[10px] text-text-muted/50 leading-tight">{{
                shortDate(stage.start)
              }}</span>
            </div>
          </div>
        </div>

        <!-- 底部：人数 + 倒计时 + 操作 -->
        <div class="mt-auto pt-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-col gap-1 text-xs text-text-muted">
            <span>
              {{ t("community.competition.participants")
              }}{{ comp.participantCount }}
            </span>
            <span
              v-if="comp.status !== 'ended'"
              class="font-mono font-semibold"
              :class="comp.status === 'ongoing' ? 'text-primary' : 'text-warning'"
            >
              {{ t("community.competition.countdown") }}
              {{ countdownText(comp) }}
            </span>
          </div>
          <!-- 报名中：报名按钮；进行中：进入答题；已结束：查看详情 -->
          <a
            v-if="comp.status === 'upcoming'"
            class="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            :class="
              registered.has(comp.id)
                ? 'bg-[var(--surface-3)] text-text-muted cursor-default'
                : 'btn-primary'
            "
            @click.prevent="toggleRegister(comp.id)"
          >
            {{
              registered.has(comp.id)
                ? t("community.competition.registered")
                : t("community.competition.signUp")
            }}
          </a>
          <a
            v-else-if="comp.status === 'ongoing'"
            :href="buildUrl(`/competition/${comp.id}/exam`)"
            class="btn-primary px-5 py-2 rounded-lg text-sm font-semibold"
          >
            {{ t("community.competition.enterExam") }}
          </a>
          <a
            v-else
            :href="buildUrl(`/competition/${comp.id}`)"
            class="btn-ghost px-5 py-2 rounded-lg text-sm"
          >
            {{ t("community.competition.viewDetails") }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  mockCompetitions,
  type MockCompetition,
  type CompetitionStatus,
  type StageKey,
} from "../data/mock-competitions";
import { buildUrl } from "~/lib/utils/paths";
import { t } from "~/lib/i18n";

type FilterValue = "all" | CompetitionStatus;

const filterTabs: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "community.competition.filterAll" },
  { value: "upcoming", label: "community.competition.filterSignup" },
  { value: "ongoing", label: "community.competition.filterOngoing" },
  { value: "ended", label: "community.competition.filterEnded" },
];

const activeFilter = ref<FilterValue>("all");
const registered = ref<Set<string>>(new Set());

// 单一时钟驱动所有倒计时，避免每个竞赛各起一个 setInterval
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function countByStatus(v: FilterValue): number {
  if (v === "all") return mockCompetitions.length;
  return mockCompetitions.filter((c) => c.status === v).length;
}

const filteredCompetitions = computed(() => {
  if (activeFilter.value === "all") return mockCompetitions;
  return mockCompetitions.filter((c) => c.status === activeFilter.value);
});

function toggleRegister(id: string) {
  const next = new Set(registered.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  registered.value = next;
}

function statusLabel(s: CompetitionStatus): string {
  if (s === "ongoing") return t("community.competition.filterOngoing");
  if (s === "upcoming") return t("community.competition.filterSignup");
  return t("community.competition.filterEnded");
}

function statusBadgeClass(s: CompetitionStatus): string {
  if (s === "ongoing")
    return "bg-[var(--success)] text-[var(--on-success)]";
  if (s === "upcoming")
    return "bg-[var(--warning)] text-[var(--on-warning)]";
  return "bg-[var(--surface-3)] text-text-muted";
}

function stageLabel(k: StageKey): string {
  const map: Record<StageKey, string> = {
    signup: "community.competition.stageSignup",
    warmup: "community.competition.stageWarmup",
    official: "community.competition.stageOfficial",
    review: "community.competition.stageReview",
  };
  return t(map[k]);
}

/** 当前所处阶段：落在某阶段 [start, end] 区间内即为该阶段 */
function activeStageKey(comp: MockCompetition): StageKey | null {
  const t0 = now.value;
  for (const s of comp.stages) {
    const start = Date.parse(`${s.start}T00:00:00`);
    const end = Date.parse(`${s.end}T23:59:59`);
    if (t0 >= start && t0 <= end) return s.key;
  }
  return null;
}

function stageDotClass(comp: MockCompetition, key: StageKey): string {
  const active = activeStageKey(comp);
  if (active === key) return "bg-[var(--primary)] ring-2 ring-[var(--primary)]/30";
  // 已过去的阶段
  const stage = comp.stages.find((s) => s.key === key)!;
  if (Date.parse(`${stage.end}T23:59:59`) < now.value)
    return "bg-[var(--success)]";
  return "bg-[var(--surface-3)]";
}

function shortDate(iso: string): string {
  // 2026-10-07 -> 10/07
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
}

/** 报名中倒计时到开始，进行中倒计时到结束 */
function countdownText(comp: MockCompetition): string {
  const target =
    comp.status === "upcoming"
      ? Date.parse(`${comp.startDate}T00:00:00`)
      : Date.parse(`${comp.endDate}T23:59:59`);
  const diff = Math.max(0, target - now.value);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0)
    return `${days}${t("community.competition.daysUnit")} ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}
</script>
