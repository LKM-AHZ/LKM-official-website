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
  const root: Root = tiptapToMdast(editorContent);
  const normalized = normalizeMDAST(root);
  const mdx = serializeMDAST(normalized, frontmatter);
  // 返回浅拷贝并剔除 undefined：yaml.dump 会略过值为 undefined 的键，
  // 直接把入参按引用递回去会让「返回的 metadata」与实际写进 mdx 的 YAML 不一致（预览对不上文件）
  const serializedFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([, v]) => v !== undefined),
  );
  return { frontmatter: serializedFrontmatter, mdx };
}
