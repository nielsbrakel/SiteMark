import { applyLanguage } from '@/lib/i18n/browser-source';
import { browserStateSource, type StateSource } from './hooks/state-source';
import { viewOfStored } from './hooks/state-view';

/** Applies the stored language setting before a page renders (REQ-I18N-006). */
export async function applyStoredLanguage(source: StateSource = browserStateSource): Promise<void> {
  const view = viewOfStored(await source.readStored());
  await applyLanguage(view.status === 'ready' ? view.state.settings.language : undefined);
}
