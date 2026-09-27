import type { ReactNode } from 'react';
import { autoTextColor } from '@/core/model/color';
import type { Hex, MarkBase } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Segmented } from '@/ui/components/Segmented';
import { HexField } from './HexField';

export type TextColorFieldProps = {
  readonly color: Hex;
  readonly textColor: MarkBase['textColor'];
  /** Saves the text color; returns the refusal text, if any. */
  readonly onSave: (textColor: MarkBase['textColor']) => Promise<string | undefined>;
};

const WHITE = '#ffffff';

/**
 * The text color of ribbons and banners (REQ-MARK-011): automatic (black or white, whichever reads
 * better on the mark color) or a custom hex value, which starts from the automatic one.
 */
export function TextColorField({ color, textColor, onSave }: TextColorFieldProps): ReactNode {
  const auto = autoTextColor(color);
  const options = [
    { value: 'auto', label: t('optionsTextAuto') },
    { value: 'custom', label: t('optionsTextCustom') },
  ] as const;
  const choose = (mode: 'auto' | 'custom') => void onSave(mode === 'auto' ? 'auto' : auto);
  return (
    <>
      <Segmented
        label={t('optionsTextColor')}
        options={options}
        value={textColor === 'auto' ? 'auto' : 'custom'}
        onChange={choose}
      />
      {textColor === 'auto' ? (
        <p>{t(auto === WHITE ? 'optionsTextAutoWhite' : 'optionsTextAutoBlack')}</p>
      ) : (
        <HexField label={t('optionsCustomTextColor')} value={textColor} onSave={onSave} />
      )}
    </>
  );
}
