import { notImplemented } from '@/core/not-implemented';
import type { Locale } from '../i18n/locales';

type SoftwareApplicationInput = { locale: Locale; description: string; url: string };

/** schema.org SoftwareApplication data for the home routes (REQ-SEO-005). */
export function softwareApplication(_input: SoftwareApplicationInput): Record<string, unknown> {
  return notImplemented();
}

/** The JSON-LD text for a `<script type="application/ld+json">`, safe inside HTML. */
export function jsonLdText(_data: Record<string, unknown>): string {
  return notImplemented();
}
