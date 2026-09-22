// =============================================================
// 本地存储数据层 (localStorage)
// 全程纯前端，无任何后端账号，数据仅存于用户本地浏览器
// 包含：信件、回信、收藏/分组、草稿、设置、屏蔽、举报、频率、收件箱、
//       漂流瓶、许愿墙、月度情绪、备份、桌面通知、涂鸦手写信纸、本地加密
// =============================================================

import { randomCodename } from "../utils/codename";
import { t } from "~/lib/i18n";

// ---------- 类型定义 ----------

export interface Letter {
  id: string;
  status: "scheduled" | "published" | "sealed";
  scheduledAt?: number;
  publishedAt?: number;
  sealUntil?: number;
  scheduledPrivacy?: string;
  privacy?: string;
  [key: string]: unknown;
}

export interface Draft {
  id: string;
  [key: string]: unknown;
}

export interface ReplyMessage {
  id: string;
  recalled?: boolean;
  text: string;
  [key: string]: unknown;
}

export interface Conversation {
  id: string;
  myLetterId: string;
  peerLetterId: string;
  peerCodename: string;
  myCodename: string;
  messages: ReplyMessage[];
  blocked: boolean;
  updatedAt: number;
}

export interface TreeholeSettings {
  theme: "day" | "night";
  fontScale: "small" | "normal" | "large";
  muted: boolean;
  lowPerf: boolean;
  highContrast: boolean;
  privacyAccepted: boolean;
  accent: string;
  accent2: string;
  rateLimit: number;
  audioOn: boolean;
  notifyDesktop: boolean;
  bgmVolume: number;
}

export interface FavGroup {
  id: string;
  name: string;
  ids: string[];
}

export interface Bottle {
  id: string;
  picked?: boolean;
  ownerId?: string;
  reply?: string;
  repliedAt?: number;
  [key: string]: unknown;
}

export interface Wish {
  id: string;
  lights?: number;
  [key: string]: unknown;
}

export interface MoodRecord {
  month: string;
  mood: string;
  count: number;
}

export interface Sketch {
  id: string;
  dataUrl: string;
  at: number;
}

// ---------- 常量 ----------

