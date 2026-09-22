import type { MdxComponentDefinition } from "./types";

const registry = new Map<
  string,
  MdxComponentDefinition<Record<string, unknown>>
>();

export function registerComponent(
  def: MdxComponentDefinition<Record<string, unknown>>,
  options: { override?: boolean } = {},
): void {
  // 名字是注册表唯一的 key：空/纯空白名字会存成一条无法按正常名字解析到的条目
  if (!def.name || !def.name.trim()) {
    throw new Error("registerComponent: def.name must be a non-empty string.");
  }
  // 同名重复注册（插件被加载两次、HMR 重执行模块）会静默换掉所有消费者拿到的组件，
  // 是最难定位的一类渲染错乱：默认直接失败，只有显式声明要覆盖的调用方才允许改写
  if (registry.has(def.name) && !options.override) {
    throw new Error(
      `Component "${def.name}" is already registered. Pass { override: true } to replace it.`,
    );
  }
  registry.set(def.name, def);
}

export function getComponent(
  name: string,
): MdxComponentDefinition<Record<string, unknown>> | undefined {
  return registry.get(name);
}

export function getRegisteredNames(): string[] {
  return Array.from(registry.keys());
}

export function isRegistered(name: string): boolean {
  return registry.has(name);
}

export function clearRegistry(): void {
  registry.clear();
}
