import { useEffect, useRef } from "react";
import type { ReactElement } from "react";

interface Props {
  onSelect: (file: File | null) => void;
}

/** 隐藏文件选择器：弹一次选一张图。onSelect(null) 表示取消。 */
export default function ObsidianImagePicker({ onSelect }: Props): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  // 用 ref 保存回调：调用方传的是内联箭头函数（每次渲染都是新引用），
  // 若把它放进依赖会让 effect 重跑并再次 input.click()，反复弹窗。
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    // 用户取消（Esc/取消按钮）不会触发 change，必须靠原生 cancel 事件通知父级 onSelect(null)；
    // 否则父级 open 状态永远停在 true，之后再置 true 不产生变化，选择器就再也打不开。
    const handleCancel = (): void => onSelectRef.current(null);
    input.addEventListener("cancel", handleCancel);
    input.click();
    return () => input.removeEventListener("cancel", handleCancel);
  }, []);
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0] ?? null;
        // 清空 value：否则连续两次选同一个文件不会再触发 change，回调静默不执行
        e.target.value = "";
        // accept 只是 UI 过滤（拖拽/改扩展名都能绕过）；这里与父组件的 drop/paste 路径保持一致——
        // 非图片按「取消」处理（父级保留 ![[文件名]] 文本），不把任意文件交给存储层
        onSelect(file && file.type.startsWith("image/") ? file : null);
      }}
    />
  );
}
