// src/features/editor/persistence/git-persistence.ts
// Git 持久化适配器：让编辑器直接读写 series(Git) 中的 .md/.mdx 文件。
// docId = series 内 filepath；新建文档（无 path）docId = "new"，save 时用 deriveSlug 生成 filepath。
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

/** doc.id 直接当 series 内 filepath 使用，必须挡住越出仓库根的路径。 */
function isSafeRepoPath(p: string): boolean {
  return !!p && !p.startsWith("/") && !p.split("/").includes("..");
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

/**
 * 为新文档挑一个未被占用的 filepath。
 * deriveSlug 对空标题/纯标点标题统一回退成 "post"，多个新建文档会撞进同一个文件互相覆盖，
 * 因此在已有文件树里做一次唯一化：`post.mdx` 被占则用 `post-2.mdx`、`post-3.mdx`……
 */
async function pickNewFilepath(
  seriesId: string,
  title: string,
): Promise<string> {
  const base = deriveSlug(title);
  const detail = await blogApi.getSeriesDetail(seriesId);
  const taken = new Set(
    detail.isOk() && detail.value.file_tree
      ? flattenTree(detail.value.file_tree).filter(isMarkdown)
      : [],
  );
  let candidate = `${base}.mdx`;
  for (let i = 2; taken.has(candidate); i += 1) {
    candidate = `${base}-${i}.mdx`;
  }
  return candidate;
}

/**
 * 从 MDX 内容取文档标题。
 * 不能直接取首行：export-mdx 会把 frontmatter 序列化成开头的 `---` 块，
 * 那时首行是 "---"，标题就会被写成 "---"。先跳过 frontmatter 再取首行。
 */
function firstHeadingTitle(content: string): string {
  const lines = content.split("\n");
  let start = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (end > 0) start = end + 1;
  }
  return (lines[start] ?? "").replace(/^#\s*/, "").trim();
}

export function createGitPersistence(
  seriesId: string,
  path?: string,
): PersistenceAdapter {
  // path 预留：后续可锁定单文件编辑；当前 editor.astro 据此决定新建还是打开既有文件
  void path;

  // 新建文档的 filepath 只在首次保存时确定、之后复用：
  // 若每次都重新派生，第二次自动保存会因为上一版文件已存在而再取一个新名字，产生一堆重复文件。
  let newDocFilepath: string | null = null;

  return {
    // id 即 series 内 filepath；从内容首行 "# " 取 title
    async loadDocument(id) {
      const r = await blogApi.getFileContent(seriesId, id);
      if (r.isErr()) {
        // 只返回 null 会把服务端/网络错误和「文件不存在」混成同一种结果，
        // 上层只能显示空文档、无从判断是失败还是空文件
        console.warn(
          "[git-persistence] loadDocument 失败:",
          id,
          r.error.message,
        );
        return null;
      }
      const f = r.value;
      const now = new Date().toISOString();
      return {
        id,
        title: firstHeadingTitle(f.content) || id,
        contentMdx: f.content,
        editorJson: null,
        createdAt: now,
        updatedAt: now,
        lastModified: now,
        status: "published",
        version: 1,
      } as DocumentData;
    },

    // 新建 docId="new" → 首次保存时派生并固定 filepath；否则用 doc.id
    async saveDocument(doc) {
      let filepath: string;
      if (doc.id === "new") {
        newDocFilepath ??= await pickNewFilepath(seriesId, doc.title);
        filepath = newDocFilepath;
      } else {
        if (!isSafeRepoPath(doc.id)) {
          console.warn("[git-persistence] 拒绝越界 filepath:", doc.id);
          return false;
        }
        filepath = doc.id;
      }
      try {
        const r = await blogApi.putSeriesFile(
          seriesId,
          filepath,
          doc.contentMdx,
          "save",
        );
        if (r.isErr()) {
          // 只回 isOk() 会把服务端错误吞掉，上层只能显示通用失败文案
          console.warn(
            "[git-persistence] 保存失败:",
            filepath,
            r.error.message,
          );
          return false;
        }
        return true;
      } catch (err) {
        // 网络层 reject 不能逃逸成未处理拒绝
        console.warn("[git-persistence] 保存异常:", filepath, err);
        return false;
      }
    },

    // Git 无删除端点（本阶段不做删除/重命名）：返回 true 会让上层显示「删除成功」
    async deleteDocument() {
      return false;
    },

    // 列出系列仓库内全部 .md/.mdx 文件索引
    async listDocuments() {
      const detail = await blogApi.getSeriesDetail(seriesId);
      if (detail.isErr() || !detail.value.file_tree) return [];
      return flattenTree(detail.value.file_tree)
        .filter(isMarkdown)
        .map((f) => ({
          id: f,
          // 原来的 title 是整个相对路径（含目录），列表里会把仓库结构一并暴露给用户；
          // 退化成文件名（去扩展名）作为占位，真正的标题要打开文档才知道
          title: (f.split("/").pop() ?? f).replace(/\.mdx?$/, ""),
          // 文件树只给路径与类型，拿不到提交时间，故仍留空（排序无值可用是已知缺口）
          lastModified: "",
          // 与 loadDocument 保持一致：系列仓库里的文件都是已发布内容，
          // 标 "draft" 会让同一篇文档在列表与详情里状态互相矛盾
          status: "published",
          version: 1,
        }));
    },

    // Git 版本即 commit 历史；本阶段不做版本/合并 UI（返回 true 会伪装成保存成功）
    async saveVersion() {
      return false;
    },

    async getVersions() {
      return [];
    },

    // 未实现：返回 false 让 useAutoSave 落到 localStorage 兜底（返回 true 会静默抑制兜底）
    async createBackup() {
      return false;
    },

    async getBackups() {
      return [];
    },
  };
}
