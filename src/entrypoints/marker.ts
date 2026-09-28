import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { startMarker } from '../content/marker/marker';
import { markerPorts } from '../content/marker/marker-ports';

// Marker renderer. Registered at runtime (scripting.registerContentScripts, src/platform/registration.ts)
// only for origins the user has granted, never statically via the manifest. See docs/plan.md §3.3.
// An unlisted script, not a WXT content script: WXT's content-script context announces itself to
// the page (postMessage + a DOM event carrying the extension ID); the marker's own singleton guard
// and orphan check (REQ-RND-012) do that job without telling the page anything.
export default defineUnlistedScript(() => {
  startMarker(markerPorts());
});
