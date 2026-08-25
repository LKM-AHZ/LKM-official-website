// 供 vitest 在 node 环境下解析 `virtual:config` 的 mock。
// 内容与 src/config.yaml 保持一致，使单测可独立于 Astro 构建运行。
// 注意：paths.test.ts 的断言依赖此处 site.base = '/LKM-official-website'。
const projectConfig: Record<string, unknown> = {
  site: {
    base: "/LKM-official-website",
    trailingSlash: false,
  },
  i18n: {
    language: "zh-cn",
    textDirection: "ltr",
  },
  apps: {
    blog: {
      isEnabled: true,
      post: {
        isEnabled: true,
        permalink: "/blog/posts/%slug%",
      },
      list: {
        isEnabled: true,
        pathname: "blog",
      },
      category: {
        isEnabled: true,
        pathname: "category",
      },
      tag: {
        isEnabled: true,
        pathname: "tag",
      },
    },
  },
  fuwari: {
    navbar: {
      links: [],
    },
    navbarCommunity: {
      links: [
        {
          name: "主页",
          url: "/",
          children: [{ name: "简明介绍", url: "/" }],
        },
        {
          name: "博客",
          url: "/blog",
          children: [{ name: "博客列表", url: "/blog" }],
        },
      ],
    },
  },
};

export default projectConfig;
