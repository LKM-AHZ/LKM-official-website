// src/features/editor/persistence/git-persistence.ts
// Git 持久化适配器：让编辑器直接读写 series(Git) 中的 .md/.mdx 文件。
// docId = series 内 filepath；新建文设（无 path）docId = "new"，save 时用 deriveSlug 生成 filepath。
import { blogApi } from "~/lib/api";
import type { FileTreeNode } from "~/lib/api";
import type { PersistenceAdapter, DocumentData } from "../engine/types";

// 从标题派生文件名 slug（转小写、连字符替代空白，其余非 [\w\u4e00-\u9fa5-] 全部去掉）
function deriveSlug(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "");
  return s || "post";
}

// 是否为 Markdown/MDX 文件
function isMarkdown(name: string): boolean {
  return /\.(md|mdx)$/i.test(name);
}

// 递归拍平 Git 文件树为相对路径数组
function flattenTree(nodes: FileTreeNode[], prefix = ""): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    const p = prefix ? `${prefix}/${n.name}` : n.name;
    if (n.type === "blob") out.push(p);
    else if (n.children) out.push(...flattenTree(n.children, p));
  }
  return out;
}

export function createGitPersistence(
  seriesId: string,
  path?: string,
): PersistenceAdapter {
  // path 预留：后续可锁定单文件编辑；当前 editor.astro 据此决定新建还是打开既有文件
  void path;

  return {
    // id 即 series 内 filepath；从内容首行 "# " 取 title
    async loadDocument(id) {
      const r = await blogApi.getFileContent(seriesId, id);
      if (r.isErr()) return null;
      const f = r.value;
      const firstLine = f.content.split("\n")[0] ?? "";
      const now = new Date().toISOString();
      return {
        id,
        title: firstLine.replace(/^#\s*/, "").trim() || id,
        contentMdx: f.content,
        editorJson: null,
        createdAt: now,
        updatedAt: now,
        lastModified: now,
        status: "published",
        version: 1,
      } as DocumentData;
    },

    // 新建 docId="new" → deriveSlug(doc.title)+".mdx"；否则用 doc.id
    async saveDocument(doc) {
      const filepath =
        doc.id === "new" ? `${deriveSlug(doc.title)}.mdx` : doc.id;
      const r = await blogApi.putSeriesFile(
        seriesId,
        filepath,
        doc.contentMdx,
        "save",
      );
      return r.isOk();
    },

    // Git 无删除端点（本阶段不做删除/重命名）
    async deleteDocument() {
      return true;
    },

    // 列出系列仓库内全部 .md/.mdx 文件索引
    async listDocuments() {
      const detail = await blogApi.getSeriesDetail(seriesId);
      if (detail.isErr() || !detail.value.file_tree) return [];
      return flattenTree(detail.value.file_tree)
        .filter(isMarkdown)
        .map((f) => ({
          id: f,
          title: f,
          lastModified: "",
          status: "draft",
          version: 1,
        }));
    },

    // Git 版本即 commit 历史；本阶段不做版本/合并 UI
    async saveVersion() {
      return true;
    },

    async getVersions() {
      return [];
    },

    async createBackup() {
      return true;
    },

    async getBackups() {
      return [];
    },
  };
}
