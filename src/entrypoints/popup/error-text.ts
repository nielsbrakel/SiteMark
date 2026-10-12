import { type ErrorCode, errorMessageKey } from '@/core/errors';
import { t } from '@/lib/i18n/browser-source';
import { type CommandError, isMessagingError } from '@/ui/hooks/use-command';

/** What to tell the user when the background refused a request or didn't answer it. */
export function errorText(error: CommandError): string {
  return isMessagingError(error)
    ? t('popupNotResponding')
    : t(errorMessageKey(error satisfies ErrorCode));
}
