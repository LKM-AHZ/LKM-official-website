import React, { useState, useEffect, useMemo } from "react";
import type { JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import CalloutView from "../shared/CalloutView";
import FigureView from "../shared/FigureView";

interface PreviewPanelProps {
  editor: Editor;
}

export function renderNode(node: JSONContent, key: number): React.ReactNode {
  if (!node.type) return null;

  const children = node.content?.map((c, i) => renderNode(c, i)) ?? null;

  switch (node.type) {
    case "doc":
      return (
        <div key={key} className="rte-editor-content">
          {children}
        </div>
      );
    case "paragraph":
      return <p key={key}>{children ?? node.text}</p>;
    case "heading": {
      const level = (node.attrs as Record<string, number>)?.level ?? 1;
      const HeadingTag =
        `h${Math.min(Math.max(level, 1), 6)}` as keyof React.JSX.IntrinsicElements;
      return React.createElement(HeadingTag, { key }, children ?? node.text);
    }
    case "text": {
      const text = node.text ?? "";
      const marks = node.marks ?? [];
      // 逐个 mark 嵌套包裹（与 serialize-html 的 renderText 一致）：原来「首个命中即 return」
      // 会让 bold+link 这类组合丢掉后面的 mark，预览与导出的 HTML 对不上
      if (marks.length === 0) return <span key={key}>{text}</span>;
      let el: React.ReactElement = <>{text}</>;
      for (const m of marks) {
        if (m.type === "bold") el = <strong>{el}</strong>;
        else if (m.type === "italic") el = <em>{el}</em>;
        else if (m.type === "strike") el = <del>{el}</del>;
        else if (m.type === "code") el = <code>{el}</code>;
        else if (m.type === "underline") el = <u>{el}</u>;
        else if (m.type === "link") {
          const href = (m.attrs as Record<string, string>)?.href ?? "#";
          el = (
            <a href={href} className="text-primary underline">
              {el}
            </a>
          );
        }
      }
      return React.cloneElement(el, { key });
    }
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-surface-3 pl-4 italic"
        >
          {children}
        </blockquote>
      );
    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-6">
          {children}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="list-decimal pl-6">
          {children}
        </ol>
      );
    case "taskList":
      // TaskList 是 taskItem 的容器，不处理会落到 default 的 <span> 里，
      // 生成 <span><li> 这种非法嵌套
      return (
        <ul key={key} className="list-none pl-0">
          {children}
        </ul>
      );
    case "listItem":
    case "taskItem":
      return <li key={key}>{children}</li>;
    case "codeBlock":
      return (
        <pre key={key} className="bg-page-bg rounded-lg p-4 overflow-x-auto">
          <code>{children ?? node.text}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} className="my-6 border-surface-3" />;
    case "image": {
      const attrs = (node.attrs ?? {}) as Record<string, string>;
      return (
        <img
          key={key}
          src={attrs.src as string}
          alt={(attrs.alt as string) ?? ""}
          className="rounded-md max-w-full"
        />
      );
    }
    case "callout": {
      const attrs = (node.attrs ?? {}) as Record<string, string>;
      const ctype = (attrs.type || "info") as
        "info" | "warning" | "error" | "success";
      return (
        <CalloutView key={key} type={ctype} title={attrs.title || undefined} />
      );
    }
    case "figure": {
      const attrs = (node.attrs ?? {}) as Record<string, string | number>;
      const align = (attrs.align as "left" | "center" | "right") ?? "center";
      return (
        <FigureView
          key={key}
          src={(attrs.src as string) || undefined}
          alt={(attrs.alt as string) || undefined}
          caption={(attrs.caption as string) || undefined}
          width={(attrs.width as number) || undefined}
          align={align}
        />
      );
    }
    case "table": {
      return (
        <table key={key} className="w-full border-collapse">
          <tbody>{children}</tbody>
        </table>
      );
    }
    case "tableRow": {
      return <tr key={key}>{children}</tr>;
    }
    case "tableCell":
      return (
        <td key={key} className="border border-surface-3 px-3 py-1">
          {children ?? node.text}
        </td>
      );
    case "tableHeader":
      // 表头要保持 th 语义（与 engine/serialize-html.ts 导出的一致），否则预览与导出的 HTML 不同
      return (
        <th key={key} className="border border-surface-3 px-3 py-1">
          {children ?? node.text}
        </th>
      );
    case "inlineMath":
    case "blockMath": {
      const latex = (node.attrs as Record<string, string>)?.latex ?? "";
      return (
        <span
          key={key}
          className={`font-mono ${node.type === "blockMath" ? "block text-center my-4" : ""}`}
        >
          ${latex}$
        </span>
      );
    }
    case "rawMdx": {
      // rawMdx 承载未在 Tiptap 结构化的 MDX 源码片段（如带正文的 Callout/Figure、未知组件）。
      // 直接展示完整源码（pre-wrap 保留换行），预览与 PDF 导出都不丢失信息；
      // 截断为 [...] 会在用户预览/导出时误导性地隐藏真实内容。
      const source = (node.attrs as Record<string, string>)?.source ?? "";
      return (
        <pre
          key={key}
          className="bg-surface-3/40 border border-surface-3 rounded p-3 text-xs whitespace-pre-wrap font-mono my-2 overflow-x-auto"
        >
          {source}
        </pre>
      );
    }
    default:
      // 未映射的节点多为块级（其 children 里可能有 li/p/div），
      // 用 span 包裹会生成非法嵌套并触发 React 的 DOM 嵌套告警
      return <div key={key}>{children ?? node.text}</div>;
  }
}

export default function PreviewPanel({
  editor,
}: PreviewPanelProps): React.ReactElement {
  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = (): void => setTick((t) => t + 1);
    // 仅监听 content update，不监听 selectionUpdate（光标移动不改变预览内容）
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor]);

  // useMemo 缓存递归渲染结果，避免 editor state 变化导致的无意义重算。
  // editor 也必须进依赖：换实例（组件被复用到另一个编辑器）而新实例恰好共享 doc 引用时，
  // 只盯 editor.state.doc 会漏算一次
  const content = useMemo(() => {
    const json = editor.getJSON();
    const nodes = (json?.content ?? []) as JSONContent[];
    return nodes.map((node, i) => renderNode(node, i));
  }, [editor, editor.state.doc]);

  return <div className="rte-editor-content">{content}</div>;
}
