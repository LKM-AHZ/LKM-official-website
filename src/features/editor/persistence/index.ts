import type {
  PersistenceAdapter,
  DocumentData,
  DocumentSummary,
  VersionEntry,
  BackupEntry,
  CommentReply,
  CommentThread,
} from "../engine/types";
// 导入名加 FromStore 后缀：适配器对象的属性名与这些导入同名，同名会遮蔽、极易改错实现
import {
  getDocument,
  listDocuments as listDocumentsFromStore,
  upsertDocument,
  deleteDocument as deleteDocumentFromStore,
} from "./document-store";

// Re-export for direct consumer use (e.g. admin pages)
export {
  listDocumentsFromStore as listDocuments,
  deleteDocumentFromStore as deleteDocument,
};
export type { DocumentData } from "../engine/types";
import {
  saveBackup as saveBackupToStore,
  getBackups as getBackupsFromStore,
} from "./backup-store";
import {
  saveVersion as saveVersionToStore,
  getVersions as getVersionsFromStore,
} from "./version-store";
import {
  getThreads,
  addThread as addThreadToStore,
  addReply as addReplyToStore,
  resolveThread as resolveThreadInStore,
  reopenThread as reopenThreadInStore,
  deleteThread as deleteThreadFromStore,
} from "./comment-store";

export function createLocalPersistence(): PersistenceAdapter {
  return {
    loadDocument: (id: string) => getDocument(id),

    // 契约是返回 boolean：store 内部大多已 catch，但接口不保证，
    // 未预期的异常若以 reject 冒出去，调用方只等 boolean，就变成未处理拒绝
    saveDocument: async (doc: DocumentData): Promise<boolean> => {
      try {
        // 这里保存的是完整文档（包括自动保存递增后的 version）。
        // updateDocument 是局部 patch，会故意忽略 version，导致第二次编辑误报版本冲突。
        const result = upsertDocument(doc);
        return result.isOk();
      } catch (e) {
        console.warn("[persistence] saveDocument 失败:", e);
        return false;
      }
    },

    deleteDocument: async (id: string): Promise<boolean> => {
      try {
        const result = deleteDocumentFromStore(id);
        return result.isOk();
      } catch (e) {
        console.warn("[persistence] deleteDocument 失败:", e);
        return false;
      }
    },

    listDocuments: (): DocumentSummary[] => listDocumentsFromStore(),

    saveVersion: async (
      docId: string,
      doc: DocumentData,
      message?: string,
    ): Promise<boolean> => {
      try {
        const result = saveVersionToStore(docId, doc, message);
        return result.isOk();
      } catch (e) {
        console.warn("[persistence] saveVersion 失败:", e);
        return false;
      }
    },

    getVersions: (docId: string): VersionEntry[] => getVersionsFromStore(docId),

    createBackup: async (
      docId: string,
      data: {
        docId: string;
        title: string;
        contentMdx: string;
        editorJson: unknown;
        status: string;
        version: number;
      },
    ): Promise<boolean> => {
      try {
        // 不再用 `as Parameters<typeof saveBackupToStore>[1]` 断言：BackupData 增删必填字段时
        // 断言会掩盖不兼容。这里的 docId/timestamp 是 BackupData 的必填字段，
        // 但 saveBackup 内部会用入参 docId 与「当下时间」覆盖它们，故两者只是占位
        const result = await saveBackupToStore(docId, {
          docId,
          title: data.title,
          contentMdx: data.contentMdx,
          editorJson: data.editorJson,
          status: data.status,
          version: data.version,
          timestamp: new Date().toISOString(),
        });
        return result.isOk();
      } catch (e) {
        console.warn("[persistence] createBackup 失败:", e);
        return false;
      }
    },

    getBackups: async (): Promise<BackupEntry[]> => {
      try {
        const result = await getBackupsFromStore();
        return result.isOk() ? result.value : [];
      } catch (e) {
        console.warn("[persistence] getBackups 失败:", e);
        return [];
      }
    },

    getComments: (docId: string): CommentThread[] => getThreads(docId),
    addThread: (
      docId: string,
      range: { from: number; to: number },
      text: string,
      initialComment?: string,
    ): CommentThread => addThreadToStore(docId, range, text, initialComment),
    addReply: (
      docId: string,
      threadId: string,
      text: string,
    ): CommentReply | null => addReplyToStore(docId, threadId, text),
    resolveThread: (docId: string, threadId: string): void => {
      resolveThreadInStore(docId, threadId);
    },
    reopenThread: (docId: string, threadId: string): void => {
      reopenThreadInStore(docId, threadId);
    },
    deleteThread: (docId: string, threadId: string): void => {
      deleteThreadFromStore(docId, threadId);
    },
  };
}

export type { CommentThread };
