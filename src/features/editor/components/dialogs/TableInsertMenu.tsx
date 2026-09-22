import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { t } from "~/lib/i18n";

interface TableInsertMenuProps {
  onInsert: (rows: number, cols: number) => void;
  onClose: () => void;
}

const MAX_ROWS = 8;
const MAX_COLS = 8;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export default function TableInsertMenu({
  onInsert,
  onClose,
}: TableInsertMenuProps): ReactElement {
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);
  const [focusRow, setFocusRow] = useState(0);
  const [focusCol, setFocusCol] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // 面板打开时聚焦第一个 cell
  useEffect(() => {
    gridRef.current?.focus();
  }, []);

  const getCellId = useCallback(
    (r: number, c: number) => `table-cell-${r}-${c}`,
    [],
  );

  const moveFocus = useCallback((dr: number, dc: number) => {
    setFocusRow((r) => clamp(r + dr, 0, MAX_ROWS - 1));
    setFocusCol((c) => clamp(c + dc, 0, MAX_COLS - 1));
  }, []);

  // 方向键后把真实焦点落到目标格子：只改 state 的话 activeElement 仍停在容器上，
  // 视觉光标与真实焦点分离（读屏也播报不到当前格）
  useEffect(() => {
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`#${getCellId(focusRow, focusCol)}`)
      ?.focus();
  }, [focusRow, focusCol, getCellId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          moveFocus(-1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveFocus(1, 0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          moveFocus(0, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          moveFocus(0, 1);
          break;
        case "Enter":
        case " ":
          // 焦点在格子按钮上时交给按钮的原生激活（它同样插入 focusRow/focusCol 尺寸）：
          // 这里再插一次会双发——Enter 的默认动作就是 click，空格更是 keyup 才触发 click，
          // preventDefault 拦不住 keyup
          if (e.target !== e.currentTarget) break;
          e.preventDefault();
          // 与 onClick 保持一致：任意单元格都能插入（focus 为 0/0 时就是 1×1），
          // 原 `focusRow > 0 && focusCol > 0` 会把 1×1 和所有 1×N、N×1 都挡掉
          onInsert(focusRow + 1, focusCol + 1);
          onClose();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [focusRow, focusCol, onInsert, onClose, moveFocus],
  );

  // 同步 focus -> hover 展示选中区域
  const activeRows = focusRow + 1;
  const activeCols = focusCol + 1;

  return (
    <div className="rte-link-popover">
      <p className="text-xs text-deep-text/60 mb-2">
        {t("editor.tableInsert.tableLabel", {
          rows: activeRows,
          cols: activeCols,
        })}
      </p>
      {/* role="group" 而非 role="grid"：grid 要求 row 包 gridcell，而这里的格子是 CSS grid
          的直接子节点（加 row 包裹会破坏栅格布局，display:contents 又会被部分浏览器从
          无障碍树里摘掉）。格子按钮各自带「第 r 行第 c 列」的 aria-label，语义够用 */}
      <div
        ref={gridRef}
        role="group"
        aria-label={t("editor.tableInsert.gridLabel")}
        className="rte-table-menu outline-none"
        style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 24px)` }}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => {
          setHoverRow(0);
          setHoverCol(0);
        }}
      >
        {Array.from({ length: MAX_ROWS }, (_, r) =>
          Array.from({ length: MAX_COLS }, (_, c) => {
            // 悬停优先于键盘光标：鼠标在场时按 hover 显示，鼠标离开后回落到键盘位置
            const isActive =
              hoverRow > 0
                ? r < hoverRow && c < hoverCol
                : r <= focusRow && c <= focusCol;
            const isFocused = r === focusRow && c === focusCol;
            return (
              <button
                key={getCellId(r, c)}
                id={getCellId(r, c)}
                type="button"
                className={`rte-table-cell ${isActive ? "is-active" : ""}`}
                tabIndex={isFocused ? 0 : -1}
                aria-label={t("editor.tableInsert.cellLabel", {
                  rows: r + 1,
                  cols: c + 1,
                })}
                onMouseEnter={() => {
                  // 只更新 hover：之前顺带写 focusRow/focusCol，鼠标一划过就毁掉
                  // 用户用键盘建好的选择位置
                  setHoverRow(r + 1);
                  setHoverCol(c + 1);
                }}
                onFocus={() => {
                  setFocusRow(r);
                  setFocusCol(c);
                }}
                onClick={() => {
                  onInsert(r + 1, c + 1);
                  onClose();
                }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
