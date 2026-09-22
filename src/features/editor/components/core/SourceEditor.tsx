import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { history, defaultKeymap, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  syntaxHighlighting,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";

const markdownHighlightStyle = HighlightStyle.define([
  {
    tag: [
      tags.heading1,
      tags.heading2,
      tags.heading3,
      tags.heading4,
      tags.heading5,
      tags.heading6,
    ],
    color: "var(--primary)",
    fontWeight: "600",
  },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  {
    tag: tags.strikethrough,
    textDecoration: "line-through",
    color: "var(--text-muted)",
  },
  {
    tag: [tags.link, tags.url],
    color: "var(--info)",
    textDecoration: "underline",
  },
  { tag: tags.monospace, color: "var(--inline-code-color)" },
  { tag: tags.quote, color: "var(--text-muted)", fontStyle: "italic" },
  { tag: tags.contentSeparator, color: "var(--text-muted)" },
  {
    tag: [tags.processingInstruction, tags.meta, tags.comment],
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
]);

interface SourceEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SourceEditor({
  value,
  onChange,
}: SourceEditorProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const isInternalRef = useRef(false);
  // 编辑器只创建一次，监听器不能闭包第一个 render 的 onChange（父组件重造回调后
  // 后续编辑会一直写进旧逻辑），统一走 ref 取最新回调
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create CodeMirror editor
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        markdown(),
        lineNumbers(),
        highlightActiveLine(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        history(),
        syntaxHighlighting(markdownHighlightStyle),
        // 默认快捷键（含 undo/redo）：CodeMirror 不会自动装 defaultKeymap/historyKeymap，
        // 留空数组会让 history() 白装、Ctrl/Cmd+Z 落到浏览器原生 undo 上并与文档状态错位
        keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isInternalRef.current) {
            const newValue = update.state.doc.toString();
            onChangeRef.current(newValue);
          }
        }),
        // 使用站点 CSS 变量使 CodeMirror 自动适配深色/浅色主题（:root.dark）
        EditorView.theme({
          "&": {
            height: "100%",
            minHeight: "60vh",
            backgroundColor: "var(--card-bg)",
            color: "var(--deep-text)",
          },
          ".cm-scroller": {
            fontFamily:
              "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
            fontSize: "14px",
          },
          ".cm-content": {
            caretColor: "var(--deep-text)",
          },
          ".cm-gutters": {
            backgroundColor: "var(--base-200)",
            color: "var(--text-muted)",
            border: "none",
          },
          ".cm-activeLine": {
            backgroundColor:
              "color-mix(in oklab, var(--primary) 6%, transparent)",
          },
          ".cm-activeLineGutter": {
            backgroundColor:
              "color-mix(in oklab, var(--primary) 10%, transparent)",
            color: "var(--deep-text)",
          },
          ".cm-cursor": {
            borderLeftColor: "var(--deep-text)",
          },
          // CodeMirror 的 theme key 必须是单个选择器，`&` 也要单独出现：
          // 逗号分隔的选择器组不会被 StyleModule 正确重写，选区底色会静默失效，故拆成三条
          "&.cm-focused .cm-selectionBackground": {
            backgroundColor: "var(--selection-bg)",
          },
          ".cm-selectionBackground": {
            backgroundColor: "var(--selection-bg)",
          },
          "::selection": {
            backgroundColor: "var(--selection-bg)",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, []);

  // Sync external value changes into CodeMirror
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value === currentValue) return;

    // 只替换不同的中段（公共前缀/后缀之外的部分）：整篇重建会丢掉当前选区与光标，
    // 并给 undo 栈压进一大步，编辑体验和后端同步都受影响
    let start = 0;
    const maxStart = Math.min(currentValue.length, value.length);
    while (start < maxStart && currentValue[start] === value[start]) start += 1;
    let endCurrent = currentValue.length;
    let endNext = value.length;
    while (
      endCurrent > start &&
      endNext > start &&
      currentValue[endCurrent - 1] === value[endNext - 1]
    ) {
      endCurrent -= 1;
      endNext -= 1;
    }

    isInternalRef.current = true;
    // dispatch 抛错时若不复位标志，onChange 会被永久静音，用户后续输入全被吞掉
    try {
      view.dispatch({
        changes: {
          from: start,
          to: endCurrent,
          insert: value.slice(start, endNext),
        },
      });
    } finally {
      isInternalRef.current = false;
    }
  }, [value]);

  return <div ref={containerRef} className="rte-container" />;
}
