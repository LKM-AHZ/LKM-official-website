export { default as ShellHeader } from "./components/Header.astro";
export { default as ShellFooter } from "./components/Footer.astro";
export { default as ShellTopNav } from "./components/TopNav.astro";
export { default as ShellSidebar } from "~/features/homepage/components/Sidebar.astro";
export { default as ShellFuwariFooter } from "./components/FuwariFooter.astro";
export { default as ShellLogo } from "./components/Logo.astro";
export { default as ShellFavicons } from "./components/Favicons.astro";
export { default as ShellBlogSidePanel } from "./components/BlogSidePanel.astro";
export { default as ShellTOC } from "./components/TOC.astro";
export { default as ShellWidgetLayout } from "./components/WidgetLayout.astro";
export { default as ShellCategories } from "./components/Categories.astro";
export { default as ShellTags } from "./components/Tags.astro";
export { default as ShellSection } from "./components/Section.astro";

// common 子模块
export { default as ShellAnalytics } from "./common/components/Analytics.astro";
export { default as ShellMetadata } from "./common/components/Metadata.astro";
export { default as ShellCommonMeta } from "./common/components/CommonMeta.astro";
export { default as ShellBasicScripts } from "./common/components/BasicScripts.astro";
export { default as ShellSiteVerification } from "./common/components/SiteVerification.astro";
export { default as ShellSocialShare } from "./common/components/SocialShare.astro";
export { default as ShellToggleTheme } from "./common/components/ToggleTheme.astro";
export { default as ShellToggleMenu } from "./common/components/ToggleMenu.astro";
export { default as ShellApplyColorMode } from "./common/components/ApplyColorMode.astro";
export { default as ShellConfigCarrier } from "./common/components/ConfigCarrier.astro";
export { default as ShellGlobalStyles } from "./common/components/GlobalStyles.astro";
export { default as ShellCustomStyles } from "./common/components/CustomStyles.astro";
export { default as ShellBackToTop } from "~/components/primitives/BackToTop.astro";
export * from "./common/shell-events";

// Vue components (migrated from Svelte)
export { default as ShellSearch } from "./components/Search.vue";
export { default as ShellLightDarkSwitch } from "./components/LightDarkSwitch.vue";
export { default as ShellArchivePanel } from "./components/ArchivePanel.vue";
export { default as ShellDisplaySettings } from "./components/widget/DisplaySettings.vue";

// Vue user components
export { default as ShellUserAvatarMenu } from "./components/user/UserAvatarMenu.vue";

// Astro components
export { default as ShellMobileNavPanel } from "./components/MobileNavPanel.astro";
