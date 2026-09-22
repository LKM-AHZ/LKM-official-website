import { createPinia } from "pinia";
import type { App } from "vue";

const g = globalThis as Record<string, unknown>;
// 兜底而已：正常路径由 astro.config.ts 的 vite.define 在编译期把 __VUE_PROD_DEVTOOLS__ 替换掉，
// Vue 读的是被替换后的字面量、不是 globalThis 属性，所以经 Vite 处理的模块不会走到这里。
// 别因为「这行看着没用」就把它删掉——未经 Vite 处理（如 SSR 直跑源码）时才靠它兜住 ReferenceError。
if (g.__VUE_PROD_DEVTOOLS__ === undefined) g.__VUE_PROD_DEVTOOLS__ = false;

// dev 模式规避：Vite 8 (Rolldown) 的 react-refresh native 插件会误把部分 .vue 组件的
// setup 当成 React 组件，注入 `var _s = $RefreshSig$()` 包裹。SSR 环境没有 react-refresh
// runtime，会报 "ReferenceError: $RefreshSig$ is not defined"。这里补一个 no-op polyfill：
// SSR 下让它退化为透传函数；client 下用显式 `=== undefined` 判断（等价 `??=`），仅当全局
// 未定义时才安装 no-op，避免覆盖 react-refresh preamble 已注册的真实 $RefreshSig$——
// 这依赖「本模块在 client preamble 之后求值」，若求值更早，透传实现会永久占位、Fast Refresh 静默降级。
if (g.$RefreshSig$ === undefined) {
  g.$RefreshSig$ = () => (fn: unknown) => fn;
}

// 注意：不再全局包裹 Naive UI Provider。
// 此前 withNaiveProviders 用 h(NMessageProvider,...)（Naive 的 render 以 h(Fragment,...) 包裹）
// 套到每个 Vue island 根上，会让所有 client:idle 的 SSR island 输出多余的 Fragment 注解，
// 与服务端/客户端渲染树不一致 → 大量 "Hydration node mismatch" 警告。
// 现在需要 useMessage()/useDialog() 的模块各自在组件根处按需包 Provider：
//  - 匿名信：TreeholeShell.vue（components/TreeholeShell.vue）
//  - 后台登录：AdminLogin.vue 已改为不依赖 useMessage（用 NAlert 呈现成功态），无需 Provider

export default (app: App): void => {
  app.use(createPinia());
};
