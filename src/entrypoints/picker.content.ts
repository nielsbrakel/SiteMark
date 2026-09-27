import { defineContentScript } from 'wxt/utils/define-content-script';
import { startPicking } from '../content/picker/picker-ports';

// Element picker (docs/plan.md §3.4). Never registered and never in the manifest: the background
// injects it on demand through activeTab + scripting.executeScript (REQ-PICK-001,
// src/platform/picker-files.ts), so it works before any host permission exists.
export default defineContentScript({
  matches: ['*://*/*'],
  registration: 'runtime',
  main() {
    startPicking();
  },
});
