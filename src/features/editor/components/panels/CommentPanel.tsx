import { useState, useEffect, useCallback, memo } from "react";
import type { PersistenceAdapter, CommentThread } from "../../engine/types";
import ConfirmDialog from "../dialogs/ConfirmDialog";
import { t } from "~/lib/i18n";

interface CommentPanelProps {
  documentId: string;
  adapter: PersistenceAdapter;
  onClose: () => void;
  onHighlightClick: (range: { from: number; to: number }) => void;
}

const CommentPanel = memo(function CommentPanel({
  documentId,
  adapter,
  onClose,
  onHighlightClick,
}: CommentPanelProps) {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const result = adapter.getComments?.(documentId) ?? [];
    setThreads(result);
  }, [documentId, adapter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddReply = (threadId: string): void => {
    const text = replyInput[threadId]?.trim();
    if (!text) return;
    // 主题已不存在时（例如另一个标签页删掉了）addReply 返回 null：这时不能清空草稿，
    // 否则用户刚写的回复会凭空消失；刷新后 UI 会反映主题已消失的真实状态
    const reply = adapter.addReply?.(documentId, threadId, text);
    if (reply) {
      setReplyInput((prev) => ({ ...prev, [threadId]: "" }));
    }
    refresh();
  };

  const handleResolve = (threadId: string): void => {
    adapter.resolveThread?.(documentId, threadId);
    refresh();
  };

  const handleReopen = (threadId: string): void => {
    adapter.reopenThread?.(documentId, threadId);
    refresh();
  };

  const handleDelete = (threadId: string): void => {
    setDeleteTarget(threadId);
  };

  const handleDeleteConfirmed = (): void => {
    if (deleteTarget) {
      adapter.deleteThread?.(documentId, deleteTarget);
      refresh();
    }
    setDeleteTarget(null);
  };

  return (
    <div className="rte-panel flex flex-col">
      <div className="flex items-center justify-between px-3 py-3 border-b border-surface-3">
        <h3 className="text-sm font-semibold">{t("editor.comments")}</h3>
        <button
          type="button"
          className="rte-btn rte-btn--ghost rte-btn--xs"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <p className="text-xs text-deep-text/50 px-3 py-4">
            {t("editor.noComments")}
          </p>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              className={`border-b border-surface-3/50 ${thread.resolved ? "opacity-60" : ""}`}
            >
              {/* Thread header */}
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs hover:bg-page-bg"
                onClick={() => onHighlightClick(thread.range)}
              >
                <span className="font-mono text-deep-text/50 italic">
                  "{thread.text.slice(0, 60)}
                  {thread.text.length > 60 ? "…" : ""}"
                </span>
              </button>

              {/* Replies */}
              <div className="px-3 pb-2 space-y-1.5">
                {thread.comments.map((c) => (
                  <div key={c.id} className="text-xs bg-card-bg rounded p-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-medium">{c.author}</span>
                      <span className="text-deep-text/40">
                        {new Date(c.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <div className="text-deep-text/80 whitespace-pre-wrap">
                      {c.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply input */}
              <div className="px-3 pb-2">
                <div className="flex gap-1">
                  <input
                    type="text"
                    className="rte-input flex-1"
                    placeholder={t("editor.replyPlaceholder")}
                    value={replyInput[thread.id] ?? ""}
                    onChange={(e) =>
                      setReplyInput((prev) => ({
                        ...prev,
                        [thread.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      // 输入法确认候选词的 Enter 也会冒泡到这里：不判 isComposing
                      // 会把还没确认的半截文本当成回复发出去
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        handleAddReply(thread.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="rte-btn rte-btn--ghost rte-btn--xs"
                    onClick={() => handleAddReply(thread.id)}
                  >
                    {t("editor.send")}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 px-3 pb-2">
                {thread.resolved ? (
                  <button
                    type="button"
                    className="rte-btn rte-btn--ghost rte-btn--xs"
                    onClick={() => handleReopen(thread.id)}
                  >
                    {t("editor.reopen")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rte-btn rte-btn--ghost rte-btn--xs text-success"
                    onClick={() => handleResolve(thread.id)}
                  >
                    {t("editor.resolve")}
                  </button>
                )}
                <button
                  type="button"
                  className="rte-btn rte-btn--ghost rte-btn--xs text-error"
                  onClick={() => handleDelete(thread.id)}
                >
                  {t("editor.delete")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message={t("editor.confirmDeleteComment")}
          danger
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
});

export default CommentPanel;
