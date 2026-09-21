<template>
  <div class="space-y-8">
    <div v-for="group in groupedCompetitions" :key="group.status">
      <h2 class="text-lg font-semibold text-deep-text mb-3">
        {{ statusLabel(group.status) }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="comp in group.items"
          :key="comp.id"
          class="bg-card-bg border border-surface-3 rounded-xl p-5"
        >
          <h3 class="font-bold text-lg text-deep-text">{{ t(comp.title) }}</h3>
          <p class="text-sm text-text-muted mt-1">{{ t(comp.description) }}</p>
          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-text-muted/60"
          >
            <span
              >{{ t("community.competition.startsAt")
              }}{{ comp.startDate }}</span
            >
            <span
              >{{ t("community.competition.endsAt") }}{{ comp.endDate }}</span
            >
            <span v-if="comp.status === 'ongoing'"
              >{{ t("community.competition.duration") }}
              {{
                t("community.competition.durationMinutes", {
                  count: comp.duration,
                })
              }}</span
            >
          </div>
          <div class="flex items-center justify-between mt-4">
            <span
              class="text-sm text-text-muted"
              v-if="comp.participantCount > 0"
              >{{ t("community.competition.participants")
              }}{{ comp.participantCount }}</span
            >
            <span v-else class="text-sm text-text-muted">{{
              t("community.competition.upcoming")
            }}</span>
            <a
              v-if="comp.status === 'ongoing'"
              :href="buildUrl(`/competition/${comp.id}/exam`)"
              class="btn-primary px-5 py-2 rounded-lg text-sm font-semibold"
              >{{ t("community.competition.enterExam") }}</a
            >
            <span
              v-else-if="comp.status === 'upcoming'"
              class="text-sm text-primary font-medium"
              >{{ t("community.competition.upcoming") }}</span
            >
            <span v-else class="text-sm text-text-muted/60">{{
              t("community.competition.ended")
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { mockCompetitions } from "../data/mock-competitions";
import { buildUrl } from "~/lib/utils/paths";
import { t } from "~/lib/i18n";

const groupedCompetitions = computed(() => {
  const order = { ongoing: 0, upcoming: 1, ended: 2 };
  const groups: Record<string, typeof mockCompetitions> = {
    ongoing: [],
    upcoming: [],
    ended: [],
  };
  for (const c of mockCompetitions) {
    // 未知状态（如后端新增 cancelled/postponed）不能直接 .push，否则 undefined.push
    // 抛 TypeError 会让整个 computed 失败、整页渲染崩掉
    if (!groups[c.status]) continue;
    groups[c.status].push(c);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => order[a] - order[b])
    .map(([status, items]) => ({ status, items }));
});

function statusLabel(s: string) {
  switch (s) {
    case "ongoing":
      return t("community.competition.ongoing");
    case "upcoming":
      return t("community.competition.upcoming");
    case "ended":
      return t("community.competition.ended");
    default:
      return s;
  }
}
</script>
