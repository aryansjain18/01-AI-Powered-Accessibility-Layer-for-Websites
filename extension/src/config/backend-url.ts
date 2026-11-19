/** Backend base URL, injected at build time by Vite (see vite.config.ts). */
declare const __STUDYLENS_BACKEND_URL__: string | undefined;

export const DEFAULT_BACKEND_BASE_URL: string =
  typeof __STUDYLENS_BACKEND_URL__ === 'string' && __STUDYLENS_BACKEND_URL__.length > 0
    ? __STUDYLENS_BACKEND_URL__
    : 'http://localhost:3000';

/** Codespaces forwarded ports look like https://<name>-<port>.app.github.dev */
export function isCodespacesUrl(url: string): boolean {
  return /\.app\.github\.dev$/i.test(new URL(url).hostname);
}