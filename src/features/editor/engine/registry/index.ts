export type { MdxComponentDefinition } from "./types";
// 注意：刻意不导出 clearRegistry —— 它是会清空模块级注册表的破坏性操作，
// 暴露在 barrel 上后任何 import 方都能在运行期（含 SSR 请求间）把组件注册表清空。
// 需要做测试隔离的用例请直接从 ./components 引入。
export {
  registerComponent,
  getComponent,
  getRegisteredNames,
  isRegistered,
} from "./components";
export { calloutPropsSchema, figurePropsSchema } from "./schemas";
export type { CalloutProps, FigureProps } from "./schemas";
