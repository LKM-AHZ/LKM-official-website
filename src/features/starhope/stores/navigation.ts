import { ref, type Ref } from "vue";
import { t } from "~/lib/i18n";

// 路由全集。注意 "login" 有意不在 buildNavItems() 的菜单里：它是未登录时的
// 落地视图，由路由守卫切换，不该作为可点菜单项出现。遍历本类型的地方需要
// 自行排除它（这张注释就是给那些地方留的信号），不要误以为菜单漏项。
export type StarHopeRoute =
  | "login"
  | "dashboard"
  | "bank"
  | "practice"
  | "exam"
  | "wrong-book"
  | "ai"
  | "reader"
  | "plugins"
  | "settings";

export interface NavItem {
  route: StarHopeRoute;
  label: string;
  icon: string;
}

const currentRoute = ref<StarHopeRoute>("dashboard");

/**
 * 菜单标签在调用时求值：模块加载时（客户端 chunk 先于 en 词典就绪）若就把 t()
 * 结果存成字符串，en 站点会永久显示默认语文案（t 会回落到 zh-CN）。
 */
function buildNavItems(): NavItem[] {
  return [
    { route: "dashboard", label: t("starhope.nav.dashboard"), icon: "📊" },
    { route: "bank", label: t("starhope.nav.bank"), icon: "📚" },
    { route: "practice", label: t("starhope.nav.practice"), icon: "✏️" },
    { route: "exam", label: t("starhope.nav.exam"), icon: "📝" },
    { route: "wrong-book", label: t("starhope.nav.wrongBook"), icon: "📕" },
    { route: "ai", label: t("starhope.nav.ai"), icon: "🤖" },
    { route: "reader", label: t("starhope.nav.reader"), icon: "📖" },
    { route: "plugins", label: t("starhope.nav.plugins"), icon: "🧩" },
    { route: "settings", label: t("starhope.nav.settings"), icon: "⚙️" },
  ];
}

export function useNavigationStore(): {
  navItems: NavItem[];
  currentRoute: Ref<StarHopeRoute>;
  navigate: (route: StarHopeRoute) => void;
} {
  function navigate(route: StarHopeRoute): void {
    currentRoute.value = route;
  }

  return { navItems: buildNavItems(), currentRoute, navigate };
}