const KEYS: Record<string, string> = {
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

function read<T>(key: string, fallback: T): T {
  try {
    const raw = hasLocalStorage ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    console.warn("[storage] 读取 key 失败:", key, err);
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
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

// ---------- 轻量本地加密 (AES-GCM via Web Crypto) ----------
// 密钥派生用 PBKDF2-SHA256 + 每份载荷独立随机 salt。此前直接把 padPass 的结果当密钥：
// 超长口令被静默截断（不同长口令撞成同一把密钥）、短口令用固定公开常量补位，密钥熵极低。
// 新载荷格式 enc2:salt:iv:ct；解密仍兼容历史 enc: 载荷（旧 padPass 直填密钥）。
const PBKDF2_ITERATIONS = 210_000;

async function deriveKey(
  pass: string,
  salt: Uint8Array,
  usage: KeyUsage,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(pass),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      // 传底层 ArrayBuffer：Uint8Array<ArrayBufferLike> 不在 lib.dom 的 BufferSource 里
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  );
}
export async function encryptText(text: string, pass: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pass, salt, "encrypt");
    const ct = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(text),
    );
    return (
      "enc2:" +
      b64(arrayBufferToBase64(salt.buffer as ArrayBuffer)) +
      ":" +
      b64(arrayBufferToBase64(iv.buffer as ArrayBuffer)) +
      ":" +
      b64(arrayBufferToBase64(ct))
    );
  } catch (err) {
    // 不能像以前那样返回明文：调用方会把它当密文存进 storage，
    // 之后再也分不出到底有没有加密过，只会静默泄露内容
    console.warn("[storage] 加密失败:", err);
    throw err;
  }
}
export async function decryptText(
  payload: string,
  pass: string,
): Promise<string | null> {
  try {
    if (!payload) return payload;
    const enc = new TextEncoder();
    if (payload.startsWith("enc2:")) {
      const [, saltB64, ivB64, ctB64] = payload.split(":");
      const salt = new Uint8Array(base64ToArrayBuffer(unb64(saltB64)));
      const iv = new Uint8Array(base64ToArrayBuffer(unb64(ivB64)));
      const ct = new Uint8Array(base64ToArrayBuffer(unb64(ctB64)));
      const key = await deriveKey(pass, salt, "decrypt");
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      return new TextDecoder().decode(pt);
    }
    if (payload.startsWith("enc:")) {
      const [, ivB64, ctB64] = payload.split(":");
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(padPass(pass)),
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );
      const iv = new Uint8Array(base64ToArrayBuffer(unb64(ivB64)));
      const ct = new Uint8Array(base64ToArrayBuffer(unb64(ctB64)));
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      return new TextDecoder().decode(pt);
    }
    // 非密文（历史明文）原样返回
    return payload;
  } catch (err) {
    // 解密失败返回 null 而不是本地化文案：文案会被当成真实内容继续存/显示
    console.warn("[storage] 解密失败:", err);
    return null;
  }
}
function padPass(p: string): string {
  return (p || "").padEnd(32, "🌙").slice(0, 32);
}
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function base64ToArrayBuffer(b64str: string): ArrayBuffer {
  const bin = atob(b64str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
// 仅用于混淆存储（非强加密）
function b64(s: string): string {
  return btoa(encodeURIComponent(s));
}
function unb64(s: string): string {
  return decodeURIComponent(atob(s));
}

// ---------- 信件 ----------
export function getLetters(): Letter[] {
  return read<Letter[]>(KEYS.letters, []);
}
export function saveLetters(list: Letter[]): void {
  write(KEYS.letters, list);
}
export function addLetter(letter: Letter): Letter {
  const list = getLetters();
  list.unshift(letter);
  saveLetters(list);
  return letter;
}
export function updateLetter(id: string, patch: Partial<Letter>): void {
  const list = getLetters();
  const idx = list.findIndex((l) => l.id === id);
  if (idx > -1) {
    list[idx] = { ...list[idx], ...patch };
    saveLetters(list);
  }
}
export function deleteLetter(id: string): void {
  let list = getLetters();
  list = list.filter((l) => l.id !== id);
  saveLetters(list);
}
// 定时发布：到时间后转为公开可见
export function publishScheduled(): boolean {
  const list = getLetters();
  let changed = false;
  list.forEach((l) => {
    if (
      l.scheduledAt &&
      l.scheduledAt <= Date.now() &&
      l.status === "scheduled"
    ) {
      l.status = "published";
      l.publishedAt = Date.now();
      l.privacy = l.scheduledPrivacy || "public";
      changed = true;
    }
  });
  if (changed) saveLetters(list);
  return changed;
}
// 限时封存：到时间后自动隐藏/封存
export function sealExpired(): boolean {
  const list = getLetters();
  let changed = false;
  list.forEach((l) => {
    if (l.sealUntil && l.sealUntil <= Date.now() && l.status !== "sealed") {
      l.status = "sealed";
      changed = true;
    }
  });
  if (changed) saveLetters(list);
  return changed;
}

// ---------- 收藏 + 分组 ----------
export function getFavorites(): string[] {
  return read<string[]>(KEYS.favorites, []);
}
export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  const i = favs.indexOf(id);
  if (i > -1) favs.splice(i, 1);
  else favs.push(id);
  write(KEYS.favorites, favs);
  return favs.includes(id);
}
export function getFavGroups(): FavGroup[] {
  const groups = read<FavGroup[]>(KEYS.favGroups, []);
  // default 组是 getFavorites() 的派生视图（写入路径刻意不落库），必须每次都补回：
  // 原先只在「存储为空」时补，用户一旦建了自定义分组，默认收藏组就整个消失、
  // 里面的收藏项无处显示，与 toggleFavorite 维护的列表也对不上
  return [
    { id: "default", name: "默认收藏", ids: getFavorites() },
    ...groups.filter((g) => g.id !== "default"),
  ];
}
export function saveFavGroups(groups: FavGroup[]): void {
  write(KEYS.favGroups, groups);
}
export function addFavGroup(name: string): FavGroup[] {
  const groups = getFavGroups().filter((g) => g.id !== "default");
  groups.push({ id: "g_" + Date.now(), name, ids: [] });
  write(KEYS.favGroups, groups);
  return groups;
}
export function moveFavToGroup(id: string, groupId: string): void {
  const groups = getFavGroups().map((g) => {
    if (g.id === "default") return g;
    const ids = g.ids.filter((x) => x !== id);
    if (g.id === groupId) ids.push(id);
    return { ...g, ids };
  });
  saveFavGroups(groups.filter((g) => g.id !== "default"));
}
export function deleteFavGroup(groupId: string): void {
  const groups = getFavGroups().filter(
    (g) => g.id !== groupId && g.id !== "default",
  );
  saveFavGroups(groups);
}

// ---------- 草稿 ----------
export function getDrafts(): Draft[] {
  return read<Draft[]>(KEYS.drafts, []);
}
export function saveDraft(draft: Draft): void {
  const drafts = getDrafts();
  const i = drafts.findIndex((d) => d.id === draft.id);
  if (i > -1) drafts[i] = draft;
  else drafts.unshift(draft);
  write(KEYS.drafts, drafts);
}
export function deleteDraft(id: string): void {
  let drafts = getDrafts();
  drafts = drafts.filter((d) => d.id !== id);
  write(KEYS.drafts, drafts);
}

// 仅清空本地草稿
export function resetDrafts(): void {
  write(KEYS.drafts, []);
}

// ---------- 回信对话 ----------
export function getReplies(): Conversation[] {
  return read<Conversation[]>(KEYS.replies, []);
}
export function saveReplies(list: Conversation[]): void {
  write(KEYS.replies, list);
}
export function getOrCreateConversation(
  myLetterId: string,
  peerCodename: string,
  peerLetterId: string,
): Conversation {
  const list = getReplies();
  let conv = list.find((c) => c.peerLetterId === peerLetterId);
  if (!conv) {
    conv = {
      id: "conv_" + Date.now() + Math.floor(Math.random() * 1000),
      myLetterId,
      peerLetterId,
      peerCodename,
      myCodename: randomCodename(),
      messages: [],
      blocked: false,
      updatedAt: Date.now(),
    };
    list.unshift(conv);
    saveReplies(list);
  }
  return conv;
}
export function appendMessage(convId: string, msg: ReplyMessage): void {
  const list = getReplies();
  const conv = list.find((c) => c.id === convId);
  if (conv) {
    conv.messages.push(msg);
    conv.updatedAt = Date.now();
    saveReplies(list);
  }
}
// 私聊撤回
export function recallMessage(convId: string, msgId: string): void {
  const list = getReplies();
  const conv = list.find((c) => c.id === convId);
  if (conv) {
    const m = conv.messages.find((x) => x.id === msgId);
    if (m) {
      m.recalled = true;
      m.text = t("treeholeData.messages.recalled");
    }
    saveReplies(list);
  }
}
export function blockConversation(convId: string): void {
  const list = getReplies();
  const conv = list.find((c) => c.id === convId);
  if (conv) {
    conv.blocked = true;
    saveReplies(list);
  }
}
export function clearConversation(convId: string): void {
  const list = getReplies();
  const conv = list.find((c) => c.id === convId);
  if (conv) {
    conv.messages = [];
    saveReplies(list);
  }
}
export function deleteConversation(convId: string): void {
  let list = getReplies();
  list = list.filter((c) => c.id !== convId);
  saveReplies(list);
}

// 收件箱提醒队列
export function getInbox(): unknown[] {
  return read<unknown[]>(KEYS.inbox, []);
}
export function pushInbox(item: unknown): void {
  const list = getInbox();
  list.unshift(item);
  // 队列长度封顶，与 pushNotify(50)/saveSketch(30) 对齐：离线优先应用里无界增长迟早撑到
  // localStorage QuotaExceededError
  write(KEYS.inbox, list.slice(0, 50));
}
export function clearInbox(): void {
  write(KEYS.inbox, []);
}

// ---------- 设置 ----------
const DEFAULT_SETTINGS: TreeholeSettings = {
  theme: "day", // day | night
  fontScale: "normal", // small | normal | large
  muted: false, // 全站动效静音
  lowPerf: false, // 低性能设备：关闭重特效
  highContrast: false, // 高对比度护眼模式
  privacyAccepted: false,
  accent: "#e8a87c", // 自定义主题强调色
  accent2: "#c3aed6",
  rateLimit: 3, // 投稿限流：每分钟最多 N 封（可自定义）
  audioOn: false, // 白噪音背景音乐
  notifyDesktop: false, // 浏览器桌面通知
  bgmVolume: 0.4,
};
export function getSettings(): TreeholeSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...read<Partial<TreeholeSettings>>(KEYS.settings, {}),
  };
}
export function saveSettings(
  patch: Partial<TreeholeSettings>,
): TreeholeSettings {
  const s = { ...getSettings(), ...patch };
  write(KEYS.settings, s);
  return s;
}

