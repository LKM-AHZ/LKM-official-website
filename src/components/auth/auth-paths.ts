let _base = '';

export function setBaseUrl(base: string) {
  _base = base;
}

export function baseUrl(): string {
  return _base;
}

export function getAuthPath(path: string): string {
  return _base + path;
}
