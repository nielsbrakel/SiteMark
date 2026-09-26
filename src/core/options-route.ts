import type { MarkId, SiteGroupId } from './ids';
import { notImplemented } from './not-implemented';

/** A page of the options app (REQ-OPT-001): the hash routes deep links point at. */
export type OptionsRoute =
  | { readonly page: 'group'; readonly groupId: SiteGroupId }
  | { readonly page: 'mark'; readonly groupId: SiteGroupId; readonly markId: MarkId }
  | { readonly page: 'settings' }
  | { readonly page: 'data' }
  | { readonly page: 'welcome' };

/** `/groups/:id`, `/groups/:id/marks/:markId`, `/settings`, `/data` or `/welcome`. */
export function parseOptionsRoute(_route: string): OptionsRoute | undefined {
  return notImplemented();
}

export function formatOptionsRoute(_route: OptionsRoute): string {
  return notImplemented();
}
