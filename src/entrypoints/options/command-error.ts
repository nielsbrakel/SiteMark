import { type ErrorCode, errorMessageKey } from '@/core/errors';
import { t } from '@/lib/i18n/browser-source';
import { type CommandError, isMessagingError } from '@/ui/hooks/use-command';

/** The readable text for a refused command (D-258): the core's code, or "couldn't save". */
export function commandErrorText(error: CommandError): string {
  return isMessagingError(error)
    ? t('optionsSendFailed')
    : t(errorMessageKey(error satisfies ErrorCode));
}
