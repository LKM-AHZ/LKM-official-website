import { z } from "astro/zod";

export const calloutPropsSchema = z.object({
  // `.default()` 已让输入可选、输出为 string，再叠 `.optional()` 是冗余
  type: z.enum(["info", "warning", "error", "success"]).default("info"),
  title: z.string().default(""),
});

export const figurePropsSchema = z.object({
  // 曾有 assetId 字段，但 Figure.addAttributes() 从未声明它、全仓也无任何消费者，
  // 永远取默认空串并在 serializeFigureProps 里被过滤掉，属误导调用方的死 schema 面
  src: z.string().default(""),
  alt: z.string().default(""),
  caption: z.string().default(""),
  // Figure 节点的 width 默认值是 null，`.optional()` 只允许 undefined → 直接把节点原始属性
  // 传进来会 parse 抛错，故补 nullable；同时收紧取值域（负数/NaN/Infinity 会渲染出坏样式），
  // 非法值用 .catch 归一成 null，避免导出时被单个坏值整体打断
  width: z.number().finite().positive().nullable().optional().catch(null),
  align: z.enum(["left", "center", "right"]).default("center"),
});

export type CalloutProps = z.infer<typeof calloutPropsSchema>;
export type FigureProps = z.infer<typeof figurePropsSchema>;
