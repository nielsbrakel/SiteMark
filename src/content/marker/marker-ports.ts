import { notImplemented } from '../../core/not-implemented';
import type { ViewLabels } from '../../shared/marker-view/effect-view';
import type { MarkerPorts } from './marker';

/** The labels of the banner chevron, from browser.i18n (no translator: keeps the bundle small). */
export function markerLabels(): ViewLabels {
  return notImplemented();
}

/** The production ports of the marker: runtime messaging, the real host and views. */
export function markerPorts(): MarkerPorts {
  return notImplemented();
}
