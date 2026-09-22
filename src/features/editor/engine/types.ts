import type { Editor } from "@tiptap/core";
import type { ReactNode } from "react";

export type SaveStatus = "saved" | "unsaved" | "saving" | "error" | "conflict";
export type EditorMode = "richtext" | "source" | "preview";

export interface ToolbarItem {
  key: string;
  icon: ReactNode;
  label: string;
  title: string;
  group: "format" | "heading" | "block" | "list" | "insert" | "history";
  action: (editor: Editor) => void;
  isActive: (editor: Editor) => boolean;
}

export interface DocumentMeta {
  id: string;
  title: string;
  lastModified: string;
  status: "draft" | "published" | "archived";
  version: number;
  /** 发布时生成的永久链接片段 `/docs/<slug>`，供 wiki 双链解析；索引需在写盘时一并落 slug */
  slug?: string;
}

export interface DocumentData extends DocumentMeta {
  contentMdx: string;
  editorJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutosavePayload {
  contentMdx: string;
  editorJson: Record<string, unknown>;
  baseVersion: number;
}

export interface AutosaveResponse {
  ok: boolean;
  version: number;
  code?: "VERSION_CONFLICT";
  currentVersion?: number;
}

export interface DocumentVersion {
  version: number;
  contentMdx: string;
  editorJson: Record<string, unknown>;
  message: string;
  createdAt: string;
}

export interface PublishPayload {
  title: string;
  slug: string;
  contentMdx: string;
}

// 索引概要：继承 DocumentMeta，自动获得 slug? 字段，使 listDocuments() 返回的索引可直接为 wiki 双链解析取 slug
export interface DocumentSummary extends DocumentMeta {
  id: string;
  title: string;
  lastModified: string;
  status: "draft" | "published" | "archived";
  version: number;
}

export interface VersionEntry {
  version: number;
  contentMdx: string;
  editorJson: Record<string, unknown>;
  message: string;
  createdAt: string;
}

export interface BackupEntry {
  id: number;
  docId: string;
  title: string;
  timestamp: string;
}

export interface CommentThread {
  id: string;
  range: { from: number; to: number };
  text: string;
  resolved: boolean;
  comments: CommentReply[];
  createdAt: string;
}

export interface CommentReply {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface PersistenceAdapter {
  loadDocument(id: string): Promise<DocumentData | null> | DocumentData | null;
  saveDocument(doc: DocumentData): Promise<boolean> | boolean | void;
  deleteDocument(id: string): Promise<boolean> | boolean | void;
  listDocuments(): Promise<DocumentSummary[]> | DocumentSummary[];
  saveVersion(
    docId: string,
    doc: DocumentData,
    message?: string,
  ): Promise<boolean> | boolean | void;
  getVersions(docId: string): Promise<VersionEntry[]> | VersionEntry[];
  createBackup(
    docId: string,
    data: {
      docId: string;
      title: string;
      contentMdx: string;
      editorJson: unknown;
      status: string;
      version: number;
    },
  ): Promise<boolean> | boolean | void;
  getBackups(): Promise<BackupEntry[]> | BackupEntry[];
  saveComment?(thread: CommentThread): void;
  getComments?(docId: string): CommentThread[];
  addThread?(
    docId: string,
    range: { from: number; to: number },
    text: string,
    initialComment?: string,
  ): CommentThread;
  addReply?(docId: string, threadId: string, text: string): CommentReply | null;
  resolveThread?(docId: string, threadId: string): void;
  reopenThread?(docId: string, threadId: string): void;
  deleteThread?(docId: string, threadId: string): void;
}
