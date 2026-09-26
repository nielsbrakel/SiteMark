import { notImplemented } from '../../core/not-implemented';

export type UrlWatch = {
  /** Stops polling and listening. */
  dispose(): void;
};

/**
 * Calls `onChange(url)` once for every change of `location.href` (REQ-RND-004), so the tab can
 * ask for a new render plan.
 */
export function watchUrl(_onChange: (url: string) => void): UrlWatch {
  return notImplemented();
}
