import type { JSONContent } from "@tiptap/core";
import type { Root } from "mdast";
import { tiptapToMdast } from "./tiptap-to-mdast";
import { normalizeMDAST } from "./normalize";
import { serializeMDAST } from "./serialize-mdx";
import type { MdxExport } from "./types";

export function exportMdx(
  editorContent: JSONContent[],
  frontmatter: Record<string, unknown> = {},
): MdxExport {
  // 这里是导出链路的公共边界：持久化的 editor JSON 缺失/损坏时 content 可能不是数组，
  // 直接往下传会在 convertBlocks 的 for...of 里抛 “nodes is not iterable”，
  // 报错点离真正的原因很远，故在边界处先归一化
  const safeContent = Array.isArray(editorContent) ? editorContent : [];
  const root: Root = tiptapToMdast(safeContent);
  const normalized = normalizeMDAST(root);
  const mdx = serializeMDAST(normalized, frontmatter);
  // 返回浅拷贝并剔除 undefined：yaml.dump 会略过值为 undefined 的键，
  // 直接把入参按引用递回去会让「返回的 metadata」与实际写进 mdx 的 YAML 不一致（预览对不上文件）
  const serializedFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([, v]) => v !== undefined),
  );
  return { frontmatter: serializedFrontmatter, mdx };
}
