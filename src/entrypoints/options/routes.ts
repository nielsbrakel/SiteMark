import type { SiteGroupId } from '@/core/ids';
import type { SiteGroup } from '@/core/model/schema';
import { formatOptionsRoute, type OptionsRoute } from '@/core/options-route';

/** The link to a route, e.g. `#/groups/grp-00000001`. */
export function hrefOf(route: OptionsRoute): string {
  return `#${formatOptionsRoute(route)}`;
}

export function groupHref(groupId: SiteGroupId): string {
  return hrefOf({ page: 'group', groupId });
}

/** Opens a route; the hash router follows the hashchange. */
export function navigate(route: OptionsRoute): void {
  location.hash = formatOptionsRoute(route);
}

/**
 * The site group the editor pane shows: the one in a group or mark route, else the first one, so
 * a missing route or a deleted group still opens something. `undefined` for other pages.
 */
export function selectedGroup(
  route: OptionsRoute | undefined,
  groups: readonly SiteGroup[],
): SiteGroup | undefined {
  if (!route) return groups[0];
  if (route.page !== 'group' && route.page !== 'mark') return undefined;
  return groups.find((group) => group.id === route.groupId) ?? groups[0];
}
