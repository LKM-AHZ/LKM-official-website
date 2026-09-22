import { useState, useEffect, memo } from "react";
import type { Editor } from "@tiptap/core";
import { t } from "~/lib/i18n";

interface PropertyPanelProps {
  editor: Editor;
}

const EDITABLE_NODE_TYPES = ["callout", "figure", "image"];

const PropertyPanel = memo(function PropertyPanel({
  editor,
}: PropertyPanelProps) {
  const [selectedNode, setSelectedNode] = useState<{
    type: string;
    attrs: Record<string, unknown>;
    pos: number;
  } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = (): void => {
      const { $from } = editor.state.selection;
      // $from.node($from.depth) 恒等于 $from.parent（ResolvedPos.parent 就是 node(depth)）：
      // 选中 callout/figure/image 这类原子块时是 NodeSelection，$from 解析到的是所在块
      // （通常就是 doc），类型判断永远不成立 → 面板永不渲染。改为看选区后的那个节点。
      const node = $from.nodeAfter ?? $from.parent;
      if (node && EDITABLE_NODE_TYPES.includes(node.type.name)) {
        setSelectedNode({
          type: node.type.name,
          attrs: { ...node.attrs },
          pos: $from.pos,
        });
        setMobileOpen(true);
      } else {
        setSelectedNode(null);
      }
    };

    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("selectionUpdate", handler);
    };
  }, [editor]);

  if (!selectedNode) return null;

  const handleUpdate = (key: string, value: unknown): void => {
    // 不能调 focus()：它（经 requestAnimationFrame）会把 DOM 焦点从面板输入框抢回编辑器，
    // 用户打一个字就丢焦点、后续字符落到正文里。updateAttributes 不需要编辑器处于聚焦态。
    editor.commands.updateAttributes(selectedNode.type, { [key]: value });
    setSelectedNode((prev) =>
      prev ? { ...prev, attrs: { ...prev.attrs, [key]: value } } : null,
    );
  };

  const handleNumberUpdate = (key: string, value: string): void => {
    const num = Number(value);
    handleUpdate(key, Number.isNaN(num) ? undefined : num);
  };

  const content = (
    <>
      <h3 className="text-sm font-semibold mb-3">
        {selectedNode.type === "callout"
          ? t("editor.propertyPanel.calloutProps")
          : selectedNode.type === "figure"
            ? t("editor.propertyPanel.figureProps")
            : t("editor.propertyPanel.properties")}
      </h3>

      {selectedNode.type === "callout" && (
        <>
          <label className="text-xs font-medium block mb-1">
            {t("editor.propertyPanel.type")}
          </label>
          <select
            className="select select-bordered select-sm w-full mb-3"
            value={(selectedNode.attrs.type as string) || "info"}
            onChange={(e) => handleUpdate("type", e.target.value)}
          >
            <option value="info">{t("editor.propertyPanel.info")}</option>
            <option value="warning">{t("editor.propertyPanel.warning")}</option>
            <option value="error">{t("editor.propertyPanel.error")}</option>
            <option value="success">{t("editor.propertyPanel.success")}</option>
          </select>
          <label className="text-xs font-medium block mb-1">
            {t("editor.propertyPanel.title")}
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full mb-3"
            value={(selectedNode.attrs.title as string) || ""}
            onChange={(e) => handleUpdate("title", e.target.value)}
          />
        </>
      )}

      {selectedNode.type === "figure" && (
        <>
          <label className="text-xs font-medium block mb-1">
            {t("editor.propertyPanel.imageUrl")}
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full mb-3"
            value={(selectedNode.attrs.src as string) || ""}
            onChange={(e) => handleUpdate("src", e.target.value)}
          />
          <label className="text-xs font-medium block mb-1">
            {t("editor.propertyPanel.altText")}
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full mb-3"
            value={(selectedNode.attrs.alt as string) || ""}
            onChange={(e) => handleUpdate("alt", e.target.value)}
          />
          <label className="text-xs font-medium block mb-1">
            {t("editor.propertyPanel.caption")}
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full mb-3"
            value={(selectedNode.attrs.caption as string) || ""}
            onChange={(e) => handleUpdate("caption", e.target.value)}
          />
          <label className="text-xs font-medium block mb-1">
            {t("editor.propertyPanel.width")}
          </label>
          <input
            type="number"
            className="input input-bordered input-sm w-full mb-3"
            value={(selectedNode.attrs.width as number) || ""}
            onChange={(e) => handleNumberUpdate("width", e.target.value)}
          />
          <label className="text-xs font-medium block mb-1">
            {t("editor.propertyPanel.align")}
          </label>
          <select
            className="select select-bordered select-sm w-full mb-3"
            value={(selectedNode.attrs.align as string) || "center"}
            onChange={(e) => handleUpdate("align", e.target.value)}
          >
            <option value="left">{t("editor.propertyPanel.alignLeft")}</option>
            <option value="center">
              {t("editor.propertyPanel.alignCenter")}
            </option>
            <option value="right">
              {t("editor.propertyPanel.alignRight")}
            </option>
          </select>
        </>
      )}

      {selectedNode.type === "image" && (
        <>
          <label className="text-xs font-medium block mb-1">
            {t("editor.propertyPanel.imageUrl")}
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full mb-3"
            value={(selectedNode.attrs.src as string) || ""}
            onChange={(e) => handleUpdate("src", e.target.value)}
          />
          <label className="text-xs font-medium block mb-1">
            {t("editor.propertyPanel.altText")}
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full mb-3"
            value={(selectedNode.attrs.alt as string) || ""}
            onChange={(e) => handleUpdate("alt", e.target.value)}
          />
        </>
      )}
    </>
  );

  return (
    <>
      {/* Desktop: side panel */}
      <div className="hidden md:block rte-panel">{content}</div>
      {/* Mobile: bottom drawer */}
      {mobileOpen && (
        <div className="md:hidden property-panel-mobile p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">
              {t("editor.propertyPanel.properties")}
            </span>
            <button
              type="button"
              className="rte-btn rte-btn--ghost rte-btn--xs"
              onClick={() => setMobileOpen(false)}
            >
              ×
            </button>
          </div>
          {content}
        </div>
      )}
    </>
  );
});

export default PropertyPanel;
