// 个人草稿、收藏夹、情绪、桌面通知和手写信纸。
import type { Draft, FavGroup, MoodRecord, Sketch } from "./types";
import { KEYS, read, write } from "./persistence";

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
