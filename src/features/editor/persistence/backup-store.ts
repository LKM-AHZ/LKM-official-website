import { ok, err } from "neverthrow";
import type { Result } from "neverthrow";
import { AppError } from "./document-store";
import { t } from "~/lib/i18n";

const DB_NAME = "lkm-editor-backup";
const DB_VERSION = 1;
const STORE_NAME = "snapshots";
const MAX_SNAPSHOTS = 30;

export interface BackupData {
  id?: number;
  docId: string;
  title: string;
  contentMdx: string;
  editorJson: unknown;
  status: string;
  version: number;
  timestamp: string;
}

export interface BackupMeta {
  id: number;
  docId: string;
  title: string;
  timestamp: string;
}

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("docId", "docId", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("[backup-store] IndexedDB 打开失败:", request.error);
        resolve(null);
      };
    } catch (err) {
      console.warn("[backup-store] IndexedDB 不可用:", err);
      resolve(null);
    }
  });
}

export async function saveBackup(
  docId: string,
  data: BackupData,
): Promise<Result<void, AppError>> {
  // db 提到 try 外面：中间任何一步抛错都要能关掉连接，否则每次失败都泄漏一个连接
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    if (!db)
      return err(
        new AppError(
          "DB_OPEN_FAILED",
          t("editor.persistence.indexedDbUnavailable"),
        ),
      );
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add({ ...data, docId, timestamp: new Date().toISOString() });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await cleanOldSnapshots(db);
    return ok(undefined);
  } catch (e) {
    console.warn("[backup-store] 备份写入失败:", e);
    return err(
      new AppError("BACKUP_FAILED", t("editor.persistence.backupFailed"), e),
    );
  } finally {
    db?.close();
  }
}

/**
 * 快照总量上限是**全局**的（所有文档共享 30 条），不是每文档 30 条：
 * 这是刻意的存储上界，代价是文档多时会给别的文档腾位。要改成按文档保留，
 * 需要先定「每文档保留多少条」的策略（总量会随之失去上界）。
 */
async function cleanOldSnapshots(db?: IDBDatabase): Promise<void> {
  const database = db || (await openDB());
  if (!database) return;
  try {
    const tx = database.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    // count 与 cursor 必须在同一个事务里连续发起：先 await count 再开游标时，
    // 事务可能已经自动提交，openCursor 会抛 InvalidStateError 让清理被整段跳过。
    // 另外必须等到 tx.oncomplete 才算清理完成 —— saveBackup 紧接着就会 db.close()。
    await new Promise<void>((resolve, reject) => {
      const countReq = store.count();
      countReq.onerror = () => reject(countReq.error);
      countReq.onsuccess = () => {
        const toRemove = countReq.result - MAX_SNAPSHOTS;
        if (toRemove <= 0) return;
        let removed = 0;
        const cursorReq = index.openCursor();
        cursorReq.onerror = () => reject(cursorReq.error);
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor && removed < toRemove) {
            store.delete(cursor.primaryKey);
            removed++;
            cursor.continue();
          }
        };
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[backup-store] 清理旧备份失败:", err);
  }
}

export async function getBackups(): Promise<Result<BackupMeta[], AppError>> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    if (!db)
      return err(
        new AppError(
          "DB_OPEN_FAILED",
          t("editor.persistence.indexedDbUnavailable"),
        ),
      );
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    // 用游标逐条投影，而不是 getAll() 全量读进来再丢掉 contentMdx/editorJson：
    // 列表视图只要 4 个字段，快照正文可能很大。主键取自 cursor.primaryKey（keyPath
    // 自增，必然存在），不再对可选的 BackupData.id 做非空断言。
    const metas: BackupMeta[] = [];
    await new Promise<void>((resolve, reject) => {
      const cursorReq = store.openCursor();
      cursorReq.onerror = () => reject(cursorReq.error);
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) {
          resolve();
          return;
        }
        const record = cursor.value as BackupData;
        metas.push({
          id: Number(cursor.primaryKey),
          docId: record.docId,
          title: record.title,
          timestamp: record.timestamp,
        });
        cursor.continue();
      };
    });
    return ok(
      metas.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    );
  } catch (e) {
    console.warn("[backup-store] 读取备份列表失败:", e);
    return err(
      new AppError(
        "DB_READ_FAILED",
        t("editor.persistence.readBackupsFailed"),
        e,
      ),
    );
  } finally {
    db?.close();
  }
}

export async function getLatestBackup(
  docId: string,
): Promise<Result<BackupData | null, AppError>> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    if (!db)
      return err(
        new AppError(
          "DB_OPEN_FAILED",
          t("editor.persistence.indexedDbUnavailable"),
        ),
      );
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("docId");
    const request = index.getAll(docId);
    const results = await new Promise<BackupData[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (results.length === 0) return ok(null);
    results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return ok(results[0]);
  } catch (e) {
    console.warn("[backup-store] 读取最新备份失败:", e);
    return err(
      new AppError(
        "DB_READ_FAILED",
        t("editor.persistence.readBackupFailed"),
        e,
      ),
    );
  } finally {
    db?.close();
  }
}

export async function restoreFromBackup(
  docId: string,
): Promise<Result<BackupData | null, AppError>> {
  return getLatestBackup(docId);
}

export function exportAllToJson(docs: BackupData[]): Result<string, AppError> {
  try {
    return ok(
      JSON.stringify(
        docs.map(({ id: _id, ...rest }) => rest),
        null,
        2,
      ),
    );
  } catch (e) {
    return err(
      new AppError(
        "EXPORT_FAILED",
        t("editor.persistence.exportJsonFailed"),
        e,
      ),
    );
  }
}

/** 导入条数上限（常量而非配置：没有按环境变化的理由）。备份文件完全不可信，
 *  不设上限时一个超大 JSON 会把 IndexedDB 灌满。 */
const MAX_IMPORT_ENTRIES = 500;

/** 只接受 DocumentMeta 里定义的三种状态，其余一律回落 draft */
const STATUS_VALUES = new Set(["draft", "published", "archived"]);

export function importFromJson(json: string): Result<BackupData[], AppError> {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return err(
        new AppError("IMPORT_FAILED", t("editor.backup.invalidJsonFormat")),
      );
    }
    // 导入的 JSON 来自用户手上的文件，不能只做 String()/Number() 转换就落库：
    // 缺 docId 会变成 docId="" 的孤儿记录（恢复时找不到归属），Number("x") 会把
    // version 写成 NaN 并原样持久化，status 也可能是任意串。故逐条校验：
    // 无归属的条目直接跳过（部分导入优于整包失败），其余值收敛到已知的取值范围。
    const entries: BackupData[] = [];
    for (const item of parsed.slice(0, MAX_IMPORT_ENTRIES) as Array<
      Record<string, unknown>
    >) {
      const docId = String(item.docId ?? "");
      if (!docId) continue;
      const version = Number(item.version);
      const status = String(item.status ?? "draft");
      entries.push({
        docId,
        title: String(item.title ?? ""),
        contentMdx: String(item.contentMdx ?? ""),
        editorJson: item.editorJson ?? null,
        status: STATUS_VALUES.has(status) ? status : "draft",
        version:
          Number.isFinite(version) && version > 0 ? Math.floor(version) : 1,
        timestamp: String(item.timestamp || new Date().toISOString()),
      });
    }
    return ok(entries);
  } catch (e) {
    return err(
      new AppError(
        "IMPORT_FAILED",
        t("editor.persistence.importJsonFailed", {
          message:
            e instanceof Error ? e.message : t("editor.backup.formatError"),
        }),
        e,
      ),
    );
  }
}