// ---------- 屏蔽 ----------
export function getBlocked(): string[] {
  return read<string[]>(KEYS.blocked, []);
}
export function addBlocked(codename: string): void {
  const b = getBlocked();
  if (!b.includes(codename)) b.push(codename);
  write(KEYS.blocked, b);
}

// ---------- 举报 ----------
export function getReported(): string[] {
  return read<string[]>(KEYS.reported, []);
}
export function addReported(id: string): void {
  const r = getReported();
  if (!r.includes(id)) r.push(id);
  write(KEYS.reported, r);
}

// ---------- 投稿频率限制（自定义） ----------
export function getPostLog(): number[] {
  return read<number[]>(KEYS.postLog, []);
}
export function canPost(): boolean {
  const limit = getSettings().rateLimit || 3;
  const log = getPostLog();
  const now = Date.now();
  const window = 60 * 1000;
  const recent = log.filter((ts) => now - ts < window);
  return recent.length < limit;
}
export function logPost(): void {
  const log = getPostLog().filter((ts) => Date.now() - ts < 60 * 60 * 1000);
  log.push(Date.now());
  write(KEYS.postLog, log);
}

// ---------- 漂流瓶 ----------
export function getBottles(): Bottle[] {
  return read<Bottle[]>(KEYS.bottles, []);
}
export function saveBottles(list: Bottle[]): void {
  write(KEYS.bottles, list);
}
export function addBottle(b: Bottle): Bottle {
  const list = getBottles();
  list.unshift(b);
  saveBottles(list);
  return b;
}
export function pickBottle(): Bottle | null {
  const list = getBottles().filter(
    (b) => !b.picked && b.ownerId !== "me_local",
  );
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}
export function markBottlePicked(id: string, reply: string): void {
  const list = getBottles();
  const b = list.find((x) => x.id === id);
  if (b) {
    b.picked = true;
    b.reply = reply;
    b.repliedAt = Date.now();
  }
  saveBottles(list);
}

