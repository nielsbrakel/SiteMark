import type en from '../../../public/_locales/en/messages.json';

/** Every key in public/_locales/en/messages.json. A typo is a type error. */
export type MessageKey = keyof typeof en;
