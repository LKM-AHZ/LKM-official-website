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
  return getBaseUrl() + path;
}
