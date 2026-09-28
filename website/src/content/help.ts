import { notImplemented } from '@/core/not-implemented';
import type { Result } from '@/core/result';
import type { Locale } from '../i18n/locales';
import type { HelpTopic } from '../routes/help-topics';

export type FrontMatter = { title: string; description: string; order: number; body: string };
export type HelpTopicContent = FrontMatter & { topic: HelpTopic; file: string };

export function parseFrontMatter(_text: string): Result<FrontMatter, string> {
  return notImplemented();
}

export function helpTopicsFor(_locale: Locale): HelpTopicContent[] {
  return notImplemented();
}

export function helpContentProblems(): string[] {
  return notImplemented();
}
