import type { HTMLAttributes } from "astro/types";
import type { Item } from "./widget";

export interface Image {
  src: string;
  /** 必填：信息性图片必须给描述，纯装饰图请显式传 alt=""（Image.astro 也会在缺失时告警） */
  alt: string;
}

/** 类名映射（组件级 classes 的统一契约，避免各处各写一份 Record<string, string>） */
export type ClassMap = Record<string, string>;

// 同时供 Button.astro 的 <a> 与 <button> 两个分支使用：先把 a 原生的 type（链接资源 MIME）
// omit 掉，再声明按钮语义的 type，避免用不相关语义覆盖同名原生属性
export interface CallToAction extends Omit<HTMLAttributes<"a">, "slot" | "type"> {
  variant?: "primary" | "secondary" | "tertiary" | "link";
  text?: string;
  icon?: string;
  classes?: ClassMap;
  type?: "button" | "submit" | "reset";
}

export interface Collapse {
  iconUp?: string;
  iconDown?: string;
  items?: Array<Item>;
  columns?: number;
  classes?: ClassMap;
}

/**
 * Form 的输入项。继承原生 input 属性：Form.astro 会把剩余 props 直接 `{...rest}`
 * 展开到 <input>（见 primitives/Form.astro），此前类型面是封闭的，
 * 导致 required / aria-* / inputmode / pattern 等校验与无障碍属性传不进来。
 */
export interface Input extends Omit<HTMLAttributes<"input">, "type"> {
  /** 原生 type 在配置数据里是普通字符串（Form.astro 渲染时再 cast 成 InputType） */
  type?: string;
  /** 表单字段名（Form.astro 用它作为 input 的 id），必填 */
  name: string;
  /** 输入框上方标签（原生没有这个属性） */
  label?: string;
}

export interface Textarea {
  label?: string;
  name?: string;
  placeholder?: string;
  rows?: number;
}

export interface Disclaimer {
  label?: string;
}

export interface Form {
  inputs?: Array<Input>;
  textarea?: Textarea;
  disclaimer?: Disclaimer;
  button?: string;
  description?: string;
}
