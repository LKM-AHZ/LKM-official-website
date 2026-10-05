// shell-community: community 站点的差异化 shell 组件
// 共享组件请直接从 ~/features/shell 导入

// 重新导出所有共享组件（委托给 shell）
export {
  ShellHeader,
  ShellFooter,
  ShellTopNav,
  ShellSidebar,
  ShellFuwariFooter,
  ShellLogo,
  ShellFavicons,
  ShellBlogSidePanel,
  ShellTOC,
  ShellWidgetLayout,
  ShellCategories,
  ShellTags,
  ShellSection,
  ShellAnalytics,
  ShellMetadata,
  ShellCommonMeta,
  ShellBasicScripts,
  ShellSiteVerification,
  ShellSocialShare,
  ShellToggleTheme,
  ShellToggleMenu,
  ShellApplyColorMode,
  ShellConfigCarrier,
  ShellGlobalStyles,
  ShellCustomStyles,
  ShellBackToTop,
  ShellSearch,
  ShellLightDarkSwitch,
  ShellArchivePanel,
  ShellDisplaySettings,
  ShellUserAvatarMenu,
  ShellMobileNavPanel,
} from "~/features/shell";

export * from "~/features/shell/common/shell-events";

// 差异化组件
