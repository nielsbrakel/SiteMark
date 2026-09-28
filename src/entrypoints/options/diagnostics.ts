import { originsOfState } from '@/core/data/origins';
import type { SiteMarkState } from '@/core/model/schema';
import type { OriginPattern } from '@/core/url/origin';

// Copy diagnostics (REQ-OPT-007): what a GitHub issue needs, in English for the maintainers. No
// site group names, pattern paths, labels, texts or selectors. Origins can name internal hosts, so
// by default only their kind and grant state leave the page; the user may opt in to the origins.

export type DiagnosticsInput = {
  readonly state: SiteMarkState;
  readonly version: string;
  readonly userAgent: string;
  /** The origins SiteMark may run on right now. */
  readonly granted: ReadonlySet<string>;
  /** The user ticked "Include site addresses": list the origins themselves. */
  readonly includeOrigins?: boolean;
};

function markCounts(state: SiteMarkState): string {
  const marks = state.siteGroups.flatMap((group) => group.marks);
  const pages = marks.filter((mark) => mark.target.kind === 'page').length;
  return `Marks: ${marks.length} (${pages} page, ${marks.length - pages} element)`;
}

/** `*://*.example.com/*` → "any scheme, host and subdomains"; no part of the host itself. */
function originKind(origin: OriginPattern): string {
  const [scheme = '', rest = ''] = origin.split('://');
  const host = rest.startsWith('*.') ? 'host and subdomains' : 'exact host';
  return `${scheme === '*' ? 'any scheme' : scheme}, ${host}`;
}

function originLines(origins: readonly OriginPattern[], input: DiagnosticsInput): string[] {
  const status = (origin: string) => (input.granted.has(origin) ? 'granted' : 'not granted');
  if (input.includeOrigins) return origins.map((origin) => `- ${origin} ${status(origin)}`);
  return origins.map((origin) => `- ${originKind(origin)}: ${status(origin)}`).sort();
}

function originSummary(origins: readonly OriginPattern[], granted: ReadonlySet<string>): string {
  const on = origins.filter((origin) => granted.has(origin)).length;
  return `Origins: ${origins.length} (${on} granted, ${origins.length - on} not granted)`;
}

/** The diagnostics text, one fact per line. */
export function diagnosticsText(input: DiagnosticsInput): string {
  const { state, version, userAgent, granted } = input;
  const on = state.siteGroups.filter((group) => group.enabled).length;
  const origins = originsOfState(state);
  return [
    `SiteMark ${version}`,
    `Browser: ${userAgent}`,
    `Data: schema ${state.schemaVersion}, revision ${state.revision}`,
    `Site groups: ${state.siteGroups.length} (${on} on)`,
    markCounts(state),
    originSummary(origins, granted),
    ...originLines(origins, input),
    '',
  ].join('\n');
}
