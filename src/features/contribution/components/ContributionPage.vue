<template>
  <div class="space-y-6">
    <!-- 顶部用户积分卡片 -->
    <div class="bg-card-bg border border-surface-3 rounded-2xl p-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div
          class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl"
        >
          {{ t("contribution.me") }}
        </div>
        <div class="flex-1">
          <h1 class="text-xl font-bold text-deep-text">
            {{ t("contribution.title") }}
          </h1>
          <div class="flex items-center gap-3 mt-1 text-sm">
            <span class="text-text-muted">{{
              t("contribution.currentPoints")
            }}</span>
            <span class="text-2xl font-bold text-primary">{{
              balance.toLocaleString()
            }}</span>
            <span
              v-if="myTitle"
              class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >{{ t(`contributionData.leaderboard.titles.${myTitle}`) }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 加载态 -->
    <div v-if="loading" class="text-center py-16 text-sm text-text-muted">
      {{ t("common.loading") }}
    </div>

    <template v-else>
      <!-- Tab 导航 -->
      <div class="flex gap-1 overflow-x-auto pb-1">
        <button
          v-for="tab in pageTabs"
          :key="tab.key"
          class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0"
          :class="
            activeTab === tab.key
              ? 'bg-primary text-on-primary'
              : 'bg-surface-3 text-text-muted hover:bg-surface-3/70'
          "
          @click="activeTab = tab.key"
        >
          <Icon :icon="tab.icon" class="w-4 h-4 inline mr-1" />
          {{ tab.label }}
        </button>
      </div>

      <!-- 成就墙 -->
      <div
        v-if="activeTab === 'achievements'"
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <div
          v-for="ach in allAchievements"
          :key="ach.id"
          class="rounded-xl p-4 text-center transition-colors"
          :class="
            ach.unlocked
              ? 'bg-card-bg border border-surface-3'
              : 'bg-surface-3/30 border border-surface-3 opacity-50'
          "
        >
          <div
            class="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2"
            :class="
              ach.unlocked
                ? 'bg-primary/10 text-primary'
                : 'bg-surface-3 text-text-muted'
            "
          >
            <Icon :icon="ach.icon" class="w-6 h-6" />
          </div>
          <div
            class="font-semibold text-sm"
            :class="ach.unlocked ? 'text-deep-text' : 'text-text-muted'"
          >
            {{ t(ach.name_key) }}
          </div>
          <div class="text-xs text-text-muted/60 mt-1">
            {{ t(ach.desc_key) }}
          </div>
          <div v-if="!ach.unlocked" class="mt-2">
            <div class="h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div
                class="h-full rounded-full bg-primary/40"
                :style="{ width: ach.progressPercent + '%' }"
              ></div>
            </div>
            <div class="text-xs text-text-muted/50 mt-0.5">
              {{ ach.progress }}/{{ ach.threshold }}
            </div>
          </div>
        </div>
        <div
          v-if="isLoggedIn === false"
          class="col-span-full text-center py-12 text-sm text-text-muted"
        >
          {{ t("settings.loginRequired") }}
        </div>
      </div>

      <!-- 积分明细 -->
      <div
        v-if="activeTab === 'points'"
        class="bg-card-bg border border-surface-3 rounded-2xl overflow-hidden"
      >
        <div
          v-if="isLoggedIn === false"
          class="p-5 text-center text-sm text-text-muted"
        >
          {{ t("settings.loginRequired") }}
        </div>
        <div
          v-else-if="pointLogs.length === 0"
          class="p-5 text-center text-sm text-text-muted"
        >
          {{ t("primitives.empty") }}
        </div>
        <div v-else class="divide-y divide-surface-3">
          <div
            v-for="log in pointLogs"
            :key="log.id"
            class="flex items-center justify-between px-5 py-3"
          >
            <div>
              <div class="text-sm text-deep-text">
                {{
                  t(
                    `contributionData.pointLogs.${
                      POINT_LOG_KEYS[log.reason] ?? log.reason
                    }`,
                  )
                }}
              </div>
              <div class="text-xs text-text-muted/60">{{ log.created_at }}</div>
            </div>
            <span
              class="text-sm font-semibold"
              :class="log.delta > 0 ? 'text-green-500' : 'text-red-500'"
            >
              {{ log.delta > 0 ? "+" : "" }}{{ log.delta }}
            </span>
          </div>
        </div>
      </div>

      <!-- 排行榜 -->
      <div
        v-if="activeTab === 'leaderboard'"
        class="bg-card-bg border border-surface-3 rounded-2xl overflow-hidden"
      >
        <div class="flex border-b border-surface-3">
          <button
            v-for="p in ['daily', 'weekly', 'total'] as const"
            :key="p"
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            :class="
              leaderboardPeriod === p
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-deep-text'
            "
            @click="switchPeriod(p)"
          >
            {{ periodLabels[p] }}
          </button>
        </div>
        <div
          v-if="leaderboardEntries.length === 0"
          class="p-5 text-center text-sm text-text-muted"
        >
          {{ t("primitives.empty") }}
        </div>
        <div v-else class="divide-y divide-surface-3">
          <div
            v-for="(entry, index) in leaderboardEntries"
            :key="entry.user_id"
            class="flex items-center gap-3 px-5 py-3"
          >
            <span
              class="w-8 text-center font-bold text-sm"
              :class="
                index === 0
                  ? 'text-yellow-400'
                  : index === 1
                    ? 'text-gray-300 dark:text-gray-400'
                    : index === 2
                      ? 'text-amber-600'
                      : 'text-text-muted/60'
              "
            >
              {{
                index === 0
                  ? "🥇"
                  : index === 1
                    ? "🥈"
                    : index === 2
                      ? "🥉"
                      : index + 1
              }}
            </span>
            <div
              class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm"
            >
              {{ entry.display_name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-deep-text truncate">
                {{ entry.display_name }}
              </div>
              <div class="text-xs text-text-muted/60">
                {{ t(`contributionData.leaderboard.titles.${entry.title}`) }}
              </div>
            </div>
            <span class="text-sm font-semibold text-primary">{{
              t("contribution.pointsSuffix", {
                points: entry.balance.toLocaleString(),
              })
            }}</span>
          </div>
        </div>
      </div>

      <!-- 兑换区 -->
      <div
        v-if="activeTab === 'exchange'"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="item in exchangeItems"
          :key="item.id"
          class="bg-card-bg border border-surface-3 rounded-xl p-5 flex flex-col"
        >
          <div class="flex items-center gap-2 mb-2">
            <span
              class="text-xs px-1.5 py-0.5 rounded-full"
              :class="
                item.is_virtual
                  ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-500'
                  : 'bg-amber-100 dark:bg-amber-950/30 text-amber-500'
              "
            >
              {{
                item.is_virtual
                  ? t("contribution.virtual")
                  : t("contribution.physical")
              }}
            </span>
            <span
              v-if="item.stock > 0 && item.stock < 20"
              class="text-xs text-red-500"
              >{{ t("contribution.lowStock", { stock: item.stock }) }}</span
            >
          </div>
          <h3 class="font-semibold text-deep-text mb-1">
            {{ t(item.name_key) }}
          </h3>
          <p class="text-xs text-text-muted mb-3 flex-1">
            {{ t(item.desc_key) }}
          </p>
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-primary">{{
              t("contribution.pointsCost", { points: item.points_cost })
            }}</span>
            <button
              class="btn-primary px-4 py-1.5 rounded-lg text-sm font-medium"
              :disabled="item.stock === 0"
              @click="handleExchange(item)"
            >
              {{
                item.stock === 0
                  ? t("contribution.soldOut")
                  : t("contribution.exchange")
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- 任务中心 -->
      <div v-if="activeTab === 'tasks'" class="space-y-4">
        <!-- 打卡 -->
        <div
          v-if="isLoggedIn === false"
          class="bg-card-bg border border-surface-3 rounded-2xl p-6 text-center text-sm text-text-muted"
        >
          {{ t("settings.loginRequired") }}
        </div>
        <template v-else>
          <div
            class="bg-card-bg border border-surface-3 rounded-2xl p-6 text-center"
          >
            <div class="text-4xl mb-2">📅</div>
            <h3 class="text-lg font-semibold text-deep-text">
              {{ t("contribution.dailyCheckin") }}
            </h3>
            <p class="text-sm text-text-muted mb-3">
              {{ t("contribution.checkinStreak", { days: checkinStreak }) }}
            </p>
            <button
              class="btn-primary px-8 py-3 rounded-xl text-base font-semibold"
              :class="dailyCheckedIn ? 'opacity-50 cursor-not-allowed' : ''"
              :disabled="dailyCheckedIn"
              @click="doCheckin"
            >
              {{
                dailyCheckedIn
                  ? t("contribution.checkedIn")
                  : t("contribution.checkinReward", { points: checkinReward })
              }}
            </button>
          </div>

          <!-- 任务列表 -->
          <div class="bg-card-bg border border-surface-3 rounded-2xl p-6">
            <h3 class="font-semibold text-deep-text mb-4">
              {{ t("contribution.dailyTasks") }}
            </h3>
            <div class="space-y-3">
              <div
                v-for="task in tasks"
                :key="task.id"
                class="flex items-center gap-3 p-3 rounded-lg border"
                :class="
                  task.completed
                    ? 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-950/10'
                    : 'border-surface-3'
                "
              >
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  :class="
                    task.completed
                      ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white'
                      : 'border-surface-3 text-transparent'
                  "
                >
                  <Icon
                    v-if="task.completed"
                    icon="material-symbols:check"
                    class="w-3 h-3"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div
                    class="text-sm font-medium"
                    :class="
                      task.completed
                        ? 'text-text-muted line-through'
                        : 'text-deep-text'
                    "
                  >
                    {{ t(task.title_key) }}
                  </div>
                  <div class="text-xs text-text-muted/60 mt-0.5">
                    {{ t(task.desc_key) }} ·
                    {{
                      t("contribution.taskReward", {
                        points: task.reward_points,
                      })
                    }}
                  </div>
                  <div class="mt-1.5">
                    <div
                      class="h-1.5 rounded-full bg-surface-3 overflow-hidden w-32"
                    >
                      <div
                        class="h-full rounded-full bg-primary transition-all"
                        :style="{
                          width:
                            (task.current_progress / task.requirement_count) *
                              100 +
                            '%',
                        }"
                      ></div>
                    </div>
                    <span class="text-xs text-text-muted/50"
                      >{{ task.current_progress }}/{{
                        task.requirement_count
                      }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { pointsApi } from "~/lib/api";
import type {
  PointsAchievement,
  PointsExchangeItem,
  PointsLeaderboardEntry,
  PointsLedgerEntry,
  PointsTask,
} from "~/lib/api/modules/points";
import { useAuthStore } from "~/stores/auth";
import { t } from "~/lib/i18n";

// 调试回退开关：默认接真实后端；置 true 时各 tab 展示空态（不拉接口）。
// 方便人工排查接口异常时定位是数据问题还是渲染问题。
const USE_MOCK_FALLBACK = false;

// 积分流水 reason 码：后端为 snake_case，i18n 键为 camelCase。
// 此映射把后端码对应到 `contributionData.pointLogs.*` 的键；
// 未知 reason 回退显示原始码，避免 key 溢出展示（防崩）。
const POINT_LOG_KEYS: Record<string, string> = {
  checkin: "checkin",
  post: "post",
  comment: "comment",
  competition: "competition",
  file_approved: "fileApproved",
  answer_accepted: "answerAccepted",
  daily_task: "dailyTask",
  like: "like",
  qa_accept: "qaAccept", // 回答采纳（QA bounty）
  transfer_out: "transfer", // 积分转出
  transfer_in: "transfer", // 积分转入
};

// 当前用户在排行榜上的称号查找（myUserId 就绪后调用）
async function refreshMyTitle() {
  if (USE_MOCK_FALLBACK || myUserId.value === null) return;
  const res = await pointsApi.getLeaderboard(leaderboardPeriod.value, 50);
  if (res.isOk()) {
    leaderboardMap.value[leaderboardPeriod.value] = res.value.items;
    const me = res.value.items.find((e) => e.user_id === myUserId.value);
    // 即便当前周期不在榜（无 title），也标记为已查，避免反复重查
    myTitle.value = me?.title ?? "";
  }
}

const activeTab = ref("achievements");
const leaderboardPeriod = ref<"daily" | "weekly" | "total">("weekly");
const dailyCheckedIn = ref(false);

// ── 真实数据 ref（snake_case 字段直接来自后端） ──
const loading = ref(true);
const balance = ref(0);
const myUserId = ref<number | null>(null);
const myTitle = ref<string>("");
const achievements = ref<PointsAchievement[]>([]);
const pointLogs = ref<PointsLedgerEntry[]>([]);
const leaderboardMap = ref<
  Record<"daily" | "weekly" | "total", PointsLeaderboardEntry[]>
>({
  daily: [],
  weekly: [],
  total: [],
});
const exchangeItems = ref<PointsExchangeItem[]>([]);
const tasks = ref<PointsTask[]>([]);
const checkinStreak = ref(1);
const checkinReward = ref(5);

const auth = useAuthStore();
const isLoggedIn = computed(() => auth.isLoggedIn);

const pageTabs = [
  {
    key: "achievements",
    label: t("contribution.tabAchievements"),
    icon: "tabler:trophy",
  },
  { key: "points", label: t("contribution.tabPoints"), icon: "tabler:coin" },
  {
    key: "leaderboard",
    label: t("contribution.tabLeaderboard"),
    icon: "tabler:chart-bar",
  },
  {
    key: "exchange",
    label: t("contribution.tabExchange"),
    icon: "tabler:gift",
  },
  { key: "tasks", label: t("contribution.tabTasks"), icon: "tabler:checklist" },
];

const periodLabels = {
  daily: t("contribution.periodDaily"),
  weekly: t("contribution.periodWeekly"),
  total: t("contribution.periodTotal"),
};

// 成就墙：progressPercent 由 progress/threshold 推出
const allAchievements = computed(() =>
  achievements.value.map((ach) => ({
    ...ach,
    progressPercent:
      ach.threshold > 0
        ? Math.min(100, (ach.progress / ach.threshold) * 100)
        : 0,
  })),
);

const leaderboardEntries = computed(
  () => leaderboardMap.value[leaderboardPeriod.value],
);

onMounted(async () => {
  await loadPublic();
  if (auth.isLoggedIn) {
    await loadPrivate();
  }
  loading.value = false;
});

// 公开端点：排行榜 + 兑换项（无需登录）
async function loadPublic() {
  if (USE_MOCK_FALLBACK) return;
  const lbRes = await pointsApi.getLeaderboard(leaderboardPeriod.value, 50);
  if (lbRes.isOk()) {
    leaderboardMap.value[leaderboardPeriod.value] = lbRes.value.items;
    // 尝试在当前排行榜中定位当前用户以显示其称号
    // （首屏时 myUserId 可能尚未就绪，此处定位只是尽力而为，真正的 title 查找
    //   在 loadPrivate 赋值 myUserId 后经 refreshMyTitle 完成）
    if (myUserId.value !== null && myTitle.value === "") {
      const me = lbRes.value.items.find((e) => e.user_id === myUserId.value);
      if (me) myTitle.value = me.title;
    }
  }
  const exRes = await pointsApi.getExchangeItems();
  if (exRes.isOk()) exchangeItems.value = exRes.value;
}

// 私有端点：余额 / 流水 / 成就 / 任务（需登录，401 时降级为空态）
async function loadPrivate() {
  if (USE_MOCK_FALLBACK) return;
  const meRes = await pointsApi.getBalance();
  if (meRes.isOk()) {
    balance.value = meRes.value.balance;
    myUserId.value = meRes.value.user_id;
    // myUserId 就绪，补一次当前周期 title 查找（首屏时 loadPublic 里找过了也
    // 没关系，这里确保徽章在其依赖值就绪后必然拿到）
    await refreshMyTitle();
  }
  const ledgerRes = await pointsApi.getLedger(1, 20);
  if (ledgerRes.isOk()) pointLogs.value = ledgerRes.value.items;
  const achRes = await pointsApi.getAchievements();
  if (achRes.isOk()) achievements.value = achRes.value;
  const taskRes = await pointsApi.getTasks();
  if (taskRes.isOk()) {
    tasks.value = taskRes.value;
    const checkinTask = taskRes.value.find((t2) => t2.category === "checkin");
    if (checkinTask) dailyCheckedIn.value = checkinTask.completed;
  }
}

// 排行榜周期切换：重新拉取对应 period
async function switchPeriod(p: "daily" | "weekly" | "total") {
  leaderboardPeriod.value = p;
  if (USE_MOCK_FALLBACK) return;
  const res = await pointsApi.getLeaderboard(p, 50);
  if (res.isOk()) {
    leaderboardMap.value[p] = res.value.items;
    // 切换周期时同步刷新当前用户在榜 title（myTitle 依赖 leaderboardPeriod）
    if (myUserId.value !== null) {
      const me = res.value.items.find((e) => e.user_id === myUserId.value);
      myTitle.value = me?.title ?? "";
    }
  }
}

async function doCheckin() {
  if (USE_MOCK_FALLBACK) {
    dailyCheckedIn.value = true;
    return;
  }
  const res = await pointsApi.checkin();
  if (res.isOk()) {
    // 成功后不能再打今日卡（后端 today_checked 反映的是调用前状态，成功即视为已打）
    dailyCheckedIn.value = true;
    checkinStreak.value = res.value.checkin_streak || 1;
    // 打卡 +N 有额外积分则刷新余额与任务状态
    if (res.value.earned > 0) {
      const meRes = await pointsApi.getBalance();
      if (meRes.isOk()) balance.value = meRes.value.balance;
    }
    const taskRes = await pointsApi.getTasks();
    if (taskRes.isOk()) {
      tasks.value = taskRes.value;
      const checkinTask = taskRes.value.find((t2) => t2.category === "checkin");
      if (checkinTask) dailyCheckedIn.value = checkinTask.completed;
    }
  }
}

function handleExchange(item: PointsExchangeItem) {
  alert(
    t("contribution.exchangeSuccess", {
      points: item.points_cost,
      name: t(item.name_key),
    }),
  );
}
</script>
