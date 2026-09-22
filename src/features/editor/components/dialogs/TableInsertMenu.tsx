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
        {activeRows > 0 && activeCols > 0
          ? t("editor.tableInsert.tableLabel", {
              rows: activeRows,
              cols: activeCols,
            })
          : t("editor.tableInsert.selectSize")}
      </p>
      <div
        ref={gridRef}
        role="grid"
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
                role="gridcell"
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
