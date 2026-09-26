import { createHash } from 'node:crypto';

type CspOptions = {
  /** Vite's dev server injects CSS as <style> elements; never set for the build. */
  inlineStyles?: boolean;
};

/** A CSP source for an inline script: `'sha256-<base64>'` of its exact text. */
export function scriptHash(source: string): string {
  return `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`;
}

/**
 * The policy of REQ-WEB-005 (D-250), set by a meta tag because GitHub Pages can't send headers:
 * nothing by default, scripts from the website plus the given inline hashes, styles and images
 * from the website only, no requests from scripts, no <base> and no form posts.
 */
export function contentSecurityPolicy(
  scriptHashes: readonly string[],
  options: CspOptions = {},
): string {
  const styles = options.inlineStyles ? "'self' 'unsafe-inline'" : "'self'";
  return [
    "default-src 'none'",
    ["script-src 'self'", ...scriptHashes].join(' '),
    `style-src ${styles}`,
    "img-src 'self'",
    "connect-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

/** The `<meta name="referrer">` policy (REQ-WEB-005): other websites see only the origin. */
export function referrerPolicy(): string {
  return 'strict-origin-when-cross-origin';
}
