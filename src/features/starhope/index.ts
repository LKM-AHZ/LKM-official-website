// 注意：这里不 re-export `db`。stores/db.ts 在模块加载时就 `new Dexie(...)` 并注册
// schema，本仓库是 Astro SSR，任何服务端/类型导入都会把依赖 indexedDB 的模块拖进
// 服务端 bundle；需要时直接从 ~/features/starhope/stores/db 引。
export { useAuthStore } from "./stores/auth";
export { useQuestionBankStore } from "./stores/question-bank";
export { usePracticeStore } from "./stores/practice";
export { useNavigationStore } from "./stores/navigation";
export { useAiStore } from "./stores/ai";
export type {
  Question,
  Folder,
  PracticeSession,
  AiAgent,
  AiMessage,
} from "./types";