// ---------- 许愿墙 ----------
export function getWishes(): Wish[] {
  return read<Wish[]>(KEYS.wishes, []);
}
export function saveWishes(list: Wish[]): void {
  write(KEYS.wishes, list);
}
export function addWish(w: Wish): Wish {
  const list = getWishes();
  list.unshift(w);
  saveWishes(list);
  return w;
}
export function lightWish(id: string): void {
  const list = getWishes();
  const w = list.find((x) => x.id === id);
  if (w) {
    w.lights = (w.lights || 0) + 1;
    saveWishes(list);
  }
}

// ---------- 月度情绪图表 ----------
export function getMoodLog(): MoodRecord[] {
  return read<MoodRecord[]>(KEYS.moodLog, []);
}
export function logMood(mood: string): void {
  const list = getMoodLog();
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const rec = list.find((r) => r.month === month && r.mood === mood);
  if (rec) rec.count++;
  else list.push({ month, mood, count: 1 });
  write(KEYS.moodLog, list);
}
export function moodByMonth(month?: string): MoodRecord[] {
  return getMoodLog().filter(
    (r) => r.month === (month || new Date().toISOString().slice(0, 7)),
  );
}

// ---------- 桌面通知 ----------
export function getNotifyLog(): unknown[] {
  return read<unknown[]>(KEYS.notify, []);
}
export function pushNotify(n: unknown): void {
  const list = getNotifyLog();
  list.unshift(n);
  write(KEYS.notify, list.slice(0, 50));
}
export function notifyDesktop(title: string, body: string): void {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body });
      pushNotify({ title, body, at: Date.now() });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") {
          new Notification(title, { body });
          pushNotify({ title, body, at: Date.now() });
        }
      });
    }
  } catch (err) {
    console.warn("[storage] 桌面通知失败:", err);
  }
}

// ---------- 涂鸦手写信纸 ----------
export function getSketches(): Sketch[] {
  return read<Sketch[]>(KEYS.sketches, []);
}
export function saveSketch(dataUrl: string): void {
  const list = getSketches();
  list.unshift({ id: "sk_" + Date.now(), dataUrl, at: Date.now() });
  write(KEYS.sketches, list.slice(0, 30));
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
