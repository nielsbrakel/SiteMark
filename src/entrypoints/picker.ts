import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { startPicking } from '../content/picker/picker-ports';

// Element picker (docs/plan.md §3.4). Never registered and never in the manifest: the background
// injects it on demand through activeTab + scripting.executeScript (REQ-PICK-001,
// src/platform/picker-files.ts), so it works before any host permission exists. An unlisted script
// for the same reason as the marker (src/entrypoints/marker.ts): nothing announces it to the page.
export default defineUnlistedScript(() => {
  startPicking();
});
