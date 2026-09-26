import { isValidId, type MarkId, type SiteGroupId } from './ids';
import { assertNever } from './result';

// Hash routes of the options page (REQ-OPT-001). Deep links come from the popup and from content
// scripts (openOptions), so a route is only ever one of these exact shapes with valid IDs.

/** A page of the options app (REQ-OPT-001): the hash routes deep links point at. */
export type OptionsRoute =
  | { readonly page: 'group'; readonly groupId: SiteGroupId }
  | { readonly page: 'mark'; readonly groupId: SiteGroupId; readonly markId: MarkId }
  | { readonly page: 'settings' }
  | { readonly page: 'data' }
  | { readonly page: 'welcome' };

const PAGES = { settings: 'settings', data: 'data', welcome: 'welcome' } as const;

function groupRoute(rest: readonly string[]): OptionsRoute | undefined {
  const [groupId, marks, markId, ...extra] = rest;
  if (!isValidId<SiteGroupId>(groupId) || extra.length > 0) return undefined;
  if (marks === undefined) return { page: 'group', groupId };
  return marks === 'marks' && isValidId<MarkId>(markId)
    ? { page: 'mark', groupId, markId }
    : undefined;
}

/** `/groups/:id`, `/groups/:id/marks/:markId`, `/settings`, `/data` or `/welcome`. */
export function parseOptionsRoute(route: string): OptionsRoute | undefined {
  const [empty, first = '', ...rest] = route.split('/');
  if (empty !== '') return undefined;
  if (first === 'groups') return groupRoute(rest);
  const page = Object.hasOwn(PAGES, first) ? PAGES[first as keyof typeof PAGES] : undefined;
  return page && rest.length === 0 ? { page } : undefined;
}

export function formatOptionsRoute(route: OptionsRoute): string {
  switch (route.page) {
    case 'group':
      return `/groups/${route.groupId}`;
    case 'mark':
      return `/groups/${route.groupId}/marks/${route.markId}`;
    case 'settings':
    case 'data':
    case 'welcome':
      return `/${route.page}`;
    default:
      return assertNever(route);
  }
}
