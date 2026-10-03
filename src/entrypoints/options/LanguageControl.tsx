import type { ReactNode } from 'react';
import type { Language } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Segmented } from '@/ui/components/Segmented';
import type { Notify } from './notify';

/** The language setting (REQ-I18N-006) as the header's switch next to the theme. */
export function LanguageControl({
  language,
}: {
  readonly language: Language;
  readonly notify: Notify;
}): ReactNode {
  return (
    <Segmented
      labelHidden
      label={t('optionsLanguage')}
      options={[
        { value: 'auto', label: t('languageAuto') },
        { value: 'en', label: t('languageEn') },
        { value: 'nl', label: t('languageNl') },
      ]}
      value={language}
      onChange={() => undefined}
    />
  );
}
