import { notImplemented } from '@/core/not-implemented';

/** Where people reach the project: GitHub only (D-248). */
export type ContactUrls = {
  bugReport: string;
  featureRequest: string;
  securityReport: string;
  securityPolicy: string;
};

/** The contact routes, the same URLs as .github/SUPPORT.md and SECURITY.md (REQ-PAGE-003). */
export function contactUrls(): ContactUrls {
  return notImplemented();
}
