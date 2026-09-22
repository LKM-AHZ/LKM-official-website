type EventHandler = () => void;

/** open-auth-modal 事件的 detail 形状 */
export type AuthModalView = "login" | "register" | "recovery";

const SHELL_EVENTS = {
  MOBILE_NAV_TOGGLE: "mobile-nav:toggle",
  MOBILE_NAV_OPEN: "mobile-nav:open",
  MOBILE_NAV_CLOSE: "mobile-nav:close",
  OPEN_AUTH_MODAL: "open-auth-modal",
  CLOSE_AUTH_MODAL: "close-auth-modal",
} as const;

export function dispatchMobileNavToggle(): void {
  window.dispatchEvent(new CustomEvent(SHELL_EVENTS.MOBILE_NAV_TOGGLE));
}

export function dispatchOpenLoginModal(): void {
  window.dispatchEvent(
    new CustomEvent(SHELL_EVENTS.OPEN_AUTH_MODAL, {
      detail: { view: "login" },
    }),
  );
}

export function dispatchOpenRegisterModal(): void {
  window.dispatchEvent(
    new CustomEvent(SHELL_EVENTS.OPEN_AUTH_MODAL, {
      detail: { view: "register" },
    }),
  );
}

export function dispatchOpenRecoveryModal(): void {
  window.dispatchEvent(
    new CustomEvent(SHELL_EVENTS.OPEN_AUTH_MODAL, {
      detail: { view: "recovery" },
    }),
  );
}

export function dispatchCloseAuthModal(): void {
  window.dispatchEvent(new CustomEvent(SHELL_EVENTS.CLOSE_AUTH_MODAL));
}

// 与 onMobileNav* 对称的订阅 API：认证弹窗事件此前只能手写 addEventListener +
// 自己管清理，容易漏 removeEventListener
export function onAuthModalOpen(
  handler: (event: CustomEvent<{ view: AuthModalView }>) => void,
): () => void {
  window.addEventListener(
    SHELL_EVENTS.OPEN_AUTH_MODAL,
    handler as EventListener,
  );
  return () =>
    window.removeEventListener(
      SHELL_EVENTS.OPEN_AUTH_MODAL,
      handler as EventListener,
    );
}

export function onAuthModalClose(handler: () => void): () => void {
  window.addEventListener(SHELL_EVENTS.CLOSE_AUTH_MODAL, handler);
  return () =>
    window.removeEventListener(SHELL_EVENTS.CLOSE_AUTH_MODAL, handler);
}

export function onMobileNavOpen(handler: EventHandler): () => void {
  window.addEventListener(SHELL_EVENTS.MOBILE_NAV_OPEN, handler);
  return () =>
    window.removeEventListener(SHELL_EVENTS.MOBILE_NAV_OPEN, handler);
}

export function onMobileNavClose(handler: EventHandler): () => void {
  window.addEventListener(SHELL_EVENTS.MOBILE_NAV_CLOSE, handler);
  return () =>
    window.removeEventListener(SHELL_EVENTS.MOBILE_NAV_CLOSE, handler);
}

export function onMobileNavToggle(handler: EventHandler): () => void {
  window.addEventListener(SHELL_EVENTS.MOBILE_NAV_TOGGLE, handler);
  return () =>
    window.removeEventListener(SHELL_EVENTS.MOBILE_NAV_TOGGLE, handler);
}
