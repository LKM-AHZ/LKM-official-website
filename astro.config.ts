import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';

import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import vue from '@astrojs/vue';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { AstroIntegration } from 'astro';

import astrowind from './src/integrations';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin } from './src/utils/frontmatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  site: 'https://LKM-AHZ.github.io',
  base: '/LKM-official-website',

  output: 'static',

  integrations: [
    sitemap(),
    mdx(),
    vue(),
    react({
      include: ['**/*.tsx', '**/*.jsx'],
    }),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),

    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),

    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: true,
      JavaScript: true,
      SVG: true,
      Logger: 1,
    }),

    astrowind({
      config: './src/config.yaml',
    }),
  ],

  image: {
    // Astro 默认的 Sharp 服务处理本地图片。
    //
    // 大多数远程 CDN 图片（Unsplash、Cloudinary、Imgix 等）由
    // src/components/common/Image.astro 通过 `unpic` 路由，它会用 CDN 端
    // 的查询参数重写 URL 并直接从提供商提供 — Astro 从不下载它们，因此无需列出。
    //
    // `domains` 只对落入 Astro 原生 <Image /> 的远程 URL 有效
    // （即 Unpic 无法检测的提供商，如 Pixabay）。
    // 列出的条目被授权由 Sharp 处理。
    domains: ['cdn.pixabay.com'],
  },

  markdown: {
    processor: unified({
      remarkPlugins: [readingTimeRemarkPlugin, remarkMath],
      rehypePlugins: [responsiveTablesRehypePlugin, rehypeKatex],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },
});
