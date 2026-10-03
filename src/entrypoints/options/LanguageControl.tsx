import type { ReactNode } from 'react';
import type { Language } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { SystemIcon } from '@/ui/components/icons';
import { Segmented } from '@/ui/components/Segmented';
import { commandErrorText } from './command-error';
import type { Notify } from './notify';
import { sendTracked } from './save-status';

/** Each language's code, like the website's EN / NL switch; the browser's language is the system icon. */
const SYMBOLS = { auto: <SystemIcon />, en: 'EN', nl: 'NL' } as const;

/**
 * The language setting (REQ-I18N-006) as the header's switch next to the theme. The page reads its
 * strings once, so a new language reloads it.
 */
export function LanguageControl({
  language,
  notify,
}: {
  readonly language: Language;
  readonly notify: Notify;
}): ReactNode {
  const change = async (next: Language) => {
    const result = await sendTracked({ type: 'setLanguage', language: next });
    if (result.ok) window.location.reload();
    else notify({ text: commandErrorText(result.error) });
  };
  return (
    <Segmented
      labelHidden
      label={t('optionsLanguage')}
      options={[
        { value: 'auto', label: t('languageAuto'), icon: SYMBOLS.auto },
        { value: 'en', label: t('languageEn'), icon: SYMBOLS.en },
        { value: 'nl', label: t('languageNl'), icon: SYMBOLS.nl },
      ]}
      value={language}
      onChange={(next) => void change(next)}
    />
  );
}
