declare global {
  interface Window {
    __BASE_URL__: string;
  }
}

export function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.__BASE_URL__) {
    return window.__BASE_URL__;
  }
  return '/';
}

export function getAuthPath(path: string): string {
  const base = getBaseUrl();
  if (!path) return base.replace(/\/$/, '') || '/';
  return base.endsWith('/') ? base + path : base + '/' + path;
}
