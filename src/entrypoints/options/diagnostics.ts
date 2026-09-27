import { originsOfState } from '@/core/data/origins';
import type { SiteMarkState } from '@/core/model/schema';

// Copy diagnostics (REQ-OPT-007): what a GitHub issue needs, in English for the maintainers. Only
// origins leave the page: no site group names, pattern paths, labels, texts or selectors.

export type DiagnosticsInput = {
  readonly state: SiteMarkState;
  readonly version: string;
  readonly userAgent: string;
  /** The origins SiteMark may run on right now. */
  readonly granted: ReadonlySet<string>;
};

function markCounts(state: SiteMarkState): string {
  const marks = state.siteGroups.flatMap((group) => group.marks);
  const pages = marks.filter((mark) => mark.target.kind === 'page').length;
  return `Marks: ${marks.length} (${pages} page, ${marks.length - pages} element)`;
}

/** The diagnostics text, one fact per line. */
export function diagnosticsText({ state, version, userAgent, granted }: DiagnosticsInput): string {
  const on = state.siteGroups.filter((group) => group.enabled).length;
  const origins = originsOfState(state).map(
    (origin) => `- ${origin} ${granted.has(origin) ? 'granted' : 'not granted'}`,
  );
  return [
    `SiteMark ${version}`,
    `Browser: ${userAgent}`,
    `Data: schema ${state.schemaVersion}, revision ${state.revision}`,
    `Site groups: ${state.siteGroups.length} (${on} on)`,
    markCounts(state),
    'Origins:',
    ...(origins.length > 0 ? origins : ['- none']),
    '',
  ].join('\n');
}
