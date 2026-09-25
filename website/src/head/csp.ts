import { notImplemented } from '@/core/not-implemented';

type CspOptions = {
  /** Vite's dev server injects CSS as <style> elements; never set for the build. */
  inlineStyles?: boolean;
};

/** A CSP source for an inline script: `'sha256-<base64>'` of its exact text. */
export function scriptHash(_source: string): string {
  return notImplemented();
}

/** The policy of REQ-WEB-005, allowing only the given inline script hashes. */
export function contentSecurityPolicy(
  _scriptHashes: readonly string[],
  _options: CspOptions = {},
): string {
  return notImplemented();
}

/** The `<meta name="referrer">` policy (REQ-WEB-005). */
export function referrerPolicy(): string {
  return notImplemented();
}
