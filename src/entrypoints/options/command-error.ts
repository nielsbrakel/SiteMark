import type { MessagingError } from '@/app/protocol';
import { type ErrorCode, errorMessageKey } from '@/core/errors';
import { t } from '@/lib/i18n/browser-source';
import type { CommandError } from '@/ui/hooks/use-command';

const MESSAGING: Readonly<Record<MessagingError, true>> = {
  messageRefused: true,
  handlerFailed: true,
  noReceiver: true,
};

function isMessagingError(error: CommandError): error is MessagingError {
  return Object.hasOwn(MESSAGING, error);
}

/** The readable text for a refused command (D-258): the core's code, or "couldn't save". */
export function commandErrorText(error: CommandError): string {
  return isMessagingError(error)
    ? t('optionsSendFailed')
    : t(errorMessageKey(error satisfies ErrorCode));
}
