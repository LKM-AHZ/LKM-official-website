// 历史本地信件、私聊、漂流瓶和愿望；新增共享内容由 stores/api.ts 访问后端。
import { randomCodename } from "../../utils/codename";
import { t } from "~/lib/i18n";
import type { Letter, Conversation, ReplyMessage, Bottle, Wish } from "./types";
import { KEYS, read, write } from "./persistence";

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
