import Dexie, { type EntityTable } from "dexie";
import type {
  Question,
  Folder,
  PracticeSession,
  AiAgent,
  AiMessage,
  SyncOp,
} from "~/features/starhope/types";

const db = new Dexie("starhope") as Dexie & {
  questions: EntityTable<Question, "id">;
  folders: EntityTable<Folder, "id">;
  practiceSessions: EntityTable<PracticeSession, "id">;
  aiAgents: EntityTable<AiAgent, "id">;
  aiMessages: EntityTable<AiMessage, "id">;
  syncOps: EntityTable<SyncOp, "id">;
};

db.version(2).stores({
  questions: "id, userId, folderId, type, difficulty, tags, createdAt",
  folders: "id, userId, parentId",
  practiceSessions: "id, userId, type, status",
  aiAgents: "id, userId",
  aiMessages: "id, agentId, timestamp",
});

db.version(3).stores({
  syncOps: "++id, entity, entityId, op, updatedAt",
});

// 版本 4：修正 questions.tags 的索引声明。
// IndexedDB 默认把数组值当成「单一复合键」，普通索引下 where("tags").equals(x)
// 永远匹配不到记录（等于索引白建）；数组字段必须用 multiEntry（`*tags`）。
// 注：暂不加复合索引 [userId+folderId]——loadQuestions 目前是拿 userId 索引后再在内存里
// 过滤 folderId，索引建了也不会被用到，反而又添一个空转索引；等查询改成
// where("[userId+folderId]") 时再加（那处在 stores/question-bank.ts，不在本次改动范围）。
db.version(4).stores({
  questions: "id, userId, folderId, type, difficulty, *tags, createdAt",
});

// 生命周期处理：schema 是带版本号的（v2→v3 加 syncOps、v3→v4 改索引），
// 旧标签页持有连接时新标签页的 upgrade 会被 blocked 卡住，Dexie 只会抛一个
// open 失败且无人接收。这里显式让出连接 + 打开失败可见化。
db.on("versionchange", () => {
  // 另一标签页要升级：关掉本连接，否则对方一直 blocked
  db.close();
});
db.on("blocked", () => {
  console.warn(
    "[starhope] IndexedDB 升级被其它标签页阻塞：请关闭其它 Starhope 页面后刷新",
  );
});

// 仅在浏览器主动 open：SSR 没有 indexedDB，主动打开只会得到必然失败的 rejection。
// 主动 open 的作用是把「打不开」变成有日志的失败，而不是等到首个查询才炸。
if (typeof window !== "undefined") {
  void db.open().catch((err) => {
    console.error("[starhope] IndexedDB 打开失败，本地数据将不可用:", err);
  });
}

export { db };
