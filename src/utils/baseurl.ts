export function getBaseUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}

export function resolveBaseUrl(baseUrl: string, path: string): string {
  if (!baseUrl.endsWith('/')) baseUrl += '/';
  if (path.startsWith('/')) path = path.slice(1);
  return baseUrl + path;
}

export function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : url + '/';
}

export function removeTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}
