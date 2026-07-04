import { getPermalink, getBlogPermalink, getAsset, getHomePermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: '主页',
      // href: getPermalink('/'),
      links: [
        {
          text: '简明介绍',
          href: getHomePermalink(),
        },
        {
          text: '团队成员',
          href: getPermalink('/#team'),
        },
        {
          text: '发展历程',
          href: getPermalink('/#timeline'),
        },
        {
          text: '最近更新',
          href: getPermalink('/#update'),
        },
        {
          text: '常见问题',
          href: getPermalink('/#faq'),
        },
      ],
    },
    {
      text: '页面',
      links: [
        {
          text: '条款',
          href: getPermalink('/terms'),
        },
        {
          text: '隐私政策',
          href: getPermalink('/privacy'),
        },
      ],
    },
    // {
    //   text: 'Landing',
    //   links: [
    //     {
    //       text: 'Lead Generation',
    //       href: getPermalink('/landing/lead-generation'),
    //     },
    //     {
    //       text: 'Long-form Sales',
    //       href: getPermalink('/landing/sales'),
    //     },
    //     {
    //       text: 'Click-Through',
    //       href: getPermalink('/landing/click-through'),
    //     },
    //     {
    //       text: 'Product Details (or Services)',
    //       href: getPermalink('/landing/product'),
    //     },
    //     {
    //       text: 'Coming Soon or Pre-Launch',
    //       href: getPermalink('/landing/pre-launch'),
    //     },
    //     {
    //       text: 'Subscription',
    //       href: getPermalink('/landing/subscription'),
    //     },
    //   ],
    // },
    {
      text: '博客',
      links: [
        {
          text: '博客列表',
          href: getBlogPermalink(),
        },
        {
          text: '所有分类',
          href: getPermalink('/blog/categories'),
        },
        {
          text: '文章示例',
          href: getPermalink('get-started-website-with-astro-tailwind-css', 'post'),
        },
        {
          text: '文章 (MDX)',
          href: getPermalink('markdown-elements-demo-post', 'post'),
        },
        {
          text: '分类页面',
          href: getPermalink('tutorials', 'category'),
        },
        {
          text: '标签页面',
          href: getPermalink('astro', 'tag'),
        },
      ],
    },
    {
      text: '关于我们',
      links: [
        {
          text: '管理团队',
          href: getPermalink('/team'),
        },
        {
          text: '关于我们',
          href: getPermalink('/about'),
        },
        {
          text: '服务',
          href: getPermalink('/services'),
        },
        {
          text: '定价',
          href: getPermalink('/pricing'),
        },
        {
          text: '联系我们',
          href: getPermalink('/contact'),
        },
      ],
    },
  ],
  actions: [{ text: '联系我们', href: getPermalink('/contact') }],
};

export const footerData = {
  links: [
    {
      title: '社区',
      links: [
        { text: '关于我们', href: getPermalink('/about') },
        { text: '管理团队', href: getPermalink('/team') },
        { text: '发展历程', href: getPermalink('/#timeline') },
        { text: '博客', href: getBlogPermalink() },
      ],
    },
    {
      title: '页面',
      links: [
        { text: '服务', href: getPermalink('/services') },
        { text: '定价', href: getPermalink('/pricing') },
        { text: '联系我们', href: getPermalink('/contact') },
        { text: '常见问题', href: getPermalink('/#faq') },
      ],
    },
    {
      title: '法律',
      links: [
        { text: '隐私政策', href: getPermalink('/privacy') },
        { text: '使用条款', href: getPermalink('/terms') },
      ],
    },
  ],
  secondaryLinks: [
    { text: '使用条款', href: getPermalink('/terms') },
    { text: '隐私政策', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/LKM-official' },
  ],
  footNote: `
    理科迷 LKM &copy; 2026 · 保留所有权利。
  `,
};
