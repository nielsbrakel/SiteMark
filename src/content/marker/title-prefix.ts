import { createRateLimiter } from './rate-limit';

// The title prefix (REQ-MARK-009, D-230): one of the three page mutations SiteMark may make.

/** When the page changes its title, the prefix comes back at most 4 times per second. */
const REAPPLY_MAX = 4;
const REAPPLY_WINDOW_MS = 1000;

/**
 * Whitespace stripped and collapsed, like the `document.title` getter does: a prefix with two
 * spaces in a row would otherwise never match the title it was written into.
 */
function normalize(text: string): string {
  return text.replace(/[\t\n\f\r ]+/g, ' ').trim();
}

/** The title already starts with the prefix (a whole word: `PROD` is not in `PRODUCTS`). */
function hasPrefix(title: string, prefix: string): boolean {
  return title === prefix || title.startsWith(`${prefix} `);
}

function withPrefix(title: string, prefix: string): string {
  if (hasPrefix(title, prefix)) return title;
  return title ? `${prefix} ${title}` : prefix;
}

function withoutPrefix(title: string, prefix: string): string {
  if (title === prefix) return '';
  return title.startsWith(`${prefix} `) ? title.slice(prefix.length + 1) : title;
}

export type TitlePrefix = {
  /** Puts `trim(text) + ' '` before the title and keeps it there; idempotent. */
  apply(text: string): void;
  /** Strips the prefix from the current title (never restores an older one) and stops watching. */
  remove(): void;
};

type TitleWatch = { start(): void; stop(): void };

/**
 * Calls `onChange` when the page may have changed its title: a MutationObserver on `<head>`, and
 * on `<html>` for a new `<head>` (at `document_start` there may be none yet).
 */
function watchTitle(onChange: () => void): TitleWatch {
  let head: HTMLHeadElement | null = null;
  const start = () => {
    observer.disconnect();
    head = document.head;
    const html = document.documentElement;
    if (html) observer.observe(html, { childList: true });
    if (head) observer.observe(head, { childList: true, subtree: true, characterData: true });
  };
  const observer = new MutationObserver(() => {
    if (head !== document.head) start();
    onChange();
  });
  return { start, stop: () => observer.disconnect() };
}

/** Owns the title prefix. SPAs change their title on every route, so it is re-applied, rate-limited. */
export function createTitlePrefix(): TitlePrefix {
  let prefix = '';
  /** We changed the title: only then is stripping the prefix ours to do. */
  let wrote = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  const limiter = createRateLimiter(REAPPLY_MAX, REAPPLY_WINDOW_MS, () => Date.now());

  const write = () => {
    const next = withPrefix(document.title, prefix);
    if (next === document.title) return;
    document.title = next;
    wrote = true;
  };
  const reapply = () => {
    if (!prefix || hasPrefix(document.title, prefix)) return;
    if (limiter.tryTake()) return write();
    retry ??= setTimeout(() => {
      retry = undefined;
      reapply();
    }, limiter.msUntilNext());
  };
  const watch = watchTitle(reapply);

  const remove = () => {
    watch.stop();
    clearTimeout(retry);
    retry = undefined;
    if (prefix && wrote) {
      const next = withoutPrefix(document.title, prefix);
      if (next !== document.title) document.title = next;
    }
    prefix = '';
    wrote = false;
  };

  return {
    apply(text) {
      const next = normalize(text);
      if (next !== prefix) remove();
      prefix = next;
      if (!prefix) return;
      write();
      watch.start();
    },
    remove,
  };
}
