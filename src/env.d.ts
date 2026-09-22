/// <reference path="../.astro/types.d.ts" />

// 全局声明直接写在这里：编辑器的 LSP 用快照跑独立 tsc，不总能跟随 <reference>
// 去发现声明文件（原先指向的 ./core/global.d.ts 已随 src/core 一起移除）。
interface Window {
  // 可选：pagefind 只在异步 loader（FuwariNavbar）成功后才挂到 window 上，
  // 声明成必选会让消费方漏掉 null 检查
  pagefind?: {
    search: (query: string) => Promise<{
      results: Array<{
        data: () => Promise<{
          url: string;
          meta: { title: string };
          excerpt: string;
          content?: string;
          word_count?: number;
          filters?: Record<string, unknown>;
          anchors?: Array<{
            element: string;
            id: string;
            text: string;
            location: number;
          }>;
          weighted_locations?: Array<{
            weight: number;
            balanced_score: number;
            location: number;
          }>;
          locations?: number[];
          raw_content?: string;
          raw_url?: string;
        }>;
      }>;
    }>;
  };
}

declare module "*.yaml?raw" {
  const content: string;
  export default content;
}

declare module "*.yml?raw" {
  const content: string;
  export default content;
}

// wgsl-raw 插件把 *.wgsl 转成 default 字符串
declare module "*.wgsl" {
  const code: string;
  export default code;
}

declare module "virtual:config" {
  const config: Record<string, unknown>;
  export default config;
}

declare module "~/scripts/blog-init.ts";
declare module "~/scripts/blog-transitions.ts";
declare module "~/scripts/blog-photoswipe.ts";
