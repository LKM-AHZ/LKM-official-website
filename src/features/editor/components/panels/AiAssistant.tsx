import { useState, useCallback, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import type { Editor } from "@tiptap/core";
import {
  setAiConfig,
  requestAiCompletion,
  validateAiEndpoint,
  PROMPT_TEMPLATES,
} from "../../stores/ai-client";
import { t } from "~/lib/i18n";

interface AiAssistantProps {
  editor: Editor;
  onClose: () => void;
}

const OPERATIONS = Object.keys(PROMPT_TEMPLATES);

const OPERATION_LABELS: Record<string, string> = {
  续写: t("editor.ai.operationContinue"),
  总结: t("editor.ai.operationSummarize"),
  翻译: t("editor.ai.operationTranslate"),
  改写: t("editor.ai.operationRewrite"),
  修复语法: t("editor.ai.operationFixGrammar"),
  生成标题: t("editor.ai.operationGenerateTitle"),
};

const THIRD_PARTY_NOTICE = t("editor.ai.thirdPartyNotice");

export default function AiAssistant({
  editor,
  onClose,
}: AiAssistantProps): ReactElement {
  const [operation, setOperation] = useState("续写");
  const [customPrompt, setCustomPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  // 发起请求时的选区区间：替换结果时按它定位，不能用点击那一刻的选区（用户可能已点别处）
  const requestRangeRef = useRef<{ from: number; to: number } | null>(null);

  // Abort controller ref for in-flight requests – aborted on unmount
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup: abort any in-flight request when the panel unmounts
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const selectedText = editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    " ",
  );

  const handleRequest = useCallback(async () => {
    setLoading(true);
    setError("");

    // 无条件校验 endpoint：空值同样要给出「API 地址必填」这类明确提示，
    // 不能跳过校验带着空配置发请求、最后只拿到 store 的笼统错误
    const validation = validateAiEndpoint(apiEndpoint);
    if (validation.isErr()) {
      setError(validation.error);
      setLoading(false);
      return;
    }

    const context =
      customPrompt ||
      selectedText ||
      editor.state.doc.textBetween(
        0,
        Math.min(editor.state.doc.content.size, 2000),
        " ",
      );
    if (!context.trim()) {
      setError(t("editor.ai.noSelectionOrPrompt"));
      setLoading(false);
      return;
    }

    // 记下本次请求对应的选区（"替换"要用它，而不是点击替换那一刻的选区）
    requestRangeRef.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };

    // Abort any previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await requestAiCompletion(
        { prompt: customPrompt, context, operation },
        { signal: controller.signal },
      );

      if (!controller.signal.aborted) {
        if (res.isOk()) {
          setResult(res.value);
        } else {
          setError(res.error);
        }
      }
    } finally {
      // 只有发起它的那次请求仍是最新时才复位：被新请求取代的旧请求也会 resolve，
      // 若不加判断会清掉新请求的 controller（无法再中止）并提前关掉 loading。
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }, [customPrompt, selectedText, operation, editor, apiEndpoint]);

  const handleInsert = (): void => {
    if (result) {
      editor.chain().focus().insertContent(result).run();
      setResult("");
    }
  };

  const handleReplace = (): void => {
    if (!result) return;
    // 用发起请求时记下的区间，而不是点击替换那一刻的选区：
    // 等待期间用户可能点了别处，deleteSelection 会删掉无关内容
    const range = requestRangeRef.current;
    const size = editor.state.doc.content.size;
    const from = range ? Math.min(range.from, size) : 0;
    const to = range ? Math.min(range.to, size) : 0;
    if (from < to) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent(result)
        .run();
    } else {
      // 结果基于文档兜底上下文（发起时没有选区）：插到当前光标处，不删任何内容
      editor.chain().focus().insertContent(result).run();
    }
    setResult("");
  };

  const handleSaveSettings = (): void => {
    // Validate endpoint before storing
    const validation = validateAiEndpoint(apiEndpoint);
    if (validation.isErr()) {
      setError(validation.error);
      return;
    }
    setAiConfig(apiEndpoint, apiKey, "gpt-3.5-turbo");
    setShowSettings(false);
    setError("");
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 border-l border-surface-3 shadow-xl z-50 flex flex-col rte-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-3">
        <h3 className="font-semibold text-sm">
          {t("editor.ai.writingAssistant")}
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            className="rte-btn rte-btn--ghost rte-btn--xs"
            onClick={() => setShowSettings(!showSettings)}
          >
            {t("editor.ai.settings")}
          </button>
          <button
            type="button"
            className="rte-btn rte-btn--ghost rte-btn--xs"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="p-4 flex flex-col gap-3 flex-1">
          <label className="text-xs font-medium">{t("editor.ai.apiUrl")}</label>
          <input
            type="text"
            className="rte-input rte-input--sm"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="https://api.openai.com"
          />
          <label className="text-xs font-medium">{t("editor.ai.apiKey")}</label>
          <input
            type="password"
            className="rte-input rte-input--sm"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
          />
          <p className="text-xs text-deep-text/50">
            {t("editor.ai.compatibilityNotice")}
            <br />
            {t("editor.ai.keyMemoryNotice")}
            <br />
            {t("editor.ai.productionProxyNotice")}
          </p>
          <button
            type="button"
            className="rte-btn rte-btn--primary rte-btn--sm w-full"
            onClick={handleSaveSettings}
          >
            {t("editor.ai.saveSettings")}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
          {/* Third-party data sharing notice */}
          <div className="text-xs text-warning bg-warning/5 rounded p-2 leading-relaxed">
            {THIRD_PARTY_NOTICE}
          </div>

          <label className="text-xs font-medium">
            {t("editor.ai.operation")}
          </label>
          <select
            className="rte-select rte-select--sm w-full"
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
          >
            {OPERATIONS.map((op) => (
              <option key={op} value={op}>
                {OPERATION_LABELS[op] ?? op}
              </option>
            ))}
          </select>

          {selectedText && (
            <div className="bg-page-bg rounded p-2 text-xs max-h-20 overflow-y-auto text-deep-text/70">
              <p className="font-medium mb-1">{t("editor.ai.selectedText")}</p>
              {selectedText.slice(0, 300)}
              {selectedText.length > 300 ? "…" : ""}
            </div>
          )}

          <label className="text-xs font-medium">
            {t("editor.ai.customPromptOptional")}
          </label>
          <textarea
            className="rte-textarea text-sm"
            rows={3}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={t("editor.ai.customPromptPlaceholder")}
          />

          <button
            type="button"
            className="rte-btn rte-btn--primary rte-btn--sm w-full"
            disabled={loading}
            onClick={handleRequest}
          >
            {loading ? <div className="rte-spinner mr-1" /> : null}
            {loading ? t("editor.ai.sending") : t("editor.ai.sendRequest")}
          </button>

          {error && (
            <div className="text-xs text-error bg-error/10 rounded p-2">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-page-bg rounded-lg p-3">
              <div className="text-sm whitespace-pre-wrap mb-3 max-h-64 overflow-y-auto">
                {result}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rte-btn rte-btn--primary rte-btn--xs flex-1"
                  onClick={handleInsert}
                >
                  {t("editor.ai.insert")}
                </button>
                <button
                  type="button"
                  className="rte-btn rte-btn--ghost rte-btn--xs flex-1"
                  onClick={handleReplace}
                >
                  {t("editor.ai.replaceSelection")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
