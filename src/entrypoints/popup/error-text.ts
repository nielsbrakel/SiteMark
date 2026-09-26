import type { MessagingError } from '@/app/protocol';
import { type ErrorCode, errorMessageKey } from '@/core/errors';
import { t } from '@/lib/i18n/browser-source';

const MESSAGING_ERRORS: Readonly<Record<MessagingError, true>> = {
  messageRefused: true,
  handlerFailed: true,
  noReceiver: true,
};

const isMessagingError = (error: ErrorCode | MessagingError): error is MessagingError =>
  Object.hasOwn(MESSAGING_ERRORS, error);

/** What to tell the user when the background refused a request or didn't answer it. */
export function errorText(error: ErrorCode | MessagingError): string {
  return isMessagingError(error) ? t('popupNotResponding') : t(errorMessageKey(error));
}
