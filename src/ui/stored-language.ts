import { notImplemented } from '@/core/not-implemented';
import { browserStateSource, type StateSource } from './hooks/state-source';

/** Applies the stored language setting before a page renders (REQ-I18N-006). */
export async function applyStoredLanguage(
  _source: StateSource = browserStateSource,
): Promise<void> {
  return notImplemented();
}
