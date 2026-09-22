<script setup lang="ts">
// 后台控制台趋势图 —— ECharts 按需引入，双系列折线（每日新增注册 / 新增帖子），14 天，浅色。
//
// 说明：echarts@6.1.0 的 `echarts/core`（伪模块）重导出官方 types/dist 类型，`init`/`use`
// 为函数、`EChartsCoreOption`（即 ECBasicOption）类型可显式标注，故沿用 v5 的按需写法即可。
// 只注册用到的 LineChart + Grid/Tooltip/Legend/Title 组件 + CanvasRenderer，避免打包全量图标。
import { ref, shallowRef, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";
import { adminFetch, readAdminResp } from "~/lib/api/admin";
import { t } from "~/lib/i18n";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
]);

interface TrendItem {
  date: string;
  user_delta: number;
  post_delta: number;
}

const el = ref<HTMLDivElement | null>(null);
const chart = shallowRef<ReturnType<typeof echarts.init> | null>(null);
const error = ref("");
const loading = ref(true);

// 卸载后请求才返回时不能再建图表：onBeforeUnmount 已经 dispose，
// 这里再 init 会在已脱离文档的元素上留下一个永不释放的 ECharts 实例
let disposed = false;
// ECharts canvas 只在 init 时按容器尺寸定尺：后台侧边栏折叠/窗口缩放都不会自适应
let resizeObserver: ResizeObserver | null = null;

function render(opt: EChartsCoreOption) {
  if (disposed || !el.value) return;
  if (!chart.value) chart.value = echarts.init(el.value);
  chart.value.setOption(opt);
}

onMounted(async () => {
  try {
    const res = await adminFetch("/api/v1/admin/stats/trend?days=14");
    const body = await readAdminResp(res);
    if (disposed) return;
    // 无数据时 items 为空仍渲染空折线，不报错
    const items = ((body.data as { items?: TrendItem[] }).items ??
      []) as TrendItem[];
    // 图表容器在模板里是 v-else：loading 为 true 时 el.value 仍是 null，render() 会静默 return
    // 且再无第二次调用。必须先摘掉 loading 并等 DOM 更新完再渲染。
    loading.value = false;
    await nextTick();
    render({
      tooltip: { trigger: "axis" },
      legend: { data: [t("admin.trend.users"), t("admin.trend.posts")] },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: { type: "category", data: items.map((i) => i.date) },
      yAxis: { type: "value", minInterval: 1 },
      series: [
        {
          name: t("admin.trend.users"),
          type: "line",
          smooth: true,
          data: items.map((i) => i.user_delta),
        },
        {
          name: t("admin.trend.posts"),
          type: "line",
          smooth: true,
          data: items.map((i) => i.post_delta),
        },
      ],
    });
    if (el.value) {
      resizeObserver = new ResizeObserver(() => chart.value?.resize());
      resizeObserver.observe(el.value);
    }
  } catch (e) {
    if (!disposed)
      error.value = e instanceof Error ? e.message : t("admin.loadFailed");
  } finally {
    if (!disposed) loading.value = false;
  }
});

onBeforeUnmount(() => {
  disposed = true;
  resizeObserver?.disconnect();
  resizeObserver = null;
  chart.value?.dispose();
  chart.value = null;
});
</script>

<template>
  <div>
    <div v-if="error" class="text-sm text-red-500 mb-4">{{ error }}</div>
    <div v-if="loading" class="h-72 animate-pulse bg-card-bg rounded-xl" />
    <div v-else-if="!error" ref="el" class="h-72 w-full" />
  </div>
</template>
