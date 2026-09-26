import { notImplemented } from '../../core/not-implemented';

export type CurrentTab =
  | { readonly status: 'loading' }
  /** `url` is only known when the browser grants it (activeTab, once the popup opens). */
  | { readonly status: 'ready'; readonly tabId: number; readonly url: string | undefined }
  | { readonly status: 'none' };

export function useCurrentTab(_search?: string): CurrentTab {
  return notImplemented();
}
