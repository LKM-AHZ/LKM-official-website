export { default as LoginPage } from "./components/login/LoginPage.vue";
export { default as RegisterPage } from "./components/register/RegisterPage.vue";
export { default as RecoveryPage } from "./components/recovery/RecoveryPage.vue";
export { default as SettingsPage } from "./components/settings/SettingsPage.vue";
export { default as ProtectedRoute } from "./components/settings/ProtectedRoute.vue";
export { default as OnboardingPage } from "./components/onboarding/OnboardingPage.vue";
// 原名 `AUTH_PATHS` 会被当成常量表（AUTH_PATHS.login），实际是函数，故按真实名字导出
export { getAuthPath } from "./constants/auth-paths";
