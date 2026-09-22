<template>
  <!-- 数据备份 / 导入导出 -->
  <div class="backup glass">
    <h3>{{ t("treehole.backup.title") }}</h3>
    <p class="bk-tip">{{ t("treehole.backup.desc") }}</p>
    <div class="bk-actions">
      <button class="chip" @click="exportData">
        {{ t("treehole.backup.exportBtn") }}
      </button>
      <button class="chip" @click="triggerImport">
        {{ t("treehole.backup.importBtn") }}
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json"
        hidden
        @change="onImport"
      />
    </div>
    <div v-if="msg" class="bk-msg">{{ msg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import * as store from "../stores/storage";
import { t } from "~/lib/i18n";

const fileInput = ref<HTMLInputElement | null>(null);
const msg = ref("");

/** 备份文件大小上限：accept 只是提示，超大文件读进内存会先卡死标签页 */
const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

function exportData() {
  const json = store.exportAll();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shiguang-backup-${new Date().toISOString().slice(0, 10)}.json`;
  // 必须挂进文档才能保证 a.click() 在各浏览器都生效；并在点击后异步回收 objectURL
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  msg.value = t("treehole.backup.exported");
}
function triggerImport() {
  fileInput.value?.click();
}
function onImport(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > MAX_BACKUP_BYTES) {
    msg.value = t("treehole.backup.importFail");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  // 读取失败（文件被移动/权限问题）此前完全没有反馈，面板保持静默
  reader.onerror = () => {
    msg.value = t("treehole.backup.importFail");
  };
  reader.onload = () => {
    // readAsText 的结果类型是 string | ArrayBuffer | null，不能直接喂给 importAll(string)
    if (typeof reader.result !== "string") {
      msg.value = t("treehole.backup.importFail");
      return;
    }
    // 导入会按 key 覆写全部本地数据，必须先确认（缺专用 i18n key，字典文件不在本单元）
    if (!window.confirm("导入备份将覆盖当前本地数据，确定继续？")) return;
    // importAll 现在会做形状校验并返回是否成功，不能再无条件报成功
    if (store.importAll(reader.result)) {
      msg.value = t("treehole.backup.importSuccess");
      // 各组件内存里仍是导入前的数据，刷新一次才真正生效（否则界面看起来没变化、用户会重复导入）
      setTimeout(() => location.reload(), 600);
    } else {
      msg.value = t("treehole.backup.importFail");
    }
  };
  reader.readAsText(file);
  input.value = "";
}
</script>

<style scoped>
.backup {
  padding: 18px;
  border-radius: var(--radius);
}
.backup h3 {
  margin: 0 0 6px;
  font-size: 16px;
}
.bk-tip {
  font-size: 12px;
  color: var(--text-sub);
  margin: 0 0 12px;
}
.bk-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.bk-msg {
  margin-top: 10px;
  font-size: 12px;
  color: var(--accent);
}
</style>
