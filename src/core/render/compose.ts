import type { SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { RenderPlan } from './render-plan';

/**
 * The render plan for a URL (REQ-GRP-005, D-242): the enabled marks of every active site group,
 * composed by the rules of spec §5.2 and sorted bottom → top.
 */
export function compose(_url: string, _state: SiteMarkState): RenderPlan {
  return notImplemented();
}
