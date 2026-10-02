import { createContext, use } from 'react';
import type { MarkFormKey } from './mark-form-keys';

/** The translator of the page that shows the form: the extension's or the website's. */
export type Translate = (key: MarkFormKey, substitutions?: string) => string;

export const TranslateContext = createContext<Translate | undefined>(undefined);

export function useT(): Translate {
  const t = use(TranslateContext);
  if (!t) throw new Error('[SiteMark] the mark form needs a TranslateContext');
  return t;
}
