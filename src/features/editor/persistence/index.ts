import type {
  PersistenceAdapter,
  DocumentData,
  DocumentSummary,
  VersionEntry,
  BackupEntry,
  CommentReply,
  CommentThread,
} from "../engine/types";
import {
  getDocument,
  listDocuments,
  updateDocument,
  upsertDocument,
  deleteDocument,
} from "./document-store";

// Re-export for direct consumer use (e.g. admin pages)
export { listDocuments, deleteDocument };
export type { DocumentData } from "../engine/types";
import { saveBackup, getBackups } from "./backup-store";
import { saveVersion, getVersions } from "./version-store";
import {
  getThreads,
  addThread,
  addReply,
  resolveThread,
  reopenThread,
  deleteThread,
} from "./comment-store";

export function createLocalPersistence(): PersistenceAdapter {
  return {
    loadDocument: (id: string) => getDocument(id),

    saveDocument: async (doc: DocumentData): Promise<boolean> => {
      const existing = getDocument(doc.id);
      if (existing) {
        const result = updateDocument(doc.id, doc);
        return result.isOk();
      }
      // 文档不存在时必须按调用方给的 id 落库（含正文/编辑器 JSON/版本），
      // 否则调用方 id 被丢弃、正文全丢，却仍返回 true 让上层以为保存成功。
      const result = upsertDocument(doc);
      return result.isOk();
    },

    deleteDocument: async (id: string): Promise<boolean> => {
      const result = deleteDocument(id);
      return result.isOk();
    },

    listDocuments: (): DocumentSummary[] => listDocuments(),

    saveVersion: async (
      docId: string,
      doc: DocumentData,
      message?: string,
    ): Promise<boolean> => {
      const result = saveVersion(docId, doc, message);
      return result.isOk();
    },

    getVersions: (docId: string): VersionEntry[] => getVersions(docId),

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
      const result = await saveBackup(docId, {
        docId,
        title: data.title,
        contentMdx: data.contentMdx,
        editorJson: data.editorJson,
        status: data.status,
        version: data.version,
        timestamp: new Date().toISOString(),
      } as Parameters<typeof saveBackup>[1]);
      return result.isOk();
    },

    getBackups: async (): Promise<BackupEntry[]> => {
      const result = await getBackups();
      return result.isOk() ? result.value : [];
    },

    getComments: (docId: string): CommentThread[] => getThreads(docId),
    addThread: (
      docId: string,
      range: { from: number; to: number },
      text: string,
      initialComment?: string,
    ): CommentThread => addThread(docId, range, text, initialComment),
    addReply: (
      docId: string,
      threadId: string,
      text: string,
    ): CommentReply | null => addReply(docId, threadId, text),
    resolveThread: (docId: string, threadId: string): void => {
      resolveThread(docId, threadId);
    },
    reopenThread: (docId: string, threadId: string): void => {
      reopenThread(docId, threadId);
    },
    deleteThread: (docId: string, threadId: string): void => {
      deleteThread(docId, threadId);
    },
  };
}

export type { CommentThread };
