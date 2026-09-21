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
  try {
    const db = await openDB();
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
    db.close();
    return ok(undefined);
  } catch (e) {
    console.warn("[backup-store] 备份写入失败:", e);
    return err(
      new AppError("BACKUP_FAILED", t("editor.persistence.backupFailed"), e),
    );
  }
}

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
  try {
    const db = await openDB();
    if (!db)
      return err(
        new AppError(
          "DB_OPEN_FAILED",
          t("editor.persistence.indexedDbUnavailable"),
        ),
      );
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    const results = await new Promise<BackupData[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return ok(
      results
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .map((r) => ({
          id: r.id!,
          docId: r.docId,
          title: r.title,
          timestamp: r.timestamp,
        })),
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
  }
}

export async function getLatestBackup(
  docId: string,
): Promise<Result<BackupData | null, AppError>> {
  try {
    const db = await openDB();
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
    db.close();
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

export function importFromJson(json: string): Result<BackupData[], AppError> {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return err(
        new AppError("IMPORT_FAILED", t("editor.backup.invalidJsonFormat")),
      );
    }
    return ok(
      parsed.map((item: Record<string, unknown>) => ({
        docId: String(item.docId || ""),
        title: String(item.title || ""),
        contentMdx: String(item.contentMdx || ""),
        editorJson: item.editorJson ?? null,
        status: String(item.status || "draft"),
        version: Number(item.version || 1),
        timestamp: String(item.timestamp || new Date().toISOString()),
      })),
    );
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
