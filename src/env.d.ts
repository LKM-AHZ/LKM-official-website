// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite/client" />
/// <reference types="./integrations/types.d.ts" />

// Fontsource 包仅提供 CSS（无类型声明）；声明模块以便副作用导入
// 在 TypeScript 6 严格模式下通过类型检查（ts2882）。
declare module '@fontsource-variable/*';
declare module '@fontsource/*';
