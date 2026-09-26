import { defineContentScript } from 'wxt/utils/define-content-script';
import { startMarker } from '../content/marker/marker';
import { markerPorts } from '../content/marker/marker-ports';

// Marker renderer. Registered at runtime (scripting.registerContentScripts)
// only for origins the user has granted, never statically via the manifest.
// See docs/plan.md §3.3.
export default defineContentScript({
  matches: ['*://*/*'],
  registration: 'runtime',
  main() {
    startMarker(markerPorts());
  },
});
