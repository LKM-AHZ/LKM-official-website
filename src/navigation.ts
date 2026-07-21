import { getPermalink, getBlogPermalink, getAsset, getHomePermalink } from './utils/permalinks';

/** 管理团队 / 关于 / 服务等页面的共享顶部导航 Tab */
export const teamTopTabs = [
  { text: '管理团队', href: getPermalink('/team') },
  { text: '项目团队', href: getPermalink('/project-team') },
  { text: '关于我们', href: getPermalink('/about') },
  { text: '服务', href: getPermalink('/services') },
  { text: '赞助与支持', href: getPermalink('/pricing') },
  { text: '联系我们', href: getPermalink('/contact') },
  { text: 'QQ社群', href: getPermalink('/communities') },
];

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
      ],
    },
    {
      text: '文档库',
      links: [
        {
          text: '文档首页',
          href: getPermalink('/docs'),
        },
      ],
    },
    {
      text: '七月团队',
      links: [
        {
          text: '管理团队',
          href: getPermalink('/team'),
        },
        {
          text: '项目团队',
          href: getPermalink('/project-team'),
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
          text: '赞助与支持',
          href: getPermalink('/pricing'),
        },
        {
          text: '联系我们',
          href: getPermalink('/contact'),
        },
        {
          text: 'QQ社群',
          href: getPermalink('/communities'),
        },
      ],
    },
  ],
  actions: [
    { text: '登录', href: getPermalink('/login') },
    { text: '联系我们', href: getPermalink('/contact') },
  ],
};

export const footerData = {
  links: [
    {
      title: '社区',
      links: [
        { text: '七月团队', href: getPermalink('/about') },
        { text: '管理团队', href: getPermalink('/team') },
        { text: '发展历程', href: getPermalink('/#timeline') },
        { text: '博客', href: getBlogPermalink() },
      ],
    },
    {
      title: '页面',
      links: [
        { text: '服务', href: getPermalink('/services') },
        { text: '支持我们', href: getPermalink('/pricing') },
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
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/LKM-AHZ' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
  footNote: `
    理科迷 LKM &copy; 2026 · 保留所有权利。
  `,
};
