/**
 * 用 pretext 计算纯文本的字数和字符数，完全不触碰 DOM。
 * 仅计算 editor 中 text 节点的内容，跳过非文本节点（图片、公式等）。
 */
import { prepare } from "@chenglou/pretext";

interface TextMetrics {
  characters: number;
  words: number;
}

// 简单缓存：相同文本不重复 prepare
const cache = new Map<string, TextMetrics>();
const MAX_CACHE_SIZE = 20;

/**
 * 从 Tiptap editor 中提取纯文本。
 * 递归遍历 JSON doc，提取所有 text 节点的 text 内容。
 */
function extractText(doc: Record<string, unknown>): string {
  const parts: string[] = [];
  const walk = (node: Record<string, unknown>): void => {
    if (node.type === "text" && typeof node.text === "string") {
      parts.push(node.text);
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content as Array<Record<string, unknown>>) {
        // 导入的 JSON 里可能有 null/非对象子项，直接读 child.type 会抛错让整次统计失败
        if (child && typeof child === "object") walk(child);
      }
    }
  };
  walk(doc);
  return parts.join(" ");
}

/**
 * 纯 JS 计算字数（split on whitespace 的简单实现，pretext 主要用于字符数）。
 * 对 CJK 文本：字数 = 去空白后的字符数。
 */
function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // 检测是否主要包含 CJK 字符（含假名与谚文，否则日/韩文本会走按空白分词）
  const cjkCount = (
    trimmed.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u30ff\uac00-\ud7af]/g) ||
    []
  ).length;
  // 分母去掉空白：用 trimmed.length 会让空白多的 CJK 文本比例偏低而误判成按词计数
  const letters = trimmed.replace(/\s/g, "");
  if (cjkCount > letters.length * 0.5) {
    // CJK 文本：字数 = 去空白后的字符数（标点仍计入）
    return letters.length;
  }
  // 非 CJK 文本：按空白分词
  return trimmed.split(/\s+/).length;
}

export function computeTextMetrics(
  doc: Record<string, unknown> | null,
): TextMetrics {
  if (!doc) return { characters: 0, words: 0 };

  const text = extractText(doc);

  // 检查缓存
  const cached = cache.get(text);
  if (cached) return cached;

  // 直接用文本长度作为字符数（pretext 的 prepare 验证了文本可处理性），
  // prepare 的返回值内部虽有分段信息但从未被读取，不再往缓存里存
  const characters = text.length;
  const words = countWords(text);

  try {
    prepare(text, "16px / Inter, sans-serif", {
      whiteSpace: "pre-wrap",
    });
    // 清理旧缓存
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }
    // words 不依赖 pretext，但必须一起写入缓存：命中缓存时直接返回 result，
    // 存 words: 0 会让所有已缓存文本的字数恒为 0
    cache.set(text, { characters, words });
  } catch (err) {
    console.warn("[text-metrics] pretext prepare 失败:", err);
  }

  return { characters, words };
}

export function clearTextMetricsCache(): void {
  cache.clear();
}
