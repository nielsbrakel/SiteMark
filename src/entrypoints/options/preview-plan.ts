import type { PatternId } from '@/core/ids';
import type { Mark, SiteGroup, SiteMarkState } from '@/core/model/schema';
import { compose } from '@/core/render/compose';
import type { RenderPlan } from '@/core/render/render-plan';

/** The mock page the preview shows (REQ-MARK-013). */
export const PREVIEW_ADDRESS = 'https://example.com/';

/**
 * The plan a tab would get for this one mark, composed by the real `compose` (D-254). The mark is
 * previewed on its own and always on, whether or not its group is enabled or matches anything.
 */
export function previewPlan(group: SiteGroup, mark: Mark): RenderPlan {
  const previewGroup: SiteGroup = {
    ...group,
    enabled: true,
    patterns: [{ id: 'previewPat01' as PatternId, kind: 'wildcard', value: '*://example.com/*' }],
    excludes: [],
    marks: [{ ...mark, enabled: true }],
  };
  const state: SiteMarkState = {
    schemaVersion: 1,
    revision: 0,
    siteGroups: [previewGroup],
    settings: { theme: 'system' },
  };
  return compose(PREVIEW_ADDRESS, state);
}
