import type { IdGen } from '../ids';
import { presetColor } from './presets';
import type { PageMark, SiteGroup, SiteMarkState } from './schema';

const NAME_MAX = 40;
const RIBBON_TEXT_MAX = 16;

/** The parts of a page URL "Mark this site" needs; a `URL` object fits. */
export type SiteOrigin = {
  /** Lowercase, punycode; IPv6 in brackets (`[::1]`). */
  readonly hostname: string;
  /** `''` for the scheme's default port. */
  readonly port: string;
};

/** The state on first run: no site groups, system theme. */
export function emptyState(): SiteMarkState {
  return { schemaVersion: 1, revision: 0, siteGroups: [], settings: { theme: 'system' } };
}

function hostRibbon(hostname: string, idGen: IdGen): PageMark {
  return {
    id: idGen.markId(),
    enabled: true,
    color: presetColor('blue'),
    textColor: 'auto',
    target: { kind: 'page' },
    effects: { ribbon: { text: hostname.slice(0, RIBBON_TEXT_MAX), corner: 'top-right' } },
  };
}

/** An enabled group named after the host that matches exactly this host and port on http and https. */
export function hostSiteGroup({ hostname, port }: SiteOrigin, idGen: IdGen): SiteGroup {
  const hostAndPort = port ? `${hostname}:${port}` : hostname;
  return {
    id: idGen.siteGroupId(),
    name: hostname.slice(0, NAME_MAX),
    enabled: true,
    patterns: [{ id: idGen.patternId(), kind: 'wildcard', value: `*://${hostAndPort}/*` }],
    excludes: [],
    marks: [],
  };
}

/** "Mark this site" (REQ-POP-006, D-201): the host group with one blue page ribbon (D-203). */
export function markThisSiteGroup(origin: SiteOrigin, idGen: IdGen): SiteGroup {
  return { ...hostSiteGroup(origin, idGen), marks: [hostRibbon(origin.hostname, idGen)] };
}
