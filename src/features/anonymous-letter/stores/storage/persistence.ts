// 统一维护 localStorage 键名、读写降级及备份格式。

export const KEYS: Record<string, string> = {
  letters: "th_letters", // 我发布的信件列表
  replies: "th_replies", // 回信对话（含收到/发出）
  favorites: "th_favorites", // 收藏信件 id 列表
  favGroups: "th_fav_groups", // 收藏夹分组
  drafts: "th_drafts", // 本地草稿
  settings: "th_settings", // 全局设置（主题/字体/静音/加密等）
  blocked: "th_blocked", // 屏蔽的匿名代号
  reported: "th_reported", // 已举报记录
  postLog: "th_post_log", // 投稿时间记录（频率限制）
  inbox: "th_inbox", // 收到的回信弹窗提醒队列
  bottles: "th_bottles", // 漂流瓶
  wishes: "th_wishes", // 许愿墙
  moodLog: "th_mood_log", // 月度情绪记录 { month, mood, count }
  notify: "th_notify_log", // 桌面通知历史
  sketches: "th_sketches", // 涂鸦手写信纸（dataURL）
};

/** SSR 环境下无 localStorage，任何读写都应安全兜底，避免 ReferenceError。 */
const hasLocalStorage =
  typeof window !== "undefined" && typeof localStorage !== "undefined";

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = hasLocalStorage ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    console.warn("[storage] 读取 key 失败:", key, err);
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  if (!hasLocalStorage) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // 配额超限（涂鸦 dataURL、通知日志）或值不可序列化（循环引用）时，
    // 抛出会打断调用方后续逻辑，与 read() 一样降级为告警
    console.warn("[storage] 写入 key 失败:", key, err);
  }
}

// 深拷贝，避免引用污染
export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// ---------- 备份 / 导入导出 ----------
export function exportAll(): string {
  const backup: Record<string, unknown> = {};
  Object.keys(KEYS).forEach((k) => {
    backup[k] = read(KEYS[k], null);
  });
  backup.__meta = {
    app: "shiguang-treehole",
    version: 1,
    exportedAt: Date.now(),
  };
  return JSON.stringify(backup, null, 2);
}
/** 各 key 期望的容器类型：除 settings 为对象外其余都是数组。 */
const ARRAY_KEYS = new Set([
  "letters",
  "replies",
  "favorites",
  "favGroups",
  "drafts",
  "blocked",
  "reported",
  "postLog",
  "inbox",
  "bottles",
  "wishes",
  "moodLog",
  "notify",
  "sketches",
]);

export function importAll(json: string): boolean {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(json) as Record<string, unknown>;
  } catch (err) {
    console.warn("[storage] 导入备份解析失败:", err);
    return false;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    console.warn("[storage] 导入备份不是对象:", typeof data);
    return false;
  }

  // 备份可能损坏或被篡改：先逐个校验形状再落库，
  // 否则一个坏文件会被原样写进全部 storage key，把本地数据整体冲掉。
  // null 视为「该键无数据」（exportAll 用 read(..., null) 作兜底），跳过而非报错。
  for (const k of Object.keys(KEYS)) {
    const v = data[k];
    if (v === undefined || v === null) continue;
    const ok = ARRAY_KEYS.has(k)
      ? Array.isArray(v)
      : typeof v === "object" && !Array.isArray(v);
    if (!ok) {
      console.warn("[storage] 导入备份字段形状不符:", k);
      return false;
    }
  }

  Object.keys(KEYS).forEach((k) => {
    if (data[k] !== undefined) write(KEYS[k], data[k]);
  });
  return true;
}

// ---------- 清空全部本地数据 ----------
export function resetAll(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
