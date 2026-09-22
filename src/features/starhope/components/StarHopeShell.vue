<script setup lang="ts">
import { watch } from "vue";
import StarHopeLayout from "./StarHopeLayout.vue";
import StarHopeRouter from "./StarHopeRouter.vue";
import { useAuthStore } from "../stores/auth";
import { flush, pullAll } from "../sync/sync";
import { db } from "../stores/db";

const { userId, restore } = useAuthStore();

// 恢复主站登录态，确保进入 StarHope 时已识别登录状态（否则 AuthGuard 会误判未登录）
restore();

// 本地库当前归属的账号 id（持久化，跨页面刷新有效）
const LOCAL_OWNER_KEY = "starhope-local-owner";

async function purgeLocalData(): Promise<void> {
  // 先把 outbox 里待推送的操作尽力刷到服务端，避免清库丢掉尚未同步的本地改动
  try {
    await flush();
  } catch {
    /* 下线/网络异常时忽略，继续清库 */
  }
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
  // pull 游标也要清：本地已空却仍带 since，换号后只会增量拉取，
  // 会漏掉该账号在 lastSyncAt 之前的全部历史数据
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("starhope-sync:")) localStorage.removeItem(key);
  }
}

// 监听账号 id 而非布尔登录态：退出/换号时先清空本地 IndexedDB，
// 否则 pullAll 的 mergePull 会保留「仅本地存在」的行，共享浏览器上
// 后一个用户能看到前一个用户的本地数据。
watch(
  userId,
  async (id) => {
    // client:load 组件在 SSR 也会执行 setup，此时没有 localStorage/IndexedDB
    if (typeof window === "undefined") return;
    const current = id ?? "";
    if (localStorage.getItem(LOCAL_OWNER_KEY) !== current) {
      await purgeLocalData();
      localStorage.setItem(LOCAL_OWNER_KEY, current);
    }
    // pullAll 只吞掉各 entity 的 Result 错误，IndexedDB 抛错（toArray/bulkPut 失败）仍会
    // reject 整个 promise：这里是它唯一的调用点，不兜住就是未处理拒绝且用户毫无反馈
    if (id) {
      void pullAll().catch((e) => console.error("[starhope] 初始同步失败", e));
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="starhope-app min-h-screen bg-page-bg text-default">
    <StarHopeLayout>
      <StarHopeRouter />
    </StarHopeLayout>
  </div>
</template>
