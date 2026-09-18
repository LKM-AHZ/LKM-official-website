import { Component, useEffect, useState, lazy, Suspense } from "react";
import type { ReactElement } from "react";
import type { PersistenceAdapter } from "../../engine/types";
import "../../styles/editor.css";
import { t } from "~/lib/i18n";

const DocumentEditor = lazy(() => import("./DocumentEditor"));

interface DocumentIdContext {
  seriesId?: string;
  path?: string;
}

function getDocumentId(ctx: DocumentIdContext): string {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) return id;
  if (ctx.seriesId !== undefined) {
    // Git 系列写作：有 path → 打开该文件；无 path → 新建（"new"，保存时按标题 deriveSlug 生成 filepath）
    return ctx.path !== undefined && ctx.path !== "" ? ctx.path : "new";
  }
  const hash = window.location.hash.slice(1);
  if (hash) return hash;
  return "new";
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 6000];

interface Props {
  docId: string;
  adapter: PersistenceAdapter;
  seriesId?: string;
}

interface State {
  retries: number;
  error: Error | null;
  errorVersion: number;
}

class EditorErrorBoundary extends Component<Props, State> {
  state: State = { retries: 0, error: null, errorVersion: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  handleRetry = (): void => {
    const { retries } = this.state;
    if (retries >= MAX_RETRIES) return;
    this.setState({
      error: null,
      retries: retries + 1,
      errorVersion: retries + 1,
    });
  };

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactElement {
    const { docId, adapter, seriesId } = this.props;
    const { error, retries, errorVersion } = this.state;

    if (error) {
      if (retries < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retries];
        // 自动重试
        if (retries > 0) {
          setTimeout(() => this.handleRetry(), delay);
          return (
            <div className="rte-root">
              <div className="rte-loading">
                <div className="rte-spinner" />
                <span className="text-sm">
                  {t("editor.retryingEditor", { retries, total: MAX_RETRIES })}
                </span>
                <pre className="rte-error">
                  {error.message || String(error)}
                </pre>
              </div>
            </div>
          );
        }
        // 首次失败，显示首次自动重试中
        return (
          <div className="rte-root">
            <div className="rte-loading">
              <div className="rte-spinner" />
              <span className="text-sm">
                {t("editor.editorLoadRetryNotice")}
              </span>
            </div>
          </div>
        );
      }

      // 3 次重试全部失败，显示降级提示
      return (
        <div className="rte-root">
          <div className="rte-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-error"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <h3>{t("editor.editorLoadFailed")}</h3>
            <p>{t("editor.loadErrorDetail", { count: MAX_RETRIES })}</p>
            <ul className="text-xs list-disc list-inside text-left">
              <li>{t("editor.loadErrorCache")}</li>
              <li>{t("editor.loadErrorNetwork")}</li>
              <li>{t("editor.loadErrorBrowserCache")}</li>
            </ul>
            <div className="rte-error-actions">
              <button
                className="rte-btn rte-btn--sm"
                onClick={this.handleRefresh}
              >
                {t("editor.refreshPage")}
              </button>
              <button
                className="rte-btn rte-btn--primary rte-btn--sm"
                onClick={() => {
                  const v = this.state.errorVersion;
                  this.setState({
                    retries: 0,
                    error: null,
                    errorVersion: v + 1,
                  });
                  this.handleRetry();
                }}
              >
                {t("editor.retry")}
              </button>
            </div>
            <pre>{error.message || String(error)}</pre>
          </div>
        </div>
      );
    }

    // 使用 errorVersion 作为 Suspense key，仅重新触发 lazy 加载，不重建编辑器实例
    return (
      <Suspense
        key={errorVersion}
        fallback={
          <div className="rte-root">
            <div className="rte-loading">
              <div className="rte-spinner" />
              <span>{t("editor.loadingEditor")}</span>
            </div>
          </div>
        }
      >
        <DocumentEditor
          documentId={docId}
          adapter={adapter}
          seriesId={seriesId}
        />
      </Suspense>
    );
  }
}

export interface EditorMountProps {
  adapter: PersistenceAdapter;
  /** Git 系列写作：URL ?seriesId 存在时为 series 主键；无则 undefined（admin 本地模式） */
  seriesId?: string;
  /** Git 系列写作：URL ?path（可选），指示打开 series 内指定文件 */
  path?: string;
}

export default function EditorMount({
  adapter,
  seriesId,
  path,
}: EditorMountProps): ReactElement {
  const [docId, setDocId] = useState<string | null>(null);

  useEffect(() => {
    setDocId(getDocumentId({ seriesId, path }));
  }, [seriesId, path]);

  if (!docId) {
    return (
      <div className="rte-root">
        <div className="rte-loading">
          <div className="rte-spinner" />
          <span>{t("editor.loadingEditor")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rte-root">
      <EditorErrorBoundary
        docId={docId}
        adapter={adapter}
        seriesId={seriesId}
      />
    </div>
  );
}
